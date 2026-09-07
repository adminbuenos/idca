"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/authorization";

export async function disableEmployee(employeeId: string) {
  const { supabase, user } = await requireAdmin();

  /*
   * Fetch the existing employee.
   * We determine the division from the database, never from
   * browser-supplied data.
   */
  const { data: employee, error: employeeFetchError } = await supabase
    .from("employees")
    .select(`
      id,
      division_id,
      person_id,
      employee_code,
      department,
      joining_date,
      leaving_date,
      status,
      people (
        id,
        first_name,
        middle_name,
        last_name,
        display_name
      )
    `)
    .eq("id", employeeId)
    .single();

  if (employeeFetchError || !employee) {
    throw new Error(
      employeeFetchError?.message || "Employee not found."
    );
  }

  /*
   * Prevent disabling an employee who is already inactive.
   */
  if (employee.status === "INACTIVE") {
    throw new Error("Employee is already inactive.");
  }

  /*
   * Explicit application-level authorization.
   */
  const { data: hasPermission, error: permissionError } =
    await supabase.rpc("current_user_has_permission", {
      requested_permission: "employee.disable",
      requested_division: employee.division_id,
    });

  if (permissionError) {
    throw new Error(
      `Unable to verify permission: ${permissionError.message}`
    );
  }

  if (!hasPermission) {
    throw new Error(
      "You do not have permission to disable employees."
    );
  }

  /*
   * Capture the old employee state for the audit trail.
   */
  const oldData = {
    employee: {
      employee_code: employee.employee_code,
      department: employee.department,
      joining_date: employee.joining_date,
      leaving_date: employee.leaving_date,
      status: employee.status,
    },
  };

  /*
   * Disable the employee.
   *
   * We intentionally do NOT change people.status.
   * The person may have other relationships in the system.
   */
  const { error: updateError } = await supabase
    .from("employees")
    .update({
      status: "INACTIVE",
    })
    .eq("id", employeeId)
    .eq("division_id", employee.division_id);

  if (updateError) {
    throw new Error(
      `Failed to disable employee: ${updateError.message}`
    );
  }

  /*
   * Capture the new state.
   */
  const newData = {
    employee: {
      employee_code: employee.employee_code,
      department: employee.department,
      joining_date: employee.joining_date,
      leaving_date: employee.leaving_date,
      status: "INACTIVE",
    },
  };

  /*
   * Create audit record.
   */
  const { error: auditError } = await supabase
    .from("audit_logs")
    .insert({
      division_id: employee.division_id,
      user_id: user.id,
      action: "DISABLE",
      entity_type: "employee",
      entity_id: employeeId,
      old_data: oldData,
      new_data: newData,
      metadata: {
        source: "admin.employee.disable",
      },
    });

  if (auditError) {
    console.error(
      "Failed to create employee disable audit log:",
      auditError
    );

    throw new Error(
      `Employee was disabled, but audit logging failed: ${auditError.message}`
    );
  }

  redirect(`/admin/employees/${employeeId}`);
}