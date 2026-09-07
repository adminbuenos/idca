"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/authorization";

export async function createEmployee(formData: FormData) {
  const { supabase, user, roles } = await requireAdmin();

  const { data: division, error: divisionError } = await supabase
  .from("organizations")
  .select("id, name, short_name")
  .eq("slug", "indore")
  .eq("organization_type", "DIVISION")
  .single();

if (divisionError || !division) {
  console.error("Failed to load IDCA division:", divisionError);
  throw new Error("Unable to determine the employee's division.");
}

const divisionId = division.id;

  const firstName = String(formData.get("first_name") ?? "").trim();
  const middleName = String(formData.get("middle_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  const employeeCode = String(
    formData.get("employee_code") ?? ""
  ).trim();

  const department = String(
    formData.get("department") ?? ""
  ).trim();

  const joiningDate = String(
    formData.get("joining_date") ?? ""
  ).trim();

  if (!firstName) {
    throw new Error("First name is required.");
  }

  /*
   * Create the person record first.
   */
  const { data: person, error: personError } = await supabase
    .from("people")
    .insert({
      division_id: divisionId,
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName || null,
      display_name: [firstName, middleName, lastName]
        .filter(Boolean)
        .join(" "),
      email: email || null,
      phone: phone || null,
      address: address || null,
      status: "ACTIVE",
    })
    .select("id")
    .single();

  if (personError || !person) {
  console.error("Failed to create person:", {
    message: personError?.message,
    details: personError?.details,
    hint: personError?.hint,
    code: personError?.code,
  });

  throw new Error(
    personError?.message || "Unable to create person."
  );
}

  /*
   * Create the employee record.
   */
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .insert({
      division_id: divisionId,
      person_id: person.id,
      employee_code: employeeCode || null,
      department: department || null,
      joining_date: joiningDate || null,
      status: "ACTIVE",
    })
    .select("id")
    .single();

  if (employeeError || !employee) {
    console.error("Failed to create employee:", employeeError);

    /*
     * Clean up the person record if employee creation failed.
     */
    await supabase
      .from("people")
      .delete()
      .eq("id", person.id);

    throw new Error("Unable to create employee.");
  }

  /*
   * Audit the creation.
   */
  const { error: auditError } = await supabase
    .from("audit_logs")
    .insert({
      division_id: divisionId,
      user_id: user.id,
      action: "CREATE",
      entity_type: "employee",
      entity_id: employee.id,
      old_data: null,
      new_data: {
        employee_id: employee.id,
        person_id: person.id,
        employee_code: employeeCode || null,
        department: department || null,
        joining_date: joiningDate || null,
      },
      metadata: {
        source: "admin.employee.create",
      },
    });

  if (auditError) {
    console.error("Failed to create audit log:", auditError);

    /*
     * We do not fail the employee creation because of an
     * audit logging failure, but this will be addressed
     * with stronger transaction handling as the module matures.
     */
  }

  redirect("/admin/employees");
}