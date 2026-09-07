import Link from "next/link";
import { requireAdmin } from "@/lib/auth/authorization";
import { createEmployee } from "./actions";
export default async function NewEmployeePage() {
  await requireAdmin();

  return (
    <main className="bg-gray-100">
      <section className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6">
          <Link
            href="/admin/employees"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Employees
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h1 className="text-2xl font-bold text-gray-900">
              Add Employee
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Add a new IDCA employee to the system.
            </p>
          </div>

          <form action={createEmployee} className="space-y-8 p-6">
            {/* Personal Information */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Personal Information
              </h2>

              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    First Name *
                  </label>

                  <input
                    id="first_name"
                    name="first_name"
                    required
                    className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="middle_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Middle Name
                  </label>

                  <input
                    id="middle_name"
                    name="middle_name"
                    className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Last Name
                  </label>

                  <input
                    id="last_name"
                    name="last_name"
                    className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Phone
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Address
                  </label>

                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>
              </div>
            </section>

            {/* Employee Information */}
            <section className="border-t border-gray-200 pt-8">
              <h2 className="text-lg font-semibold text-gray-900">
                Employee Information
              </h2>

              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="employee_code"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Employee Code
                  </label>

                  <input
                    id="employee_code"
                    name="employee_code"
                    className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="department"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Department
                  </label>

                  <input
                    id="department"
                    name="department"
                    className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="joining_date"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Joining Date
                  </label>

                  <input
                    id="joining_date"
                    name="joining_date"
                    type="date"
                    className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
              <Link
                href="/admin/employees"
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                Create Employee
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}