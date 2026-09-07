import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/authorization";
import {
  canManageRoles,
  canManageUsers,
} from "@/lib/auth/user-management";
import LoginForm from "./login-form";
import { createEmployeeLogin } from "../login-actions";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CreateLoginPage({
  params,
}: PageProps) {
  const { id } = await params;

  const { supabase } = await requireAdmin();

  /*
   * Fetch employee.
   */
  const { data: employee, error } = await supabase
    .from("employees")
    .select(`
      id,
      division_id,
      person_id,
      status,
      employee_code,
      department,
      people (
        id,
        first_name,
        middle_name,
        last_name,
        display_name,
        email
      )
    `)
    .eq("id", id)
    .single();

  if (error || !employee) {
    notFound();
  }

  const person = Array.isArray(employee.people)
    ? employee.people[0]
    : employee.people;

  if (!person) {
    notFound();
  }

  /*
   * Check account-management permission.
   */
  const userCanManageUsers = await canManageUsers(
    employee.division_id
  );

  if (!userCanManageUsers) {
    notFound();
  }

  /*
   * Check whether this employee already has a login.
   */
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select(`
      id,
      status
    `)
    .eq("person_id", person.id)
    .maybeSingle();

  if (existingProfile) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6">
          <Link
            href={`/admin/employees/${employee.id}`}
            className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
          >
            ← Back to Employee
          </Link>
        </div>

        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">
            Login Already Exists
          </h1>

          <p className="mt-3 text-sm text-gray-600">
            This employee already has a login account.
          </p>

          <div className="mt-6">
            <Link
              href={`/admin/employees/${employee.id}`}
              className="inline-flex rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Return to Employee
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
   * Only users with system.manage_roles can assign roles.
   */
  const userCanManageRoles = await canManageRoles(
    employee.division_id
  );

  /*
   * Load roles only for users who are allowed to assign them.
   */
  let roles: {
    id: string;
    name: string;
  }[] = [];

  if (userCanManageRoles) {
    const { data: roleData, error: rolesError } =
      await supabase
        .from("roles")
        .select(`
          id,
          name
        `)
        .order("name");

    if (rolesError) {
      throw new Error(
        `Failed to load roles: ${rolesError.message}`
      );
    }

    roles = roleData ?? [];
  }

  const employeeName =
    person.display_name ||
    [person.first_name, person.middle_name, person.last_name]
      .filter(Boolean)
      .join(" ");

  const defaultEmail = person.email ?? "";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <Link
          href={`/admin/employees/${employee.id}`}
          className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
        >
          ← Back to Employee
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-sm text-gray-500">
          Employee Login
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-gray-900">
          Create Login
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Create login access for{" "}
          <span className="font-medium text-gray-900">
            {employeeName}
          </span>
          .
        </p>
      </div>

      <LoginForm
        action={createEmployeeLogin.bind(null, employee.id)}
        defaultEmail={defaultEmail}
        roles={roles}
        canManageRoles={userCanManageRoles}
      />
    </main>
  );
}