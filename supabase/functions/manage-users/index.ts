
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =====================================================
// 1. CONFIGURATION CORS
// =====================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": [
    "authorization",
    "x-client-info",
    "apikey",
    "content-type",
    "x-supabase-api-version",
    "x-supabase-client-platform",
    "x-supabase-client-platform-version",
    "x-supabase-client-runtime",
    "x-supabase-client-runtime-version",
  ].join(", "),
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

// =====================================================
// 2. REPONSE JSON
// =====================================================

const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

<<<<<<< Updated upstream
=======
// =====================================================
// 3. ROLES ET STATUTS AUTORISES
// =====================================================

const allowedRoles = ["admin", "manager", "cashier", "stock"];
const allowedStatuses = ["active", "inactive"];

const safeFields = "id,name,email,role,status,created_at";

// =====================================================
// 4. EDGE FUNCTION
// =====================================================

>>>>>>> Stashed changes
Deno.serve(async (req) => {

  // OPTIONS : CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return response({ error: "Method not allowed" }, 405);
  }

  try {

    // =================================================
    // 5. CONFIGURATION SUPABASE
    // =================================================

    const url = Deno.env.get("SUPABASE_URL");

    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !anonKey || !serviceKey) {
<<<<<<< Updated upstream
      return response({ error: "Server configuration missing" }, 500);
    }

    // 2. Verify authentication
=======
      console.error("Supabase environment variables are missing.");

      return response({
        error: "Server configuration missing",
      }, 500);
    }

    // =================================================
    // 6. VERIFICATION DE LA SESSION
    // =================================================

>>>>>>> Stashed changes
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
    });

    const { data: authData, error: authError } =
      await callerClient.auth.getUser();

    if (authError || !authData.user) {
      return response({
        error: "جلسة الدخول غير صالحة",
      }, 401);
    }

<<<<<<< Updated upstream
    // 3. Admin client (server-side only)
    const admin = createClient(url, serviceKey);

    // 4. Get logged-in user's profile
    const { data: callerProfile, error: profileError } = await admin
      .from("users")
      .select("id, role, status")
      .eq("auth_user_id", authData.user.id)
      .single();
=======
    // =================================================
    // 7. CLIENT ADMIN (SERVICE ROLE)
    // =================================================

    const admin = createClient(url, serviceKey);

    // =================================================
    // 8. VERIFICATION DU COMPTE CONNECTE
    // =================================================

    const { data: callerProfile, error: callerProfileError } =
      await admin
        .from("users")
        .select("id, role, status")
        .eq("auth_user_id", authData.user.id)
        .single();
>>>>>>> Stashed changes

    // Every caller must have an active profile
    if (
      profileError ||
      !callerProfile ||
      callerProfile.status !== "active"
    ) {
<<<<<<< Updated upstream
      return response(
        { error: "حسابك غير نشط أو غير مصرح له" },
        403
      );
=======
      return response({
        error: "حسابك غير نشط أو غير مصرح له",
      }, 403);
>>>>>>> Stashed changes
    }

    // =================================================
    // 9. LECTURE DE LA REQUETE
    // =================================================

    const body = await req.json();
<<<<<<< Updated upstream
    const { action, id, data } = body;

    const safeFields = "id,name,email,role,status,created_at";

    const allowedRoles = [
      "admin",
      "manager",
      "cashier",
      "stock",
    ];

    const allowedStatuses = [
      "active",
      "inactive",
    ];

    // 6. Only list is available to all active users
    // Create, update and delete are restricted to admins
    if (
      action !== "list" &&
      callerProfile.role !== "admin"
    ) {
      return response(
        { error: "هذه العملية مخصصة لمدير النظام فقط" },
        403
      );
    }

    // 7. LIST USERS - All active users
=======

    const { action, id, data } = body ?? {};

    if (!["list", "create", "update", "delete"].includes(action)) {
      return response({
        error: "عملية غير معروفة",
      }, 400);
    }

    // Seuls les administrateurs peuvent modifier les utilisateurs.
    if (action !== "list" && callerProfile.role !== "admin") {
      return response({
        error: "هذه العملية مخصصة لمدير النظام فقط",
      }, 403);
    }

    // =================================================
    // 10. LIST USERS
    // =================================================

>>>>>>> Stashed changes
    if (action === "list") {
      const { data: users, error } = await admin
        .from("users")
        .select(safeFields)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return response({
        data: users,
      });
    }

<<<<<<< Updated upstream
    // 8. CREATE USER - Admin only
=======
    // =================================================
    // 11. CREATE USER
    // =================================================

>>>>>>> Stashed changes
    if (action === "create") {

      if (
        !data?.name?.trim() ||
        !data?.email?.trim() ||
        !data?.password
      ) {
<<<<<<< Updated upstream
        return response(
          { error: "الاسم والبريد وكلمة المرور مطلوبة" },
          400
        );
      }

      if (String(data.password).length < 8) {
        return response(
          { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
          400
        );
      }

=======
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

>>>>>>> Stashed changes
      const role = data.role || "cashier";
      const status = data.status || "active";

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

<<<<<<< Updated upstream
      const email = String(data.email).trim().toLowerCase();

      // Create authentication account
      const { data: newAuth, error: createAuthError } =
=======
      // Créer le compte Auth avec le rôle choisi.
      const { data: authResult, error: createAuthError } =
>>>>>>> Stashed changes
        await admin.auth.admin.createUser({
          email,
          password: data.password,
          email_confirm: true,
        });

      if (createAuthError) throw createAuthError;

<<<<<<< Updated upstream
      // Create profile
      const { data: newProfile, error: insertError } =
        await admin
          .from("users")
          .insert({
            auth_user_id: newAuth.user.id,
            name: String(data.name).trim(),
=======
      const authUserId = authResult.user.id;

      // Synchroniser profiles avec le vrai UUID Auth.
      const { error: profileInsertError } = await admin
        .from("profiles")
        .upsert(
          {
            id: authUserId,
>>>>>>> Stashed changes
            email,
            role,
            status,
<<<<<<< Updated upstream
          })
          .select(safeFields)
          .single();

      // Rollback authentication account if profile creation fails
      if (insertError) {
        await admin.auth.admin.deleteUser(newAuth.user.id);
        throw insertError;
      }

      return response({ data: newProfile });
    }

    // 9. UPDATE USER - Admin only
    if (action === "update") {
      if (!id || !data || typeof data !== "object") {
        return response(
          { error: "بيانات التعديل غير مكتملة" },
          400
        );
=======
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          },
        );

      if (profileInsertError) {
        await admin
          .from("profiles")
          .delete()
          .eq("id", authUserId);

        await admin.auth.admin.deleteUser(authUserId);

        throw profileInsertError;
      }

      // Créer la ligne de l'application.
      const { data: newUser, error: insertUserError } = await admin
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
    // 12. UPDATE USER
    // =================================================

    if (action === "update") {

      if (
        !id ||
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
      ) {
        return response({
          error: "بيانات التعديل غير مكتملة",
        }, 400);
>>>>>>> Stashed changes
      }

      const { data: target, error: targetError } = await admin
        .from("users")
        .select("id,auth_user_id,role,status")
        .eq("id", id)
        .single();

      if (targetError || !target) {
<<<<<<< Updated upstream
        return response(
          { error: "المستخدم غير موجود" },
          404
        );
      }

      if (!target.auth_user_id) {
        return response(
          { error: "حساب المستخدم غير مرتبط بالمصادقة" },
          400
        );
=======
        return response({
          error: "المستخدم غير موجود",
        }, 404);
      }

      if (!target.auth_user_id) {
        return response({
          error: "حساب المستخدم غير مرتبط بالمصادقة",
        }, 400);
>>>>>>> Stashed changes
      }

      if (
        data.role !== undefined &&
        !allowedRoles.includes(data.role)
      ) {
        return response({
          error: "الدور غير صالح",
        }, 400);
      }

      if (
        data.status !== undefined &&
        !allowedStatuses.includes(data.status)
      ) {
        return response({
          error: "الحالة غير صالحة",
        }, 400);
      }

      if (
        data.name !== undefined &&
        !String(data.name).trim()
      ) {
        return response({
          error: "الاسم مطلوب",
        }, 400);
      }

      if (
        data.email !== undefined &&
        !String(data.email).trim()
      ) {
        return response({
          error: "البريد الإلكتروني مطلوب",
        }, 400);
      }

<<<<<<< Updated upstream
      // Prevent removing the last active admin
=======
      // Empêcher de désactiver le dernier administrateur actif.
>>>>>>> Stashed changes
      const removesAdmin =
        target.role === "admin" &&
        target.status === "active" &&
        (
          (data.role !== undefined && data.role !== "admin") ||
          (data.status !== undefined && data.status !== "active")
        );

      if (removesAdmin) {
        const { count, error: countError } = await admin
          .from("users")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("role", "admin")
          .eq("status", "active");

        if (countError) throw countError;

        if ((count ?? 0) <= 1) {
<<<<<<< Updated upstream
          return response(
            { error: "لا يمكن تعطيل أو تخفيض صلاحية آخر مدير" },
            400
          );
=======
          return response({
            error: "لا يمكن تعطيل أو تخفيض صلاحية آخر مدير",
          }, 400);
>>>>>>> Stashed changes
        }
      }

      // Update authentication information
      const authUpdates: Record<string, string> = {};

      if (data.email !== undefined) {
        authUpdates.email = String(data.email).trim().toLowerCase();
      }

      if (data.password) {
        if (String(data.password).length < 8) {
          return response(
            { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
            400
          );
        }

        authUpdates.password = data.password;
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authUpdateError } =
          await admin.auth.admin.updateUserById(
            target.auth_user_id,
            authUpdates
          );

        if (authUpdateError) throw authUpdateError;
      }

      // Update only allowed profile fields
      const updates: Record<string, unknown> = {};

      if (data.name !== undefined) {
        updates.name = String(data.name).trim();
      }

      if (data.email !== undefined) {
        updates.email = String(data.email).trim().toLowerCase();
      }

      if (data.role !== undefined) {
        updates.role = data.role;
      }

      if (data.status !== undefined) {
        updates.status = data.status;
      }

<<<<<<< Updated upstream
      if (Object.keys(updates).length === 0) {
        return response(
          { error: "لا توجد بيانات لتحديثها" },
          400
        );
      }

      const { data: updated, error: updateError } = await admin
        .from("users")
        .update(updates)
        .eq("id", id)
        .select(safeFields)
        .single();

      if (updateError) throw updateError;

      return response({ data: updated });
    }

    // 10. DELETE USER - Admin only
=======
      if (
        Object.keys(updates).length === 0 &&
        !data.password
      ) {
        return response({
          error: "لا توجد بيانات لتحديثها",
        }, 400);
      }

      if (
        data.password &&
        String(data.password).length < 8
      ) {
        return response({
          error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
        }, 400);
      }

      const nextName = String(
        updates.name ?? target.name
      ).trim();

      const nextEmail = String(
        updates.email ?? target.email
      ).trim().toLowerCase();

      const nextRole = String(
        updates.role ?? target.role
      );

      const nextStatus = String(
        updates.status ?? target.status
      );

      // Mettre à jour Auth.
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
        const { data: existingAuth, error: getAuthError } =
          await admin.auth.admin.getUserById(
            target.auth_user_id
          );

        if (getAuthError) throw getAuthError;

        authUpdates.user_metadata = {
          ...(existingAuth.user.user_metadata ?? {}),
          name: nextName,
          role: nextRole,
        };
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authUpdateError } =
          await admin.auth.admin.updateUserById(
            target.auth_user_id,
            authUpdates
          );

        if (authUpdateError) throw authUpdateError;
      }

      // Mettre à jour users.
      let updatedUser = null;

      if (Object.keys(updates).length > 0) {
        const { data: updated, error: updateError } = await admin
          .from("users")
          .update(updates)
          .eq("id", id)
          .select(safeFields)
          .single();

        if (updateError) throw updateError;

        updatedUser = updated;
      } else {
        const { data: current, error: currentError } = await admin
          .from("users")
          .select(safeFields)
          .eq("id", id)
          .single();

        if (currentError) throw currentError;

        updatedUser = current;
      }

      // Synchroniser profiles avec auth_user_id.
      const { error: profileUpdateError } = await admin
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
          "profiles synchronization error:",
          profileUpdateError
        );

        return response({
          error: "تم تحديث المستخدم، لكن تعذرت مزامنة profiles",
        }, 500);
      }

      return response({
        data: updatedUser,
      });
    }

    // =================================================
    // 13. DELETE USER
    // =================================================

>>>>>>> Stashed changes
    if (action === "delete") {

      if (!id) {
<<<<<<< Updated upstream
        return response(
          { error: "معرف المستخدم مطلوب" },
          400
        );
=======
        return response({
          error: "معرف المستخدم مطلوب",
        }, 400);
>>>>>>> Stashed changes
      }

      const { data: target, error: targetError } = await admin
        .from("users")
        .select("id,auth_user_id,role,status")
        .eq("id", id)
        .single();

      if (targetError || !target) {
<<<<<<< Updated upstream
        return response(
          { error: "المستخدم غير موجود" },
          404
        );
      }

      // Prevent deleting the current account
      if (target.auth_user_id === authData.user.id) {
        return response(
          { error: "لا يمكنك حذف حسابك الحالي" },
          400
        );
      }

      // Prevent deleting the last active admin
=======
        return response({
          error: "المستخدم غير موجود",
        }, 404);
      }

      // Ne pas supprimer le compte actuellement connecté.
      if (target.auth_user_id === authData.user.id) {
        return response({
          error: "لا يمكنك حذف حسابك الحالي",
        }, 400);
      }

      // Ne pas supprimer le dernier administrateur actif.
>>>>>>> Stashed changes
      if (
        target.role === "admin" &&
        target.status === "active"
      ) {
        const { count, error: countError } = await admin
          .from("users")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("role", "admin")
          .eq("status", "active");

        if (countError) throw countError;

        if ((count ?? 0) <= 1) {
<<<<<<< Updated upstream
          return response(
            { error: "لا يمكن حذف آخر مدير" },
            400
          );
=======
          return response({
            error: "لا يمكن حذف آخر مدير",
          }, 400);
>>>>>>> Stashed changes
        }
      }

      // Delete authentication account
      if (target.auth_user_id) {
<<<<<<< Updated upstream
=======

        // Supprimer le compte Auth.
>>>>>>> Stashed changes
        const { error: authDeleteError } =
          await admin.auth.admin.deleteUser(
            target.auth_user_id
          );

        if (authDeleteError) throw authDeleteError;
<<<<<<< Updated upstream
      }

      // Delete user profile
      const { error: deleteError } = await admin
=======

        // Supprimer profiles avec le vrai Auth UUID.
        const { error: profileDeleteError } = await admin
          .from("profiles")
          .delete()
          .eq("id", target.auth_user_id);

        if (profileDeleteError) {
          console.error(
            "profiles cleanup error:",
            profileDeleteError
          );

          throw profileDeleteError;
        }
      }

      // Supprimer la ligne users.
      const { error: deleteUserError } = await admin
>>>>>>> Stashed changes
        .from("users")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      return response({
        success: true,
      });
    }

<<<<<<< Updated upstream
    return response(
      { error: "عملية غير معروفة" },
      400
    );
=======
    return response({
      error: "عملية غير معروفة",
    }, 400);
>>>>>>> Stashed changes

  } catch (error) {

    console.error("manage-users error:", error);

<<<<<<< Updated upstream
    return response(
      {
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ داخلي",
      },
      400
    );
=======
    return response({
      error:
        error instanceof Error
          ? error.message
          : "حدث خطأ داخلي",
    }, 400);
>>>>>>> Stashed changes
  }
});
