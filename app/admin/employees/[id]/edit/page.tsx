import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/authorization";
import { updateEmployee } from "./actions";
type EditEmployeePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditEmployeePage({
  params,
}: EditEmployeePageProps) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: employee, error } = await supabase
    .from("employees")
    .select(`
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

  const person = employee.people;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <Link
          href={`/admin/employees/${employee.id}`}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Back to Employee
        </Link>

        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          Edit Employee
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Update personal and employment information.
        </p>
      </div>

      <form
  action={updateEmployee.bind(null, employee.id)}
  className="space-y-8"
>
        {/* Personal Information */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Personal Information
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="first_name"
                className="block text-sm font-medium text-gray-700"
              >
                First Name
              </label>

              <input
                id="first_name"
                name="first_name"
                type="text"
                defaultValue={person?.first_name ?? ""}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
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
                type="text"
                defaultValue={person?.middle_name ?? ""}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
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
                type="text"
                defaultValue={person?.last_name ?? ""}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
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
                defaultValue={person?.email ?? ""}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
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
                type="text"
                defaultValue={person?.phone ?? ""}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label
                htmlFor="date_of_birth"
                className="block text-sm font-medium text-gray-700"
              >
                Date of Birth
              </label>

              <input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                defaultValue={person?.date_of_birth ?? ""}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700"
              >
                Gender
              </label>

              <input
                id="gender"
                name="gender"
                type="text"
                defaultValue={person?.gender ?? ""}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div className="mt-5">
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
              defaultValue={person?.address ?? ""}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700"
              >
                City
              </label>

              <input
                id="city"
                name="city"
                type="text"
                defaultValue={person?.city ?? ""}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label
                htmlFor="state"
                className="block text-sm font-medium text-gray-700"
              >
                State
              </label>

              <input
                id="state"
                name="state"
                type="text"
                defaultValue={person?.state ?? ""}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
          </div>
        </section>

        {/* Employment Information */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Employment Information
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
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
                type="text"
                defaultValue={employee.employee_code ?? ""}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
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
                type="text"
                defaultValue={employee.department ?? ""}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
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
                defaultValue={employee.joining_date ?? ""}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/admin/employees/${employee.id}`}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Save Changes
          </button>
        </div>
      </form>
    </main>
  );
}