import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/authorization";
import {
  addTournamentTeam,
  removeTournamentTeam,
  finalizeTournamentParticipants,
} from "@/lib/tournaments/detail-actions";

const IDCA_DIVISION_ID =
  "89304127-99c2-4427-8edd-87a9aff3e167";

type Relation<T> = T | T[] | null;

type Session = {
  id: string;
  name: string;
};

type ClubCategory = {
  id: string;
  name: string;
  code: string;
};

type AgeCategory = {
  id: string;
  name: string;
  code: string;
};

type TournamentSettings = {
  id: string;
  overs: number | null;
  team_size: number | null;
  points_win: number;
  points_loss: number;
  points_tie: number;
  points_no_result: number;
  allow_draw: boolean;
  notes: string | null;
};

type Tournament = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  format: string;
  start_date: string | null;
  end_date: string | null;
  session_id: string;
  club_category_id: string;
  age_category_id: string | null;
  sessions: Relation<Session>;
  club_categories: Relation<ClubCategory>;
  age_categories: Relation<AgeCategory>;
  tournament_settings: Relation<TournamentSettings>;
  participants_locked_at: string | null;
  participants_locked_by: string | null;
};

type Club = {
  id: string;
  name: string;
  short_name: string | null;
};

type TournamentTeam = {
  id: string;
  club_id: string;
  seed: number | null;
  registration_status: string;
  clubs: Relation<Club>;
};

function getRelation<T>(
  relation: Relation<T>
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatLabel(format: string) {
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

function statusClasses(status: string) {
  switch (status) {
    case "DRAFT":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";

    case "REGISTRATION_OPEN":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "REGISTRATION_CLOSED":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";

    case "DRAW_PENDING":
      return "bg-purple-50 text-purple-700 ring-purple-600/20";

    case "SCHEDULED":
      return "bg-cyan-50 text-cyan-700 ring-cyan-600/20";

    case "ONGOING":
      return "bg-green-50 text-green-700 ring-green-600/20";

    case "COMPLETED":
      return "bg-slate-100 text-slate-700 ring-slate-600/20";

    case "CANCELLED":
      return "bg-red-50 text-red-700 ring-red-600/20";

    case "ARCHIVED":
      return "bg-slate-100 text-slate-500 ring-slate-500/20";

    default:
      return "bg-slate-100 text-slate-700 ring-slate-600/20";
  }
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { supabase } = await requireAdmin();

const { data: tournament, error } = await supabase
  .from("tournaments")
  .select(`
    id,
    division_id,
    session_id,
    name,
    slug,
    description,
    club_category_id,
    age_category_id,
    format,
    registration_start,
    registration_end,
    start_date,
    end_date,
    status,
    participants_locked_at,
    participants_locked_by,
    created_by,
    created_at,
    updated_at,

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
    ),
    tournament_settings (
      id,
      overs,
      team_size,
      points_win,
      points_loss,
      points_tie,
      points_no_result,
      allow_draw,
      notes
    )
  `)
  .eq("id", id)
  .eq("division_id", IDCA_DIVISION_ID)
  .maybeSingle();

  if (error) {
  console.error("Failed to load tournament:", {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });

  throw new Error(
    `Failed to load tournament: ${error.message} (${error.code})`
  );
}

if (!tournament) {
  notFound();
}

const typedTournament =
  tournament as unknown as Tournament;

const settings = getRelation(
  typedTournament.tournament_settings
);

const session = getRelation(
  typedTournament.sessions
);

  const clubCategory = getRelation(
    typedTournament.club_categories
  );

  const ageCategory = getRelation(
    typedTournament.age_categories
  );

  /*
   * Current tournament participants.
   */
  const { data: tournamentTeams, error: teamsError } =
    await supabase
      .from("tournament_teams")
      .select(
        `
          id,
          club_id,
          seed,
          registration_status,
          clubs (
            id,
            name,
            short_name
          )
        `
      )
      .eq("tournament_id", id)
      .eq("registration_status", "ACTIVE")
      .order("created_at", {
        ascending: true,
      });

  if (teamsError) {
    console.error(
      "Failed to load tournament teams:",
      teamsError
    );
  }

  const activeTeams =
    (tournamentTeams ?? []) as unknown as TournamentTeam[];

  const participatingClubIds = new Set(
    activeTeams.map((team) => team.club_id)
  );

  /*
   * Find clubs that are officially registered for this
   * session + category.
   */
  const { data: registrations, error: registrationsError } =
    await supabase
      .from("club_session_registrations")
      .select("club_id")
      .eq("session_id", typedTournament.session_id)
      .eq(
        "category_id",
        typedTournament.club_category_id
      )
      .eq("registration_status", "ACTIVE");

  if (registrationsError) {
    console.error(
      "Failed to load eligible club registrations:",
      registrationsError
    );
  }

  const eligibleClubIds = (registrations ?? [])
    .map((registration) => registration.club_id)
    .filter(
      (clubId) => !participatingClubIds.has(clubId)
    );

  let availableClubs: Club[] = [];

  if (eligibleClubIds.length > 0) {
    const { data: clubs, error: clubsError } =
      await supabase
        .from("clubs")
        .select(
          `
            id,
            name,
            short_name
          `
        )
        .in("id", eligibleClubIds)
        .eq("division_id", IDCA_DIVISION_ID)
        .eq("status", "ACTIVE")
        .order("name", {
          ascending: true,
        });

    if (clubsError) {
      console.error(
        "Failed to load available clubs:",
        clubsError
      );
    }

    availableClubs = clubs ?? [];
  }

 const participantsLocked =
  Boolean(
    typedTournament.participants_locked_at
  );

const canEditParticipants =
  !participantsLocked &&
  (
    typedTournament.status === "DRAFT" ||
    typedTournament.status ===
      "REGISTRATION_OPEN" ||
    typedTournament.status ===
      "REGISTRATION_CLOSED"
  );

const canFinalizeParticipants =
  !participantsLocked &&
  (
    typedTournament.status === "DRAFT" ||
    typedTournament.status ===
      "REGISTRATION_OPEN" ||
    typedTournament.status ===
      "REGISTRATION_CLOSED"
  ) &&
  activeTeams.length >= 2;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/tournaments"
            className="mb-4 inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to Tournaments
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  {typedTournament.name}
                </h1>

                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses(
                    typedTournament.status
                  )}`}
                >
                  {typedTournament.status.replaceAll(
                    "_",
                    " "
                  )}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Tournament workspace
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/admin/tournaments/${id}/edit`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Edit Details
              </Link>
            </div>
          </div>
        </div>

        {/* Tournament overview */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Tournament Overview
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Session
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {session?.name ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Club Category
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {clubCategory?.name ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Age Category
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {ageCategory?.name ?? "Not Applicable"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Format
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatLabel(typedTournament.format)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Start Date
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatDate(
                  typedTournament.start_date
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                End Date
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatDate(
                  typedTournament.end_date
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Overs
              </p>
              <p className="mt-1 font-semibold text-slate-900">
               {settings?.overs ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Participating Clubs
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {activeTeams.length}
              </p>
            </div>
          </div>

          {typedTournament.description && (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Description
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {typedTournament.description}
              </p>
            </div>
          )}
        </section>
        {/* Participant finalization */}
        {participantsLocked ? (
          <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xl">
                  🔒
                </div>

                <div>
                  <h2 className="font-semibold text-emerald-900">
                    Participants Finalized
                  </h2>

                  <p className="mt-1 text-sm text-emerald-800">
                    The participating club list is now locked.
                    Clubs can no longer be added or removed from
                    this tournament.
                  </p>

                  <p className="mt-2 text-xs text-emerald-700">
                    Finalized on{" "}
                    {new Intl.DateTimeFormat("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(
                      new Date(
                        typedTournament.participants_locked_at!
                      )
                    )}
                  </p>
                </div>
              </div>

              <span className="inline-flex w-fit shrink-0 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                {activeTeams.length} Teams Locked
              </span>
            </div>
          </section>
        ) : (
          <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-semibold text-amber-900">
                  Finalize Participating Clubs
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-amber-800">
                  Review the participating clubs carefully before
                  finalizing. Once finalized, the participant list
                  will be locked and the tournament will move to
                  the draw stage.
                </p>

                <p className="mt-2 text-xs font-medium text-amber-700">
                  {activeTeams.length < 2
                    ? "At least 2 participating clubs are required."
                    : `${activeTeams.length} participating clubs are currently selected.`}
                </p>
              </div>

              <form
                action={async () => {
                  "use server";

                  await finalizeTournamentParticipants(id);
                }}
              >
                <button
                  type="submit"
                  disabled={!canFinalizeParticipants}
                  className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
                >
                  🔒 Finalize Participants
                </button>
              </form>
            </div>
          </section>
        )}
        {/* Participating clubs */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Participating Clubs
                </h2>

                <p className="mt-1 text-sm text-slate-500">
  {participantsLocked
    ? "The participating clubs for this tournament have been finalized."
    : "Add clubs officially registered for this tournament&apos;s session and category."}
</p>
              </div>

              <div className="rounded-xl bg-slate-100 px-4 py-2 text-center">
                <span className="block text-2xl font-bold text-slate-900">
                  {activeTeams.length}
                </span>

                <span className="text-xs font-medium text-slate-500">
                  Teams
                </span>
              </div>
            </div>
          </div>

          {/* Add club */}
          {canEditParticipants && (
            <div className="border-b border-slate-200 bg-slate-50 p-6">
              <form
                action={async (formData) => {
                  "use server";

                  const clubId = String(
                    formData.get("club_id") ?? ""
                  );

                  await addTournamentTeam(
                    id,
                    clubId
                  );
                }}
                className="flex flex-col gap-3 md:flex-row"
              >
                <select
                  name="club_id"
                  required
                  defaultValue=""
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="" disabled>
                    Select an eligible club
                  </option>

                  {availableClubs.map((club) => (
                    <option
                      key={club.id}
                      value={club.id}
                    >
                      {club.name}
                      {club.short_name
                        ? ` (${club.short_name})`
                        : ""}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={
                    availableClubs.length === 0
                  }
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add Club
                </button>
              </form>

              {availableClubs.length === 0 && (
                <p className="mt-3 text-sm text-amber-700">
                  No additional eligible clubs are available.
                  Clubs must have an active registration for
                  this session and category.
                </p>
              )}
            </div>
          )}

          {/* Club list */}
          {activeTeams.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
                🏏
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No clubs added yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Add the clubs that will participate in this
                tournament. These clubs will later become the
                source for the tournament draw.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeTeams.map(
                (team, index) => {
                  const club = getRelation(
                    team.clubs
                  );

                  return (
                    <div
                      key={team.id}
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                          {index + 1}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {club?.name ??
                              "Unknown Club"}
                          </p>

                          {club?.short_name && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              {club.short_name}
                            </p>
                          )}
                        </div>
                      </div>

                      {canEditParticipants && (
                        <form
                          action={async () => {
                            "use server";

                            await removeTournamentTeam(
                              id,
                              team.id
                            );
                          }}
                        >
                          <button
                            type="submit"
                            className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 sm:w-auto"
                          >
                            Remove
                          </button>
                        </form>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

                {/* Next stage */}
        <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Tournament Draw
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {participantsLocked
                  ? "The participating clubs are locked. The next step is to configure and generate the tournament draw."
                  : "Finalize the participating clubs first. The draw will become available after the participant list is locked."}
              </p>
            </div>

            {participantsLocked ? (
              <Link
                href={`/admin/tournaments/${id}/draw`}
                className="inline-flex w-fit items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Configure Draw →
              </Link>
            ) : (
              <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                Participants Required
              </span>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}