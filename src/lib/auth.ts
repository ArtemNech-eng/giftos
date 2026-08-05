import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/auth/sign-in");

  return { supabase, user };
}

export async function requireModerator() {
  const { supabase, user } = await requireUser();
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (role?.role !== "moderator" && role?.role !== "admin") redirect("/");

  return { supabase, user, role: role.role };
}
