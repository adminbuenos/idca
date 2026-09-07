import Link from "next/link";
import { requireAdmin } from "@/lib/auth/authorization";

export default async function EmployeesPage() {
  const { supabase } = await requireAdmin();

  const { data: employees, error } = await supabase
    .from("employees")
    .select(
      `
      id,
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
        display_name,
        email,
        phone
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load employees:", error);

    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-semibold text-red-800">
              Unable to load employees
            </h1>

            <p className="mt-2 text-sm text-red-700">
              Please try again later.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gray-100">
      <section className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Employee Management
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage IDCA employees and their access.
            </p>
          </div>

          <Link
            href="/admin/employees/new"
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Add Employee
          </Link>
        </div>

        {/* Employee table */}
        <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    Employee
                  </th>

                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    Employee Code
                  </th>

                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    Department
                  </th>

                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    Contact
                  </th>

                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    Joining Date
                  </th>

                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {employees && employees.length > 0 ? (
                  employees.map((employee) => {
                    const person = Array.isArray(employee.people)
  ? employee.people[0]
  : employee.people;

                    const name =
                      person?.display_name ||
                      [
                        person?.first_name,
                        person?.middle_name,
                        person?.last_name,
                      ]
                        .filter(Boolean)
                        .join(" ") ||
                      "Unnamed Employee";

                    const status = employee.status;

                    return (
                      <tr
                        key={employee.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                         <Link
    href={`/admin/employees/${employee.id}`}
    className="font-medium text-gray-900 hover:underline"
  >
    {name}
  </Link>

                          {person?.email && (
                            <div className="mt-1 text-sm text-gray-500">
                              {person.email}
                            </div>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          {employee.employee_code || "—"}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          {employee.department || "—"}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          {person?.phone || "—"}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          {employee.joining_date
                            ? new Date(
                                employee.joining_date
                              ).toLocaleDateString("en-IN")
                            : "—"}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        No employees found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Add your first employee to get started.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-gray-500">
          {employees?.length ?? 0} employee
          {(employees?.length ?? 0) === 1 ? "" : "s"}
        </div>
      </section>
    </main>
  );
}