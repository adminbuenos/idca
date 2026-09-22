import Link from "next/link";
import { requireAdmin } from "@/lib/auth/authorization";

const IDCA_DIVISION_ID = "89304127-99c2-4427-8edd-87a9aff3e167";

type Tournament = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  format:
    | "LEAGUE"
    | "KNOCKOUT"
    | "LEAGUE_KNOCKOUT";
  status:
    | "DRAFT"
    | "REGISTRATION_OPEN"
    | "REGISTRATION_CLOSED"
    | "DRAW_PENDING"
    | "SCHEDULED"
    | "ONGOING"
    | "COMPLETED"
    | "CANCELLED"
    | "ARCHIVED";
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  club_category_id: string | null;
  age_category_id: string | null;
  sessions:
    | {
        id: string;
        name: string;
      }
    | {
        id: string;
        name: string;
      }[]
    | null;
  club_categories:
    | {
        id: string;
        name: string;
        code: string;
      }
    | {
        id: string;
        name: string;
        code: string;
      }[]
    | null;
  age_categories:
    | {
        id: string;
        name: string;
        code: string;
      }
    | {
        id: string;
        name: string;
        code: string;
      }[]
    | null;
};

const STATUS_STYLES: Record<
  Tournament["status"],
  string
> = {
  DRAFT: "bg-gray-100 text-gray-700",
  REGISTRATION_OPEN: "bg-blue-50 text-blue-700",
  REGISTRATION_CLOSED: "bg-indigo-50 text-indigo-700",
  DRAW_PENDING: "bg-orange-50 text-orange-700",
  SCHEDULED: "bg-yellow-50 text-yellow-700",
  ONGOING: "bg-green-50 text-green-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

const FORMAT_LABELS: Record<
  Tournament["format"],
  string
> = {
  LEAGUE: "Round Robin / League",
  KNOCKOUT: "Knockout",
  LEAGUE_KNOCKOUT: "League + Knockout",
};

function getRelation<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function formatDate(date: string | null) {
  if (!date) {
    return "Date not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default async function TournamentsPage() {
  const { supabase } = await requireAdmin();

  const { data: tournaments, error } = await supabase
    .from("tournaments")
    .select(`
      id,
      name,
      slug,
      description,
      format,
      status,
      start_date,
      end_date,
      created_at,
      club_category_id,
      age_category_id,
      sessions (
        id,
        name
      ),
      club_categories (
        id,
        name,
        code
      ),
      age_categories (
        id,
        name,
        code
      )
    `)
    .eq("division_id", IDCA_DIVISION_ID)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load tournaments:", error);
  }

  const tournamentList =
    (tournaments ?? []) as Tournament[];

  const total = tournamentList.length;

  const active = tournamentList.filter(
    (tournament) =>
      tournament.status === "ONGOING" ||
      tournament.status === "SCHEDULED"
  ).length;

  const drafts = tournamentList.filter(
    (tournament) => tournament.status === "DRAFT"
  ).length;

  const completed = tournamentList.filter(
    (tournament) => tournament.status === "COMPLETED"
  ).length;

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#ef6c00]">
                <Link
                  href="/admin"
                  className="transition hover:text-[#071b2a]"
                >
                  Admin
                </Link>

                <span className="text-gray-400">/</span>

                <span className="text-gray-500">
                  Tournaments
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-[#071b2a]">
                Tournaments
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Create and manage IDCA tournaments,
                participating clubs, draws, fixtures and
                match operations.
              </p>
            </div>

            <Link
              href="/admin/tournaments/new"
              className="inline-flex items-center justify-center rounded-xl bg-[#ef6c00] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#d95f00]"
            >
              + Create Tournament
            </Link>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
              Total
            </p>

            <p className="mt-2 text-3xl font-black text-[#071b2a]">
              {total}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              All tournaments
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-600">
              Active
            </p>

            <p className="mt-2 text-3xl font-black text-green-800">
              {active}
            </p>

            <p className="mt-1 text-sm text-green-700">
              Scheduled or ongoing
            </p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
              Drafts
            </p>

            <p className="mt-2 text-3xl font-black text-orange-800">
              {drafts}
            </p>

            <p className="mt-1 text-sm text-orange-700">
              Still being prepared
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              Completed
            </p>

            <p className="mt-2 text-3xl font-black text-blue-800">
              {completed}
            </p>

            <p className="mt-1 text-sm text-blue-700">
              Completed tournaments
            </p>
          </div>
        </div>
      </section>

      {/* Tournament list */}
      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-bold text-[#071b2a]">
              All Tournaments
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage tournament setup and competition
              workflow.
            </p>
          </div>

          {tournamentList.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-2xl">
                🏏
              </div>

              <h3 className="mt-4 text-lg font-bold text-[#071b2a]">
                No tournaments yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Create your first tournament to begin
                configuring participating clubs, lots,
                groups and fixtures.
              </p>

              <Link
                href="/admin/tournaments/new"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#ef6c00] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#d95f00]"
              >
                Create Tournament
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tournamentList.map((tournament) => {
                const session = getRelation(
                  tournament.sessions
                );

                const clubCategory = getRelation(
                  tournament.club_categories
                );

                const ageCategory = getRelation(
                  tournament.age_categories
                );

                return (
                  <Link
                    key={tournament.id}
                    href={`/admin/tournaments/${tournament.id}`}
                    className="group block px-6 py-6 transition hover:bg-orange-50/40"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
                              STATUS_STYLES[
                                tournament.status
                              ]
                            }`}
                          >
                            {tournament.status.replaceAll(
                              "_",
                              " "
                            )}
                          </span>

                          {clubCategory && (
                            <span className="rounded-full bg-[#071b2a] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                              {clubCategory.name}
                            </span>
                          )}

                          {ageCategory && (
                            <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-orange-800">
                              {ageCategory.code}
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3 truncate text-xl font-black text-[#071b2a] group-hover:text-[#ef6c00]">
                          {tournament.name}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span>
                            {FORMAT_LABELS[
                              tournament.format
                            ] ?? tournament.format}
                          </span>

                          {session && (
                            <span>
                              Session: {session.name}
                            </span>
                          )}

                          <span>
                            {formatDate(
                              tournament.start_date
                            )}
                            {tournament.end_date &&
                              ` – ${formatDate(
                                tournament.end_date
                              )}`}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-sm font-bold text-[#ef6c00]">
                        Manage Tournament →
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}