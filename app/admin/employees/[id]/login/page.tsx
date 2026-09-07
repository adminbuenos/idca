import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/authorization";
import {
  canManageRoles,
  canManageUsers,
} from "@/lib/auth/user-management";

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

  const person = employee.people;

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
    const { data: roleData, error: rolesError } = await supabase
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

      <form
        action={createEmployeeLogin.bind(
          null,
          employee.id
        )}
        className="space-y-8"
      >
        {/* Account Information */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Account Information
          </h2>

          <div className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900"
              >
                Login Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={defaultEmail}
                placeholder="employee@example.com"
                className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />

              <p className="mt-1.5 text-xs text-gray-500">
                This email address will be used to sign in.
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900"
              >
                Temporary Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label
                htmlFor="confirm_password"
                className="block text-sm font-medium text-gray-900"
              >
                Confirm Password
              </label>

              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                minLength={8}
                placeholder="Re-enter temporary password"
                className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
          </div>
        </section>

        {/* Role */}
        {userCanManageRoles && (
          <section className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Access Role
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Select the role this employee will receive.
            </p>

            <div className="mt-5">
              <label
                htmlFor="role_id"
                className="block text-sm font-medium text-gray-900"
              >
                Role
              </label>

              <select
                id="role_id"
                name="role_id"
                className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              >
                <option value="">
                  No role
                </option>

                {roles.map((role) => (
                  <option
                    key={role.id}
                    value={role.id}
                  >
                    {role.name}
                  </option>
                ))}
              </select>

              <p className="mt-1.5 text-xs text-gray-500">
                Roles control what this employee can access
                and manage.
              </p>
            </div>
          </section>
        )}

        {/* Notice */}
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
          <p className="text-sm text-yellow-800">
            The employee will be able to use this account to
            sign in to the administration system.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/admin/employees/${employee.id}`}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Create Login
          </button>
        </div>
      </form>
    </main>
  );
}