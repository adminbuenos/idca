import Link from "next/link";

import { requireAdmin } from "@/lib/auth/authorization";
import { createTournament } from "@/lib/tournaments/actions";

const IDCA_DIVISION_ID = "89304127-99c2-4427-8edd-87a9aff3e167";

export default async function NewTournamentPage() {
  const { supabase } = await requireAdmin();

  const [
    { data: sessions, error: sessionsError },
    { data: clubCategories, error: categoriesError },
    { data: ageCategories, error: ageCategoriesError },
  ] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, name, start_year, end_year, is_current, status")
      .eq("division_id", IDCA_DIVISION_ID)
      .order("start_year", { ascending: false }),

    supabase
      .from("club_categories")
      .select("id, name, code, display_order")
      .eq("division_id", IDCA_DIVISION_ID)
      .eq("status", "ACTIVE")
      .order("display_order", { ascending: true }),

    supabase
      .from("age_categories")
      .select("id, name, code, maximum_age, display_order")
      .eq("division_id", IDCA_DIVISION_ID)
      .eq("status", "ACTIVE")
      .order("display_order", { ascending: true }),
  ]);

  if (sessionsError) {
    console.error("Failed to load sessions:", sessionsError);
  }

  if (categoriesError) {
    console.error(
      "Failed to load club categories:",
      categoriesError
    );
  }

  if (ageCategoriesError) {
    console.error(
      "Failed to load age categories:",
      ageCategoriesError
    );
  }

  const activeSessions = sessions ?? [];
  const activeCategories = clubCategories ?? [];
  const activeAgeCategories = ageCategories ?? [];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/tournaments"
            className="mb-4 inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to Tournaments
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Create Tournament
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Create the tournament foundation. Club participation
              and draw configuration will be handled next.
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          action={async (formData) => {
            "use server";

            const oversValue = String(
              formData.get("overs") ?? ""
            ).trim();

            await createTournament({
              name: String(formData.get("name") ?? ""),
              sessionId: String(
                formData.get("session_id") ?? ""
              ),
              clubCategoryId: String(
                formData.get("club_category_id") ?? ""
              ),
              ageCategoryId:
                String(
                  formData.get("age_category_id") ?? ""
                ).trim() || null,
              format: String(
                formData.get("format") ?? "LEAGUE"
              ) as
                | "LEAGUE"
                | "KNOCKOUT"
                | "LEAGUE_KNOCKOUT",
              startDate: String(
                formData.get("start_date") ?? ""
              ),
              endDate: String(
                formData.get("end_date") ?? ""
              ),
              overs: oversValue
                ? Number(oversValue)
                : null,
              description: String(
                formData.get("description") ?? ""
              ),
            });
          }}
          className="space-y-6"
        >
          {/* Basic information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Tournament Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Basic information about the competition.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Tournament name */}
              <div className="md:col-span-2">
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Tournament Name
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. IDCA Under-18 A Grade Championship 2026-27"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Session */}
              <div>
                <label
                  htmlFor="session_id"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Session
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <select
                  id="session_id"
                  name="session_id"
                  required
                  defaultValue={
                    activeSessions.find(
                      (session) => session.is_current
                    )?.id ?? ""
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="" disabled>
                    Select session
                  </option>

                  {activeSessions.map((session) => (
                    <option
                      key={session.id}
                      value={session.id}
                    >
                      {session.name}
                      {session.is_current
                        ? " — Current"
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Club category */}
              <div>
                <label
                  htmlFor="club_category_id"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Club Category
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <select
                  id="club_category_id"
                  name="club_category_id"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="" disabled>
                    Select club category
                  </option>

                  {activeCategories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs text-slate-500">
                  B Grade tournaments do not use an age category.
                </p>
              </div>

              {/* Age category */}
              <div>
                <label
                  htmlFor="age_category_id"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Age Category
                </label>

                <select
                  id="age_category_id"
                  name="age_category_id"
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">
                    No age category
                  </option>

                  {activeAgeCategories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs text-slate-500">
                  Required for A Grade and A Elite tournaments.
                </p>
              </div>

              {/* Format */}
              <div>
                <label
                  htmlFor="format"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Tournament Format
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <select
                  id="format"
                  name="format"
                  required
                  defaultValue="LEAGUE"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="LEAGUE">
                    Round Robin / League
                  </option>

                  <option value="KNOCKOUT">
                    Knockout
                  </option>

                  <option value="LEAGUE_KNOCKOUT">
                    League + Knockout
                  </option>
                </select>
              </div>

              {/* Overs */}
              <div>
                <label
                  htmlFor="overs"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Overs
                </label>

                <input
                  id="overs"
                  name="overs"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="e.g. 50"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Leave blank if the tournament has no fixed
                  overs setting.
                </p>
              </div>
            </div>
          </section>

          {/* Dates */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Tournament Dates
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Planned competition period.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="start_date"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Start Date
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label
                  htmlFor="end_date"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  End Date
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Description
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Optional information about the tournament.
              </p>
            </div>

            <textarea
              id="description"
              name="description"
              rows={5}
              placeholder="Tournament rules, competition notes, eligibility information, etc."
              className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/admin/tournaments"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create Tournament
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}