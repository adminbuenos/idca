import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type Club = {
  id: string;
  name: string;
  short_name: string | null;
  logo_path: string | null;
};

type DrawTeam = {
  id: string;
  club: Club;
};

type DrawGroup = {
  id: string;
  name: string;
  display_order: number;
  teams: {
    id: string;
    position: number | null;
    team: DrawTeam;
  }[];
};

type Pairing = {
  id: string;
  group_id: string | null;
  round: number | null;
  position: number | null;
  team: DrawTeam;
  opponent: DrawTeam | null;
};

type PublishedDraw = {
  tournament: {
    id: string;
    name: string;
    slug: string;
    format:
      | "LEAGUE"
      | "KNOCKOUT"
      | "LEAGUE_KNOCKOUT";
    status: string;
    start_date: string | null;
    end_date: string | null;
  };
  draw: {
    status: "PUBLISHED" | "LOCKED";
    published_at: string | null;
  };
  groups: DrawGroup[];
  pairings: Pairing[];
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

function formatFormat(
  format: PublishedDraw["tournament"]["format"]
) {
  switch (format) {
    case "LEAGUE":
      return "Round Robin / League";

    case "KNOCKOUT":
      return "Knockout";

    case "LEAGUE_KNOCKOUT":
      return "League + Knockout";

    default:
      return format;
  }
}

function getClubLogoUrl(
  logoPath: string | null
) {
  if (!logoPath) return null;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) return null;

  return `${supabaseUrl}/storage/v1/object/public/club-logos/${logoPath}`;
}

function ClubBadge({
  club,
}: {
  club: Club;
}) {
  const logoUrl = getClubLogoUrl(
    club.logo_path
  );

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${club.name} logo`}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-xs font-black text-slate-400">
            🏏
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-[#071b2a]">
          {club.name}
        </p>

        {club.short_name && (
          <p className="truncate text-xs text-slate-400">
            {club.short_name}
          </p>
        )}
      </div>
    </div>
  );
}

export default async function PublicDrawPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_published_tournament_draw_by_slug",
    {
      p_slug: slug,
    }
  );

  if (error) {
    console.error(
      "Failed to load published tournament draw:",
      error
    );

    throw new Error(
      "Failed to load tournament draw."
    );
  }

  if (!data) {
    notFound();
  }

  const publishedDraw =
    data as PublishedDraw;

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
          <Link
            href="/tournaments"
            className="text-sm font-semibold text-slate-500 transition hover:text-[#071b2a]"
          >
            ← All Tournaments
          </Link>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#071b2a] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                  Official Draw
                </span>

                <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
                  {publishedDraw.draw.status}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-[#071b2a] sm:text-4xl">
                {publishedDraw.tournament.name}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Official tournament draw published by
                the Indore Division Cricket Association.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Format
              </p>

              <p className="mt-1 text-sm font-bold text-[#071b2a]">
                {formatFormat(
                  publishedDraw.tournament.format
                )}
              </p>
            </div>
          </div>

          {/* Tournament metadata */}
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Tournament
              </p>

              <p className="mt-1 text-sm font-bold text-[#071b2a]">
                {publishedDraw.tournament.name}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Start Date
              </p>

              <p className="mt-1 text-sm font-bold text-[#071b2a]">
                {formatDate(
                  publishedDraw.tournament.start_date
                )}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                End Date
              </p>

              <p className="mt-1 text-sm font-bold text-[#071b2a]">
                {formatDate(
                  publishedDraw.tournament.end_date
                )}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Draw Status
              </p>

              <p className="mt-1 text-sm font-bold text-emerald-700">
                {publishedDraw.draw.status ===
                "LOCKED"
                  ? "Final / Locked"
                  : "Officially Published"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Groups */}
      {publishedDraw.groups.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
          <div className="mb-5">
            <h2 className="text-2xl font-black text-[#071b2a]">
              Groups
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Clubs assigned to each group in the
              official draw.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {publishedDraw.groups.map(
              (group) => (
                <div
                  key={group.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between bg-[#071b2a] px-5 py-4">
                    <h3 className="font-bold text-white">
                      {group.name}
                    </h3>

                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                      {group.teams.length}{" "}
                      {group.teams.length === 1
                        ? "Club"
                        : "Clubs"}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {group.teams.map(
                      (groupTeam) => (
                        <div
                          key={groupTeam.id}
                          className="flex items-center gap-4 px-5 py-4"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-bold text-orange-700">
                            {groupTeam.position ??
                              "—"}
                          </div>

                          <ClubBadge
                            club={
                              groupTeam.team.club
                            }
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* Match pairings */}
      <section className="mx-auto max-w-6xl px-5 pb-8 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h2 className="text-2xl font-black text-[#071b2a]">
            Match Pairings
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Official pairings generated from the
            tournament draw.
          </p>
        </div>

        {publishedDraw.pairings.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="font-semibold text-slate-700">
              No match pairings are available yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {publishedDraw.pairings.map(
              (pairing) => (
                <div
                  key={pairing.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      {pairing.group_id && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Group Match
                        </span>
                      )}

                      {pairing.round && (
                        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                          Round{" "}
                          {pairing.round}
                        </span>
                      )}
                    </div>

                    {pairing.position && (
                      <span className="text-xs font-medium text-slate-400">
                        Match{" "}
                        {pairing.position}
                      </span>
                    )}
                  </div>

                  <div className="grid items-center gap-5 md:grid-cols-[1fr_auto_1fr]">
                    <ClubBadge
                      club={pairing.team.club}
                    />

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#071b2a] text-xs font-black text-white">
                      VS
                    </div>

                    {pairing.opponent ? (
                      <ClubBadge
                        club={
                          pairing.opponent.club
                        }
                      />
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-400">
                        Bye / opponent to be
                        determined
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* Official notice */}
      <section className="mx-auto max-w-6xl px-5 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              ✓
            </div>

            <div>
              <p className="font-semibold text-emerald-900">
                Official IDCA Draw
              </p>

              <p className="mt-1 text-sm leading-6 text-emerald-800">
                This draw is published through the
                official Indore Division Cricket
                Association system. The draw has been
                locked and is now final.
              </p>

              {publishedDraw.draw
                .published_at && (
                <p className="mt-2 text-xs font-medium text-emerald-700">
                  Published{" "}
                  {new Date(
                    publishedDraw.draw.published_at
                  ).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}