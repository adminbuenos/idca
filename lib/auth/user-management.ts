import { createClient } from "@/lib/supabase/server";

export async function canManageUsers(divisionId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "current_user_has_permission",
    {
      requested_permission: "system.manage_users",
      requested_division: divisionId,
    }
  );

  if (error) {
    console.error("Failed to check user management permission:", error);
    return false;
  }

  return data === true;
}

export async function canManageRoles(divisionId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "current_user_has_permission",
    {
      requested_permission: "system.manage_roles",
      requested_division: divisionId,
    }
  );

  if (error) {
    console.error("Failed to check role management permission:", error);
    return false;
  }

  return data === true;
}