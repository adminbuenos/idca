import Link from "next/link";

import { requireAdmin } from "@/lib/auth/authorization";
import { createSession } from "@/lib/sessions/actions";

const IDCA_DIVISION_ID =
  "89304127-99c2-4427-8edd-87a9aff3e167";

type Session = {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
  is_current: boolean;
  status: string;
  created_at: string;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function SessionsPage() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("sessions")
    .select(`
      id,
      name,
      start_year,
      end_year,
      is_current,
      status,
      created_at
    `)
    .eq("division_id", IDCA_DIVISION_ID)
    .order("start_year", { ascending: false });

  if (error) {
    console.error("Failed to load sessions:", error);
  }

  const sessions = (data ?? []) as Session[];

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Link
            href="/admin"
            className="text-sm font-semibold text-[#ef6c00] hover:text-[#071b2a]"
          >
            ← Back to Admin
          </Link>

          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[#071b2a]">
                Seasons
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Create and manage IDCA cricket seasons. Clubs,
                tournaments and registrations are organized by season.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[360px_1fr]">
        {/* Create season */}
        <div className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-[#071b2a]">
            Create Season
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-500">
            Add a new cricket season for IDCA.
          </p>

          <form action={createSession} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="start_year"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Start Year
              </label>

              <input
                id="start_year"
                name="start_year"
                type="number"
                min="2000"
                max="2200"
                defaultValue="2026"
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ef6c00] focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label
                htmlFor="end_year"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                End Year
              </label>

              <input
                id="end_year"
                name="end_year"
                type="number"
                min="2001"
                max="2201"
                defaultValue="2027"
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ef6c00] focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <input
                type="checkbox"
                name="is_current"
                defaultChecked
                className="mt-1 h-4 w-4 rounded border-gray-300"
              />

              <span>
                <span className="block text-sm font-bold text-[#071b2a]">
                  Make this the current season
                </span>

                <span className="mt-1 block text-xs leading-5 text-gray-500">
                  The current season is used by areas of the administration
                  that need the active cricket session.
                </span>
              </span>
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#ef6c00] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#d95f00]"
            >
              Create Season
            </button>
          </form>
        </div>

        {/* Existing seasons */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-black text-[#071b2a]">
              IDCA Seasons
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              All seasons configured for Indore Division Cricket Association.
            </p>
          </div>

          {sessions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-2xl">
                📅
              </div>

              <h3 className="mt-4 text-lg font-bold text-[#071b2a]">
                No seasons yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Create the first IDCA season to begin registering clubs
                and organizing competitions.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black text-[#071b2a]">
                        {session.name}
                      </h3>

                      {session.is_current && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-green-700">
                          Current
                        </span>
                      )}

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700">
                        {session.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      {session.start_year}–{session.end_year}
                    </p>
                  </div>

                  <div className="text-sm text-gray-400">
                    Created {formatDate(session.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}