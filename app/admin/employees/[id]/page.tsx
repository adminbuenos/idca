import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/authorization";
import { disableEmployee } from "./actions";
import { canManageUsers } from "@/lib/auth/user-management";

type EmployeePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EmployeePage({
  params,
}: EmployeePageProps) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: employee, error } = await supabase
    .from("employees")
    .select(`
      id,
      division_id,
      employee_code,
      department,
      joining_date,
      leaving_date,
      status,
      created_at,
      updated_at,
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
    .eq("id", id)
    .single();

  if (error || !employee) {
    notFound();
  }

  const person = Array.isArray(employee.people)
  ? employee.people[0]
  : employee.people;

  /*
   * Check whether the current user is allowed to manage
   * login accounts for this employee's division.
   *
   * This is primarily useful for controlling the Create Login
   * action at the UI level. The server action also performs
   * its own authorization check.
   */
  const userCanManageUsers = await canManageUsers(
    employee.division_id
  );

  /*
   * Find an existing login account for this employee.
   */
  const {
    data: userProfile,
    error: userProfileError,
  } = await supabase
    .from("user_profiles")
    .select(`
      id,
      status
    `)
    .eq("person_id", person.id)
    .eq("division_id", employee.division_id)
    .maybeSingle();

  if (userProfileError) {
    console.error(
      "Failed to load employee login profile:",
      userProfileError
    );
  }

  const hasLogin = !!userProfile;

  /*
   * Load the employee's assigned role, if a login exists.
   */
  let assignedRole: string | null = null;

  if (userProfile) {
    const {
      data: userRole,
      error: userRoleError,
    } = await supabase
      .from("user_roles")
      .select(`
        roles (
          name
        )
      `)
      .eq("user_id", userProfile.id)
      .eq("division_id", employee.division_id)
      .maybeSingle();

    if (userRoleError) {
      console.error(
        "Failed to load employee login role:",
        userRoleError
      );
    }

   const role = Array.isArray(userRole?.roles)
  ? userRole.roles[0]
  : userRole?.roles;

assignedRole = role?.name ?? null;
  }

  const loginStatus = userProfile
    ? userProfile.status
    : null;

  const displayName =
    person?.display_name ||
    [person?.first_name, person?.middle_name, person?.last_name]
      .filter(Boolean)
      .join(" ");

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/admin/employees"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Back to Employees
          </Link>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            {displayName || "Employee"}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Employee profile and employment information
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/admin/employees/${employee.id}/edit`}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Edit Employee
          </Link>

          {employee.status === "ACTIVE" && (
            <form action={disableEmployee.bind(null, employee.id)}>
              <button
                type="submit"
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Disable Employee
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Personal Information
          </h2>

          <div className="mt-5 space-y-4">
            <Info label="Full Name" value={displayName} />
            <Info label="Email" value={person?.email} />
            <Info label="Phone" value={person?.phone} />
            <Info
              label="Date of Birth"
              value={person?.date_of_birth}
            />
            <Info label="Gender" value={person?.gender} />
          </div>
        </section>

        {/* Employment Information */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Employment Information
          </h2>

          <div className="mt-5 space-y-4">
            <Info
              label="Employee Code"
              value={employee.employee_code}
            />

            <Info
              label="Department"
              value={employee.department}
            />

            <Info
              label="Joining Date"
              value={employee.joining_date}
            />

            <Info
              label="Leaving Date"
              value={employee.leaving_date}
            />

            <Info
              label="Status"
              value={employee.status}
            />
          </div>
        </section>

        {/* Login & Access */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Login & Access
          </h2>

          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Login Status
              </p>

              <p className="mt-1 text-sm font-medium text-gray-900">
                {loginStatus === "ACTIVE"
                  ? "Active"
                  : loginStatus === "INACTIVE"
                    ? "Inactive"
                    : "No login account"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Assigned Role
              </p>

              <p className="mt-1 text-sm font-medium text-gray-900">
                {assignedRole ?? "—"}
              </p>
            </div>
          </div>

          {!hasLogin &&
            employee.status === "ACTIVE" &&
            userCanManageUsers && (
              <div className="mt-6">
                <Link
                  href={`/admin/employees/${employee.id}/login`}
                  className="inline-flex rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Create Login
                </Link>
              </div>
            )}
        </section>

        {/* Address */}
        <section className="rounded-xl border bg-white p-6 shadow-sm md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Address
          </h2>

          <div className="mt-5">
            <Info
              label="Address"
              value={person?.address}
            />

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Info label="City" value={person?.city} />
              <Info label="State" value={person?.state} />
              <Info
                label="Person Status"
                value={person?.status}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm text-gray-900">
        {value || "—"}
      </p>
    </div>
  );
}