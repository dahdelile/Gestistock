
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =====================================================
// 1. CONFIGURATION CORS
// =====================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const response = (data: unknown, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
};

const allowedRoles = ["admin", "manager", "cashier", "stock"];
const allowedStatuses = ["active", "inactive"];
const safeFields = "id,name,email,role,status,created_at";

// =====================================================
// 2. EDGE FUNCTION
// =====================================================

Deno.serve(async (req: Request) => {

  // ---------------------------------------------------
  // CORS PREFLIGHT
  // ---------------------------------------------------

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Length": "0",
      },
    });
  }

  if (req.method !== "POST") {
    return response({ error: "Method not allowed" }, 405);
  }

  try {

    // -------------------------------------------------
    // 3. CONFIGURATION SUPABASE
    // -------------------------------------------------

    const url = Deno.env.get("SUPABASE_URL");

    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

    const serviceKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

    if (!url || !anonKey || !serviceKey) {
      console.error("Supabase environment variables missing");

      return response({
        error: "Server configuration missing",
      }, 500);
    }

    // -------------------------------------------------
    // 4. AUTHENTIFICATION
    // -------------------------------------------------

    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return response({
        error: "غير مصرح بالدخول",
      }, 401);
    }

    const callerClient = createClient(url, anonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: authData,
      error: authError,
    } = await callerClient.auth.getUser();

    if (authError || !authData.user) {
      return response({
        error: "جلسة الدخول غير صالحة",
      }, 401);
    }

    // -------------------------------------------------
    // 5. SERVICE ROLE CLIENT
    // -------------------------------------------------

    const admin = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // -------------------------------------------------
    // 6. VERIFICATION DU PROFIL ADMIN
    // -------------------------------------------------

    const {
      data: callerProfile,
      error: callerProfileError,
    } = await admin
      .from("users")
      .select("id, role, status")
      .eq("auth_user_id", authData.user.id)
      .maybeSingle();

    if (
      callerProfileError ||
      !callerProfile ||
      callerProfile.status !== "active"
    ) {
      console.error(
        "Caller profile verification failed:",
        callerProfileError,
      );

      return response({
        error: "حسابك غير نشط أو غير مصرح له",
      }, 403);
    }

    // -------------------------------------------------
    // 7. READ REQUEST
    // -------------------------------------------------

    let body: {
      action?: string;
      id?: number | string;
      data?: Record<string, unknown>;
    };

    try {
      body = await req.json();
    } catch {
      return response({
        error: "بيانات الطلب غير صالحة",
      }, 400);
    }

    const { action, id, data } = body ?? {};

    // Listing is allowed for active users.
    // Other operations require an administrator.

    if (
      action !== "list" &&
      callerProfile.role !== "admin"
    ) {
      return response({
        error: "هذه العملية مخصصة لمدير النظام فقط",
      }, 403);
    }

    // =================================================
    // 8. LIST USERS
    // =================================================

    if (action === "list") {

      const {
        data: users,
        error,
      } = await admin
        .from("users")
        .select(safeFields)
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;

      return response({
        data: users,
      });
    }

    // =================================================
    // 9. CREATE USER
    // =================================================

    if (action === "create") {

      if (
        typeof data?.name !== "string" ||
        !data.name.trim() ||
        typeof data?.email !== "string" ||
        !data.email.trim() ||
        typeof data?.password !== "string" ||
        !data.password
      ) {
        return response({
          error: "الاسم والبريد وكلمة المرور مطلوبة",
        }, 400);
      }

      if (data.password.length < 8) {
        return response({
          error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
        }, 400);
      }

      const name = data.name.trim();
      const email = data.email.trim().toLowerCase();

      const role = String(data.role || "cashier");
      const status = String(data.status || "active");

      if (!allowedRoles.includes(role)) {
        return response({
          error: "الدور غير صالح",
        }, 400);
      }

      if (!allowedStatuses.includes(status)) {
        return response({
          error: "الحالة غير صالحة",
        }, 400);
      }

      // Create Auth account.

      const {
        data: authResult,
        error: createAuthError,
      } = await admin.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          name,
          role,
        },
      });

      if (createAuthError) {
        throw createAuthError;
      }

      const authUserId = authResult.user.id;

      // Synchronize profiles.

      const {
        error: profileInsertError,
      } = await admin
        .from("profiles")
        .upsert(
          {
            id: authUserId,
            email,
            name,
            role,
            status,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          },
        );

      if (profileInsertError) {

        await admin.auth.admin.deleteUser(authUserId);

        throw profileInsertError;
      }

      // Insert application user.

      const {
        data: newUser,
        error: insertUserError,
      } = await admin
        .from("users")
        .insert({
          auth_user_id: authUserId,
          name,
          email,
          role,
          status,
        })
        .select(safeFields)
        .single();

      if (insertUserError) {

        await admin
          .from("profiles")
          .delete()
          .eq("id", authUserId);

        await admin.auth.admin.deleteUser(authUserId);

        throw insertUserError;
      }

      return response({
        data: newUser,
      });
    }

    // =================================================
    // 10. UPDATE USER
    // =================================================

    if (action === "update") {

      if (
        id === undefined ||
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
      ) {
        return response({
          error: "بيانات التعديل غير مكتملة",
        }, 400);
      }

      const {
        data: target,
        error: targetError,
      } = await admin
        .from("users")
        .select(
          "id,auth_user_id,name,email,role,status",
        )
        .eq("id", id)
        .maybeSingle();

      if (targetError || !target) {
        return response({
          error: "المستخدم غير موجود",
        }, 404);
      }

      if (!target.auth_user_id) {
        return response({
          error: "حساب المستخدم غير مرتبط بالمصادقة",
        }, 400);
      }

      if (
        data.role !== undefined &&
        (
          typeof data.role !== "string" ||
          !allowedRoles.includes(data.role)
        )
      ) {
        return response({
          error: "الدور غير صالح",
        }, 400);
      }

      if (
        data.status !== undefined &&
        (
          typeof data.status !== "string" ||
          !allowedStatuses.includes(data.status)
        )
      ) {
        return response({
          error: "الحالة غير صالحة",
        }, 400);
      }

      if (
        data.name !== undefined &&
        (
          typeof data.name !== "string" ||
          !data.name.trim()
        )
      ) {
        return response({
          error: "الاسم مطلوب",
        }, 400);
      }

      if (
        data.email !== undefined &&
        (
          typeof data.email !== "string" ||
          !data.email.trim()
        )
      ) {
        return response({
          error: "البريد الإلكتروني مطلوب",
        }, 400);
      }

      if (
        data.password !== undefined &&
        (
          typeof data.password !== "string" ||
          data.password.length < 8
        )
      ) {
        return response({
          error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
        }, 400);
      }

      // Protect the last active administrator.

      const removesAdmin =
        target.role === "admin" &&
        target.status === "active" &&
        (
          (data.role !== undefined && data.role !== "admin") ||
          (data.status !== undefined && data.status !== "active")
        );

      if (removesAdmin) {

        const {
          count,
          error: countError,
        } = await admin
          .from("users")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("role", "admin")
          .eq("status", "active");

        if (countError) throw countError;

        if ((count ?? 0) <= 1) {
          return response({
            error: "لا يمكن تعطيل أو تخفيض صلاحية آخر مدير",
          }, 400);
        }
      }

      // Prepare updates.

      const updates: Record<string, unknown> = {};

      if (data.name !== undefined) {
        updates.name = data.name.trim();
      }

      if (data.email !== undefined) {
        updates.email = data.email.trim().toLowerCase();
      }

      if (data.role !== undefined) {
        updates.role = data.role;
      }

      if (data.status !== undefined) {
        updates.status = data.status;
      }

      if (
        Object.keys(updates).length === 0 &&
        !data.password
      ) {
        return response({
          error: "لا توجد بيانات لتحديثها",
        }, 400);
      }

      const nextName = String(
        updates.name ?? target.name,
      ).trim();

      const nextEmail = String(
        updates.email ?? target.email,
      ).trim().toLowerCase();

      const nextRole = String(
        updates.role ?? target.role,
      );

      const nextStatus = String(
        updates.status ?? target.status,
      );

      // Update Auth account.

      const authUpdates: {
        email?: string;
        password?: string;
        user_metadata?: Record<string, unknown>;
      } = {};

      if (data.email !== undefined) {
        authUpdates.email = nextEmail;
      }

      if (data.password) {
        authUpdates.password = data.password;
      }

      if (
        data.name !== undefined ||
        data.role !== undefined
      ) {

        const {
          data: existingAuth,
          error: getAuthError,
        } = await admin.auth.admin.getUserById(
          target.auth_user_id,
        );

        if (getAuthError) throw getAuthError;

        authUpdates.user_metadata = {
          ...(existingAuth.user.user_metadata ?? {}),
          name: nextName,
          role: nextRole,
        };
      }

      if (Object.keys(authUpdates).length > 0) {

        const {
          error: authUpdateError,
        } = await admin.auth.admin.updateUserById(
          target.auth_user_id,
          authUpdates,
        );

        if (authUpdateError) throw authUpdateError;
      }

      // Update users table.

      let updatedUser = null;

      if (Object.keys(updates).length > 0) {

        const {
          data: updated,
          error: updateError,
        } = await admin
          .from("users")
          .update(updates)
          .eq("id", id)
          .select(safeFields)
          .single();

        if (updateError) throw updateError;

        updatedUser = updated;

      } else {

        const {
          data: current,
          error: currentError,
        } = await admin
          .from("users")
          .select(safeFields)
          .eq("id", id)
          .single();

        if (currentError) throw currentError;

        updatedUser = current;
      }

      // Synchronize profiles using Auth UUID.

      const {
        error: profileUpdateError,
      } = await admin
        .from("profiles")
        .upsert(
          {
            id: target.auth_user_id,
            email: nextEmail,
            name: nextName,
            role: nextRole,
            status: nextStatus,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          },
        );

      if (profileUpdateError) {

        console.error(
          "Profiles synchronization error:",
          profileUpdateError,
        );

        return response({
          error:
            "تم تحديث المستخدم، لكن تعذرت مزامنة جدول profiles",
        }, 500);
      }

      return response({
        data: updatedUser,
      });
    }

    // =================================================
    // 11. DELETE USER
    // =================================================

    if (action === "delete") {

      if (id === undefined) {
        return response({
          error: "معرف المستخدم مطلوب",
        }, 400);
      }

      const {
        data: target,
        error: targetError,
      } = await admin
        .from("users")
        .select("id,auth_user_id,role,status")
        .eq("id", id)
        .maybeSingle();

      if (targetError || !target) {
        return response({
          error: "المستخدم غير موجود",
        }, 404);
      }

      // Prevent deleting current user.

      if (target.auth_user_id === authData.user.id) {
        return response({
          error: "لا يمكنك حذف حسابك الحالي",
        }, 400);
      }

      // Protect last active admin.

      if (
        target.role === "admin" &&
        target.status === "active"
      ) {

        const {
          count,
          error: countError,
        } = await admin
          .from("users")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("role", "admin")
          .eq("status", "active");

        if (countError) throw countError;

        if ((count ?? 0) <= 1) {
          return response({
            error: "لا يمكن حذف آخر مدير",
          }, 400);
        }
      }

      // Delete Auth account and associated profile.

      if (target.auth_user_id) {

        const {
          error: authDeleteError,
        } = await admin.auth.admin.deleteUser(
          target.auth_user_id,
        );

        if (authDeleteError) throw authDeleteError;

        const {
          error: profileDeleteError,
        } = await admin
          .from("profiles")
          .delete()
          .eq("id", target.auth_user_id);

        if (profileDeleteError) {
          console.error(
            "Profile cleanup error:",
            profileDeleteError,
          );

          throw profileDeleteError;
        }
      }

      // Delete application user.

      const {
        error: deleteUserError,
      } = await admin
        .from("users")
        .delete()
        .eq("id", id);

      if (deleteUserError) throw deleteUserError;

      return response({
        success: true,
      });
    }

    // =================================================
    // 12. UNKNOWN ACTION
    // =================================================

    return response({
      error: "عملية غير معروفة",
    }, 400);

  } catch (error) {

    console.error(
      "manage-users error:",
      error,
    );

    return response({
      error:
        error instanceof Error
          ? error.message
          : "حدث خطأ داخلي",
    }, 500);
  }
});
