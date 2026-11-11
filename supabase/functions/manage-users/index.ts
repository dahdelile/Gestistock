
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return response({ error: "Method not allowed" }, 405);
  }

  try {
    // 1. Configuration
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !anonKey || !serviceKey) {
      return response({ error: "Server configuration missing" }, 500);
    }

    // 2. Verify authentication
    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return response({ error: "غير مصرح بالدخول" }, 401);
    }

    const callerClient = createClient(url, anonKey, {
      global: {
        headers: { Authorization: authorization },
      },
    });

    const { data: authData, error: authError } =
      await callerClient.auth.getUser();

    if (authError || !authData.user) {
      return response({ error: "جلسة الدخول غير صالحة" }, 401);
    }

    // 3. Admin client (server-side only)
    const admin = createClient(url, serviceKey);

    // 4. Get logged-in user's profile
    const { data: callerProfile, error: profileError } = await admin
      .from("users")
      .select("id, role, status")
      .eq("auth_user_id", authData.user.id)
      .single();

    // Every caller must have an active profile
    if (
      profileError ||
      !callerProfile ||
      callerProfile.status !== "active"
    ) {
      return response(
        { error: "حسابك غير نشط أو غير مصرح له" },
        403
      );
    }

    // 5. Read request
    const body = await req.json();
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
    if (action === "list") {
      const { data: users, error } = await admin
        .from("users")
        .select(safeFields)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return response({ data: users });
    }

    // 8. CREATE USER - Admin only
    if (action === "create") {
      if (
        !data?.name?.trim() ||
        !data?.email?.trim() ||
        !data?.password
      ) {
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

      const role = data.role || "cashier";
      const status = data.status || "active";

      if (!allowedRoles.includes(role)) {
        return response({ error: "الدور غير صالح" }, 400);
      }

      if (!allowedStatuses.includes(status)) {
        return response({ error: "الحالة غير صالحة" }, 400);
      }

      const email = String(data.email).trim().toLowerCase();

      // Create authentication account
      const { data: newAuth, error: createAuthError } =
        await admin.auth.admin.createUser({
          email,
          password: data.password,
          email_confirm: true,
        });

      if (createAuthError) throw createAuthError;

      // Create profile
      const { data: newProfile, error: insertError } =
        await admin
          .from("users")
          .insert({
            auth_user_id: newAuth.user.id,
            name: String(data.name).trim(),
            email,
            role,
            status,
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
      }

      const { data: target, error: targetError } = await admin
        .from("users")
        .select("id,auth_user_id,role,status")
        .eq("id", id)
        .single();

      if (targetError || !target) {
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
      }

      if (
        data.role !== undefined &&
        !allowedRoles.includes(data.role)
      ) {
        return response({ error: "الدور غير صالح" }, 400);
      }

      if (
        data.status !== undefined &&
        !allowedStatuses.includes(data.status)
      ) {
        return response({ error: "الحالة غير صالحة" }, 400);
      }

      if (
        data.name !== undefined &&
        !String(data.name).trim()
      ) {
        return response({ error: "الاسم مطلوب" }, 400);
      }

      if (
        data.email !== undefined &&
        !String(data.email).trim()
      ) {
        return response({ error: "البريد الإلكتروني مطلوب" }, 400);
      }

      // Prevent removing the last active admin
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
          .select("id", { count: "exact", head: true })
          .eq("role", "admin")
          .eq("status", "active");

        if (countError) throw countError;

        if ((count ?? 0) <= 1) {
          return response(
            { error: "لا يمكن تعطيل أو تخفيض صلاحية آخر مدير" },
            400
          );
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
    if (action === "delete") {
      if (!id) {
        return response(
          { error: "معرف المستخدم مطلوب" },
          400
        );
      }

      const { data: target, error: targetError } = await admin
        .from("users")
        .select("id,auth_user_id,role,status")
        .eq("id", id)
        .single();

      if (targetError || !target) {
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
      if (
        target.role === "admin" &&
        target.status === "active"
      ) {
        const { count, error: countError } = await admin
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("role", "admin")
          .eq("status", "active");

        if (countError) throw countError;

        if ((count ?? 0) <= 1) {
          return response(
            { error: "لا يمكن حذف آخر مدير" },
            400
          );
        }
      }

      // Delete authentication account
      if (target.auth_user_id) {
        const { error: authDeleteError } =
          await admin.auth.admin.deleteUser(
            target.auth_user_id
          );

        if (authDeleteError) throw authDeleteError;
      }

      // Delete user profile
      const { error: deleteError } = await admin
        .from("users")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      return response({ success: true });
    }

    return response(
      { error: "عملية غير معروفة" },
      400
    );

  } catch (error) {
    console.error("manage-users error:", error);

    return response(
      {
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ داخلي",
      },
      400
    );
  }
});
