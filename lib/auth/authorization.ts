import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "CONTENT_MANAGER",
  "TOURNAMENT_MANAGER",
  "SCORE_OPERATOR",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export async function requireUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function requireAdmin() {
  const { supabase, user } = await requireUser();

  const { data: roles, error } = await supabase
    .from("user_roles")
    .select(
      `
      role_id,
      division_id,
      roles (
        id,
        name
      ),
      organizations (
        id,
        name,
        short_name
      )
    `
    )
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to load user roles:", error);
    redirect("/login");
  }

  const hasAdminAccess = roles?.some((item) =>
    ADMIN_ROLES.includes(item.roles?.name as AdminRole)
  );

  if (!hasAdminAccess) {
    redirect("/login");
  }

  return {
    supabase,
    user,
    roles,
  };
}