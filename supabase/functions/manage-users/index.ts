
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
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !anonKey || !serviceKey) {
      return response({ error: "Server configuration missing" }, 500);
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return response({ error: "غير مصرح بالدخول" }, 401);
    }

    const callerClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
    });

    const { data: authData, error: authError } =
      await callerClient.auth.getUser();

    if (authError || !authData.user) {
      return response({ error: "جلسة الدخول غير صالحة" }, 401);
    }

    const admin = createClient(url, serviceKey);

    const { data: callerProfile, error: profileError } = await admin
      .from("users")
      .select("id, role, status")
      .eq("auth_user_id", authData.user.id)
      .single();

    if (
      profileError ||
      !callerProfile ||
      callerProfile.role !== "admin" ||
      callerProfile.status !== "active"
    ) {
      return response({ error: "ليس لديك صلاحية إدارة المستخدمين" }, 403);
    }

    const body = await req.json();
    const { action, id, data } = body;

    const safeFields = "id,name,email,role,status,created_at";
    const allowedRoles = ["admin", "manager", "cashier", "stock"];
    const allowedStatuses = ["active", "inactive"];

    if (action === "list") {
      const { data: users, error } = await admin
        .from("users")
        .select(safeFields)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return response({ data: users });
    }

    if (action === "create") {
      if (!data?.name || !data?.email || !data?.password) {
        return response({ error: "الاسم والبريد وكلمة المرور مطلوبة" }, 400);
      }

      if (String(data.password).length < 8) {
        return response({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, 400);
      }

      if (!allowedRoles.includes(data.role || "cashier")) {
        return response({ error: "الدور غير صالح" }, 400);
      }

      if (!allowedStatuses.includes(data.status || "active")) {
        return response({ error: "الحالة غير صالحة" }, 400);
      }

      const { data: newAuth, error: createAuthError } =
        await admin.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true,
        });

      if (createAuthError) throw createAuthError;

      const { data: newProfile, error: insertError } = await admin
        .from("users")
        .insert({
          auth_user_id: newAuth.user.id,
          name: data.name,
          email: data.email,
          role: data.role || "cashier",
          status: data.status || "active",
        })
        .select(safeFields)
        .single();

      if (insertError) {
        await admin.auth.admin.deleteUser(newAuth.user.id);
        throw insertError;
      }

      return response({ data: newProfile });
    }

    if (action === "update") {
      if (!id || !data) {
        return response({ error: "بيانات التعديل غير مكتملة" }, 400);
      }

      const { data: target, error: targetError } = await admin
        .from("users")
        .select("id,auth_user_id,role,status")
        .eq("id", id)
        .single();

      if (targetError || !target) {
        return response({ error: "المستخدم غير موجود" }, 404);
      }

      if (!target.auth_user_id) {
        return response({ error: "حساب المستخدم غير مرتبط بالمصادقة" }, 400);
      }

      if (data.role && !allowedRoles.includes(data.role)) {
        return response({ error: "الدور غير صالح" }, 400);
      }

      if (data.status && !allowedStatuses.includes(data.status)) {
        return response({ error: "الحالة غير صالحة" }, 400);
      }

      const removesAdmin =
        target.role === "admin" &&
        target.status === "active" &&
        ((data.role && data.role !== "admin") ||
          (data.status && data.status !== "active"));

      if (removesAdmin) {
        const { count } = await admin
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("role", "admin")
          .eq("status", "active");

        if ((count ?? 0) <= 1) {
          return response({ error: "لا يمكن تعطيل أو تخفيض صلاحية آخر مدير" }, 400);
        }
      }

      const authUpdates: Record<string, string> = {};

      if (data.email) authUpdates.email = data.email;

      if (data.password) {
        if (String(data.password).length < 8) {
          return response({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, 400);
        }
        authUpdates.password = data.password;
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error } = await admin.auth.admin.updateUserById(
          target.auth_user_id,
          authUpdates,
        );
        if (error) throw error;
      }

      const updates: Record<string, unknown> = {};

      for (const field of ["name", "email", "role", "status"]) {
        if (data[field] !== undefined) updates[field] = data[field];
      }

      const { data: updated, error } = await admin
        .from("users")
        .update(updates)
        .eq("id", id)
        .select(safeFields)
        .single();

      if (error) throw error;
      return response({ data: updated });
    }

    if (action === "delete") {
      if (!id) return response({ error: "معرف المستخدم مطلوب" }, 400);

      const { data: target, error: targetError } = await admin
        .from("users")
        .select("id,auth_user_id,role,status")
        .eq("id", id)
        .single();

      if (targetError || !target) {
        return response({ error: "المستخدم غير موجود" }, 404);
      }

      if (target.auth_user_id === authData.user.id) {
        return response({ error: "لا يمكنك حذف حسابك الحالي" }, 400);
      }

      if (target.role === "admin" && target.status === "active") {
        const { count } = await admin
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("role", "admin")
          .eq("status", "active");

        if ((count ?? 0) <= 1) {
          return response({ error: "لا يمكن حذف آخر مدير" }, 400);
        }
      }

      if (target.auth_user_id) {
        const { error } = await admin.auth.admin.deleteUser(
          target.auth_user_id,
        );
        if (error) throw error;
      }

      const { error } = await admin.from("users").delete().eq("id", id);
      if (error) throw error;

      return response({ success: true });
    }

    return response({ error: "عملية غير معروفة" }, 400);
  } catch (error) {
    console.error("manage-users error:", error);
    return response({
      error: error instanceof Error ? error.message : "حدث خطأ داخلي",
    }, 400);
  }
});
