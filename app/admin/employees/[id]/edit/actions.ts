"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/authorization";

export async function updateEmployee(
  employeeId: string,
  formData: FormData
) {
  const { supabase, user } = await requireAdmin();

  /*
   * First fetch the employee and determine the division from the
   * employee record itself. We never trust a division supplied
   * by the browser.
   */
  const { data: existingEmployee, error: employeeFetchError } =
    await supabase
      .from("employees")
      .select(`
        id,
        division_id,
        employee_code,
        department,
        joining_date,
        leaving_date,
        status,
        person_id,
        people (
          id,
          first_name,
          middle_name,
          last_name,
          display_name,
          email,
          phone,
          address,
          city,
          state,
          date_of_birth,
          gender,
          status
        )
      `)
      .eq("id", employeeId)
      .single();

  if (employeeFetchError || !existingEmployee) {
    throw new Error(
      employeeFetchError?.message || "Employee not found."
    );
  }

  const divisionId = existingEmployee.division_id;
  const person = existingEmployee.people;

  if (!person) {
    throw new Error("Employee person record was not found.");
  }

  /*
   * Read submitted values.
   */
  const firstName = String(formData.get("first_name") ?? "").trim();
  const middleName = String(formData.get("middle_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const dateOfBirth = String(
    formData.get("date_of_birth") ?? ""
  ).trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();

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
   * Build display name consistently.
   */
  const displayName = [
    firstName,
    middleName,
    lastName,
  ]
    .filter(Boolean)
    .join(" ");

  /*
   * Capture the old values for the audit trail.
   */
  const oldData = {
    employee: {
      employee_code: existingEmployee.employee_code,
      department: existingEmployee.department,
      joining_date: existingEmployee.joining_date,
    },
    person: {
      first_name: person.first_name,
      middle_name: person.middle_name,
      last_name: person.last_name,
      display_name: person.display_name,
      email: person.email,
      phone: person.phone,
      address: person.address,
      city: person.city,
      state: person.state,
      date_of_birth: person.date_of_birth,
      gender: person.gender,
    },
  };

  /*
   * Update the people record.
   */
  const { error: personUpdateError } = await supabase
    .from("people")
    .update({
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName || null,
      display_name: displayName || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      date_of_birth: dateOfBirth || null,
      gender: gender || null,
    })
    .eq("id", person.id)
    .eq("division_id", divisionId);

  if (personUpdateError) {
    throw new Error(
      `Failed to update personal information: ${personUpdateError.message}`
    );
  }

  /*
   * Update the employees record.
   */
  const { error: employeeUpdateError } = await supabase
    .from("employees")
    .update({
      employee_code: employeeCode || null,
      department: department || null,
      joining_date: joiningDate || null,
    })
    .eq("id", employeeId)
    .eq("division_id", divisionId);

  if (employeeUpdateError) {
    throw new Error(
      `Failed to update employment information: ${employeeUpdateError.message}`
    );
  }

  /*
   * Capture the new values for the audit trail.
   */
  const newData = {
    employee: {
      employee_code: employeeCode || null,
      department: department || null,
      joining_date: joiningDate || null,
    },
    person: {
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName || null,
      display_name: displayName || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      date_of_birth: dateOfBirth || null,
      gender: gender || null,
    },
  };

  /*
   * Create audit record.
   */
  const { error: auditError } = await supabase
    .from("audit_logs")
    .insert({
      division_id: divisionId,
      user_id: user.id,
      action: "UPDATE",
      entity_type: "employee",
      entity_id: employeeId,
      old_data: oldData,
      new_data: newData,
      metadata: {
        source: "admin.employee.update",
      },
    });

  if (auditError) {
    console.error("Failed to create employee audit log:", auditError);

    throw new Error(
      `Employee was updated, but audit logging failed: ${auditError.message}`
    );
  }

  redirect(`/admin/employees/${employeeId}`);
}