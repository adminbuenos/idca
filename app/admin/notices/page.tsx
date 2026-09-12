import Link from "next/link";
import { requireAdmin } from "@/lib/auth/authorization";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  REVIEW: "bg-amber-100 text-amber-800",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-slate-200 text-slate-700",
};

export default async function AdminNoticesPage() {
  const { supabase } = await requireAdmin();

  const { data: notices, error } = await supabase
    .from("notices")
    .select(`
      id,
      notice_number,
      title,
      slug,
      category,
      status,
      created_at,
      updated_at,
      published_at,
      sessions (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load notices:", error);
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#ef6c00]">
              IDCA Administration
            </p>

            <h1 className="text-3xl font-black tracking-tight text-[#071b2a] sm:text-4xl">
              Notices
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Create, review, publish and manage official IDCA notices.
            </p>
          </div>

          <Link
            href="/admin/notices/new"
            className="inline-flex items-center justify-center rounded-xl bg-[#ef6c00] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#d95f00]"
          >
            + Create Notice
          </Link>
        </div>

        {/* Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total"
            value={notices?.length ?? 0}
          />

          <SummaryCard
            label="Draft"
            value={
              notices?.filter((notice) => notice.status === "DRAFT").length ?? 0
            }
          />

          <SummaryCard
            label="In Review"
            value={
              notices?.filter((notice) => notice.status === "REVIEW").length ?? 0
            }
          />

          <SummaryCard
            label="Published"
            value={
              notices?.filter((notice) => notice.status === "PUBLISHED").length ??
              0
            }
          />
        </div>

        {/* Notices table */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-bold text-[#071b2a]">
              All Notices
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Latest notices appear first.
            </p>
          </div>

          {error ? (
            <div className="px-6 py-10 text-center">
              <p className="font-semibold text-red-600">
                Unable to load notices.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Please try again.
              </p>
            </div>
          ) : !notices || notices.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-2xl">
                📢
              </div>

              <h3 className="mt-4 text-lg font-bold text-[#071b2a]">
                No notices yet
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Create your first official IDCA notice.
              </p>

              <Link
                href="/admin/notices/new"
                className="mt-5 inline-flex rounded-xl bg-[#ef6c00] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#d95f00]"
              >
                Create Notice
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-[#071b2a] text-xs uppercase tracking-wider text-white">
                  <tr>
                    <th className="px-6 py-4">Notice</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Session</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Published</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {notices.map((notice) => {
                    const session = Array.isArray(notice.sessions)
                      ? notice.sessions[0]
                      : notice.sessions;

                    return (
                      <tr
                        key={notice.id}
                        className="transition hover:bg-orange-50/40"
                      >
                        <td className="px-6 py-5">
                          <div>
                            {notice.notice_number && (
                              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#ef6c00]">
                                {notice.notice_number}
                              </p>
                            )}

                            <p className="font-bold text-[#071b2a]">
                              {notice.title}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              /{notice.slug}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-sm text-gray-600">
                          {notice.category || "—"}
                        </td>

                        <td className="px-6 py-5 text-sm text-gray-600">
                          {session?.name || "—"}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              STATUS_STYLES[notice.status] ||
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {notice.status}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm text-gray-600">
                          {notice.published_at
                            ? new Date(
                                notice.published_at
                              ).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>

                        <td className="px-6 py-5 text-right">
                          <Link
                            href={`/admin/notices/${notice.id}`}
                            className="font-semibold text-[#ef6c00] hover:underline"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-[#071b2a]">
        {value}
      </p>
    </div>
  );
}