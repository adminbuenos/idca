"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/authorization";
import {
  canManageRoles,
  canManageUsers,
} from "@/lib/auth/user-management";

type CreateEmployeeLoginResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export async function createEmployeeLogin(
  employeeId: string,
  formData: FormData
): Promise<CreateEmployeeLoginResult> {
  const { supabase, user } = await requireAdmin();

  /*
   * Fetch employee and associated person.
   */
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select(`
      id,
      division_id,
      person_id,
      status,
      people (
        id,
        email,
        first_name,
        middle_name,
        last_name,
        display_name
      )
    `)
    .eq("id", employeeId)
    .single();

  if (employeeError || !employee) {
    return {
      success: false,
      error: "Employee not found.",
    };
  }

  if (employee.status !== "ACTIVE") {
    return {
      success: false,
      error: "Login cannot be created for an inactive employee.",
    };
  }

  const person = employee.people;

  if (!person) {
    return {
      success: false,
      error: "Employee does not have an associated person record.",
    };
  }

  /*
   * Anyone creating an employee login must have
   * system.manage_users.
   */
  const userCanManageUsers = await canManageUsers(
    employee.division_id
  );

  if (!userCanManageUsers) {
    return {
      success: false,
      error: "You do not have permission to create login accounts.",
    };
  }

  /*
   * Read form values.
   */
  const email =
    String(formData.get("email") ?? "").trim().toLowerCase();

  const password = String(formData.get("password") ?? "");

const confirmPassword = String(
  formData.get("confirm_password") ?? ""
);

const requestedRoleId =
  String(formData.get("role_id") ?? "").trim();

  if (!email) {
    return {
      success: false,
      error: "Email address is required.",
    };
  }

  if (!password) {
    return {
      success: false,
      error: "Password is required.",
    };
  }

  if (password.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters.",
    };
  }
if (password !== confirmPassword) {
  return {
    success: false,
    error: "Passwords do not match.",
  };
}
  /*
   * Only SUPER_ADMIN / users with system.manage_roles
   * may assign a role.
   *
   * ADMIN can therefore create the login without
   * assigning a role.
   */
  const userCanManageRoles = await canManageRoles(
    employee.division_id
  );

  let role:
    | {
        id: string;
        name: string;
      }
    | null = null;

  if (requestedRoleId) {
    if (!userCanManageRoles) {
      return {
        success: false,
        error: "You do not have permission to assign roles.",
      };
    }

    /*
     * Never trust the role ID supplied by the browser.
     * Validate it against the database.
     */
    const { data: selectedRole, error: roleError } =
      await supabase
        .from("roles")
        .select(`
          id,
          name
        `)
        .eq("id", requestedRoleId)
        .single();

    if (roleError || !selectedRole) {
      return {
        success: false,
        error: "Selected role is invalid.",
      };
    }

    role = selectedRole;
  }

  /*
   * Check whether this employee already has a login.
   */
  const { data: existingProfile, error: profileCheckError } =
    await supabase
      .from("user_profiles")
      .select(`
        id,
        status
      `)
      .eq("person_id", person.id)
      .maybeSingle();

  if (profileCheckError) {
    return {
      success: false,
      error: `Unable to check existing login: ${profileCheckError.message}`,
    };
  }

  if (existingProfile) {
    return {
      success: false,
      error: "This employee already has a login account.",
    };
  }

  /*
   * Create the Supabase Auth account using the
   * server-only service-role client.
   */
  const adminClient = createAdminClient();

  const {
    data: authData,
    error: authError,
  } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return {
      success: false,
      error: `Failed to create login account: ${
        authError?.message ?? "Unknown error"
      }`,
    };
  }

  const authUserId = authData.user.id;

  /*
   * Application-level setup.
   *
   * If anything fails, the Auth account is removed
   * to avoid leaving an orphaned login.
   */
  try {
    /*
     * Create user profile.
     */
    const { error: userProfileError } = await supabase
      .from("user_profiles")
      .insert({
        id: authUserId,
        division_id: employee.division_id,
        person_id: person.id,
        status: "ACTIVE",
      });

    if (userProfileError) {
      throw new Error(
        `Failed to create user profile: ${userProfileError.message}`
      );
    }

    /*
     * Assign role only when a role was explicitly supplied.
     */
    if (role) {
      const { error: userRoleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authUserId,
          role_id: role.id,
          division_id: employee.division_id,
        });

      if (userRoleError) {
        throw new Error(
          `Failed to assign role: ${userRoleError.message}`
        );
      }
    }

    /*
     * Audit login account creation.
     */
    const { error: accountAuditError } = await supabase
      .from("audit_logs")
      .insert({
        division_id: employee.division_id,
        user_id: user.id,
        action: "CREATE",
        entity_type: "user_profile",
        entity_id: authUserId,
        old_data: null,
        new_data: {
          user_id: authUserId,
          person_id: person.id,
          employee_id: employee.id,
          email,
          status: "ACTIVE",
        },
        metadata: {
          source: "admin.employee.login.create",
        },
      });

    if (accountAuditError) {
      throw new Error(
        `Failed to create account audit log: ${accountAuditError.message}`
      );
    }

    /*
     * Audit role assignment only when a role was assigned.
     */
    if (role) {
      const { error: roleAuditError } = await supabase
        .from("audit_logs")
        .insert({
          division_id: employee.division_id,
          user_id: user.id,
          action: "ASSIGN_ROLE",
          entity_type: "user_role",
          entity_id: authUserId,
          old_data: null,
          new_data: {
            user_id: authUserId,
            role_id: role.id,
            role_name: role.name,
            division_id: employee.division_id,
          },
          metadata: {
            source: "admin.employee.login.create",
          },
        });

      if (roleAuditError) {
        throw new Error(
          `Failed to create role audit log: ${roleAuditError.message}`
        );
      }
    }
  } catch (error) {
    /*
     * Compensating cleanup:
     * delete the Auth account if application setup fails.
     */
    const { error: cleanupError } =
      await adminClient.auth.admin.deleteUser(authUserId);

    if (cleanupError) {
      console.error(
        "Failed to clean up orphaned Auth user:",
        cleanupError
      );
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to finish login account creation.",
    };
  }

  redirect(`/admin/employees/${employeeId}`);
}