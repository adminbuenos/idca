import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type Session = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
  code: string;
};

type PublicTournament = {
  id: string;
  name: string;
  slug: string;
  format: "LEAGUE" | "KNOCKOUT" | "LEAGUE_KNOCKOUT";
  status: string;
  start_date: string | null;
  end_date: string | null;
  session: Session | null;
  club_category: Category | null;
  age_category: Category | null;
  draw_status: "PUBLISHED" | "LOCKED";
  draw_published_at: string | null;
};

function formatDate(date: string | null) {
  if (!date) return "Date TBA";

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatFormat(format: PublicTournament["format"]) {
  switch (format) {
    case "LEAGUE":
      return "League";

    case "KNOCKOUT":
      return "Knockout";

    case "LEAGUE_KNOCKOUT":
      return "League + Knockout";

    default:
      return format;
  }
}

export default async function PublicTournamentsPage() {
  const supabase = await createClient();

  const {
    data,
    error,
  } = await supabase.rpc("get_public_tournaments");

  if (error) {
    console.error(
      "Failed to load public tournaments:",
      error
    );
  }

  const tournaments =
    (data ?? []) as PublicTournament[];

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#ef6c00]">
              <Link
                href="/"
                className="transition hover:text-[#071b2a]"
              >
                Home
              </Link>

              <span className="text-slate-300">
                /
              </span>

              <span className="text-slate-500">
                Tournaments
              </span>
            </div>

            <h1 className="text-4xl font-black tracking-tight text-[#071b2a] sm:text-5xl">
              Tournaments
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Official tournaments, competition details
              and published draws from the Indore Division
              Cricket Association.
            </p>
          </div>
        </div>
      </section>

      {/* Tournament list */}
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
        {tournaments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-3xl">
              🏏
            </div>

            <h2 className="mt-5 text-xl font-bold text-[#071b2a]">
              No tournaments published yet
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Official tournament information and draws
              will appear here once they are published by
              the Indore Division Cricket Association.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {tournaments.map((tournament) => (
              <article
                key={tournament.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="p-6 sm:p-7">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#071b2a] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                      {tournament.club_category?.name ??
                        "Tournament"}
                    </span>

                    {tournament.age_category && (
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-orange-800">
                        {tournament.age_category.code}
                      </span>
                    )}

                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                      Official Draw
                    </span>

                    {tournament.draw_status ===
                      "LOCKED" && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
                        Locked
                      </span>
                    )}
                  </div>

                  {/* Main information */}
                  <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-2xl font-black tracking-tight text-[#071b2a] sm:text-3xl">
                        {tournament.name}
                      </h2>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                        <span>
                          <strong className="font-semibold text-slate-700">
                            Session:
                          </strong>{" "}
                          {tournament.session?.name ??
                            "N/A"}
                        </span>

                        <span>
                          <strong className="font-semibold text-slate-700">
                            Format:
                          </strong>{" "}
                          {formatFormat(
                            tournament.format
                          )}
                        </span>

                        {tournament.age_category && (
                          <span>
                            <strong className="font-semibold text-slate-700">
                              Age:
                            </strong>{" "}
                            {tournament.age_category.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid shrink-0 grid-cols-2 gap-3 sm:min-w-[330px]">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Start
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#071b2a]">
                          {formatDate(
                            tournament.start_date
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          End
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#071b2a]">
                          {formatDate(
                            tournament.end_date
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Official tournament draw available
                      </p>

                      {tournament.draw_published_at && (
                        <p className="mt-1 text-xs text-slate-400">
                          Published{" "}
                          {new Date(
                            tournament.draw_published_at
                          ).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/tournaments/${tournament.slug}/draw`}
                      className="inline-flex items-center justify-center rounded-xl bg-[#071b2a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#102c40]"
                    >
                      View Official Draw
                      <span className="ml-2">
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}