import Link from "next/link";
import { requireAdmin } from "@/lib/auth/authorization";

const IDCA_DIVISION_ID =
  "89304127-99c2-4427-8edd-87a9aff3e167";

type Club = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  status: string;
};

export default async function ClubsPage() {
  const { supabase } = await requireAdmin();

  const { data: clubs, error } = await supabase
    .from("clubs")
    .select(`
      id,
      name,
      short_name,
      slug,
      status
    `)
    .eq("division_id", IDCA_DIVISION_ID)
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load clubs:", error);
    throw new Error("Failed to load clubs.");
  }

  const clubList = (clubs ?? []) as Club[];

  const activeCount = clubList.filter(
    (club) => club.status === "ACTIVE"
  ).length;

  const inactiveCount = clubList.filter(
    (club) => club.status !== "ACTIVE"
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Clubs
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage clubs registered with Indore Division Cricket Association.
            </p>
          </div>

          <Link
            href="/admin/clubs/new"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Add Club
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Clubs
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {clubList.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Active
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {activeCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Inactive
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-500">
              {inactiveCount}
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {clubList.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <h2 className="text-lg font-semibold text-slate-900">
                No clubs yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Add the first club to begin building the IDCA club directory.
              </p>

              <Link
                href="/admin/clubs/new"
                className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Add First Club
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Club
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Short Name
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {clubList.map((club) => (
                    <tr key={club.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {club.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {club.slug}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {club.short_name ?? "—"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            club.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {club.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/clubs/${club.id}`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                        >
                          View / Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
