import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  generateLeagueDraw,
  reviewTournamentDraw,
  publishTournamentDraw,
  lockTournamentDraw,
} from "@/lib/tournaments/detail-actions";
import { requireAdmin } from "@/lib/auth/authorization";

const IDCA_DIVISION_ID =
  "89304127-99c2-4427-8edd-87a9aff3e167";

type Relation<T> = T | T[] | null;

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

type GeneratedDraw = {
  id: string;
  tournament_id: string;
  draw_type: string;
  status: string;
  random_seed: string | null;
  configuration: {
    format?: string;
    group_count?: number;
    participant_count?: number;
    algorithm?: string;
    algorithm_version?: number;
  };
  created_by: string | null;
created_at: string;
reviewed_by: string | null;
reviewed_at: string | null;
published_by: string | null;
published_at: string | null;
locked_at: string | null;
};

type TournamentGroup = {
  id: string;
  name: string;
  display_order: number;
  status: string;
};

type GroupTeam = {
  id: string;
  group_id: string;
  tournament_team_id: string;
  position: number | null;
};

type DrawResult = {
  id: string;
  draw_id: string;
  tournament_team_id: string;
  group_id: string | null;
  opponent_team_id: string | null;
  position: number | null;
  round: number | null;
  match_slot: number | null;
};

type Tournament = {
  id: string;
  name: string;
  status: string;
  format: string;
  session_id: string;
  club_category_id: string;
  age_category_id: string | null;
  participants_locked_at: string | null;
};

function getRelation<T>(
  relation: Relation<T>
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
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

function getDefaultGroupCount(
  format: string,
  participantCount: number
) {
  if (format === "KNOCKOUT") {
    return 1;
  }

  if (participantCount <= 4) {
    return 1;
  }

  if (participantCount <= 8) {
    return 2;
  }

  if (participantCount <= 16) {
    return 4;
  }

  return Math.ceil(participantCount / 4);
}

function getGroupSize(
  participantCount: number,
  groupCount: number
) {
  if (groupCount <= 0) {
    return 0;
  }

  return Math.ceil(
    participantCount / groupCount
  );
}

function getKnockoutRounds(
  participantCount: number
) {
  if (participantCount <= 1) {
    return 0;
  }

  return Math.ceil(
    Math.log2(participantCount)
  );
}

export default async function TournamentDrawPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { supabase } = await requireAdmin();

  /*
   * Load tournament.
   */
  const {
    data: tournament,
    error: tournamentError,
  } = await supabase
    .from("tournaments")
    .select(
      `
        id,
        name,
        status,
        format,
        session_id,
        club_category_id,
        age_category_id,
        participants_locked_at
      `
    )
    .eq("id", id)
    .eq("division_id", IDCA_DIVISION_ID)
    .maybeSingle();

  if (tournamentError) {
    console.error(
      "Failed to load tournament:",
      tournamentError
    );

    throw new Error(
      `Failed to load tournament: ${tournamentError.message}`
    );
  }

  if (!tournament) {
    notFound();
  }

  /*
   * Draw configuration is only available after the
   * participant list has been finalized.
   */
  if (
  ![
    "DRAW_PENDING",
    "SCHEDULED",
  ].includes(tournament.status) ||
  !tournament.participants_locked_at
) {
  redirect(`/admin/tournaments/${id}`);
}

  const {
  data: generatedDraw,
  error: generatedDrawError,
} = await supabase
  .from("tournament_draws")
  .select(`
     id,
  tournament_id,
  draw_type,
  status,
  random_seed,
  configuration,
  created_by,
  created_at,
  reviewed_by,
  reviewed_at,
  published_by,
published_at,
  locked_at
  `)
  .eq("tournament_id", id)
  .in("status", [
    "GENERATED",
    "REVIEWED",
    "PUBLISHED",
    "LOCKED",
  ])
  .order("created_at", {
    ascending: false,
  })
  .limit(1)
  .maybeSingle();

if (generatedDrawError) {
  console.error(
    "Failed to load generated draw:",
    generatedDrawError,
  );

  throw new Error(
    `Failed to load generated draw: ${generatedDrawError.message}`,
  );
}

const hasGeneratedDraw = !!generatedDraw;

let generatedGroups: TournamentGroup[] = [];
let generatedGroupTeams: GroupTeam[] = [];
let generatedResults: DrawResult[] = [];

if (generatedDraw) {
  const { data: groups, error: groupsError } =
    await supabase
      .from("tournament_groups")
      .select(`
        id,
        name,
        display_order,
        status
      `)
      .eq("tournament_id", id)
      .order("display_order", {
        ascending: true,
      });

  if (groupsError) {
    console.error(
      "Failed to load tournament groups:",
      groupsError,
    );

    throw new Error(
      `Failed to load tournament groups: ${groupsError.message}`,
    );
  }

  generatedGroups =
    (groups ?? []) as TournamentGroup[];

  const groupIds = generatedGroups.map(
    (group) => group.id,
  );

  if (groupIds.length > 0) {
    const {
      data: groupTeams,
      error: groupTeamsError,
    } = await supabase
      .from("group_teams")
      .select(`
        id,
        group_id,
        tournament_team_id,
        position
      `)
      .in("group_id", groupIds)
      .order("position", {
        ascending: true,
      });

    if (groupTeamsError) {
      console.error(
        "Failed to load group teams:",
        groupTeamsError,
      );

      throw new Error(
        `Failed to load group teams: ${groupTeamsError.message}`,
      );
    }

    generatedGroupTeams =
      (groupTeams ?? []) as GroupTeam[];
  }

  const {
    data: drawResults,
    error: drawResultsError,
  } = await supabase
    .from("draw_results")
    .select(`
      id,
      draw_id,
      tournament_team_id,
      group_id,
      opponent_team_id,
      position,
      round,
      match_slot
    `)
    .eq("draw_id", generatedDraw.id)
    .order("round", {
      ascending: true,
    })
    .order("position", {
      ascending: true,
    });

  if (drawResultsError) {
    console.error(
      "Failed to load draw results:",
      drawResultsError,
    );

    throw new Error(
      `Failed to load draw results: ${drawResultsError.message}`,
    );
  }

  generatedResults =
    (drawResults ?? []) as DrawResult[];
}
  /*
   * Load finalized participants.
   */
  const {
    data: tournamentTeams,
    error: teamsError,
  } = await supabase
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
      "Failed to load tournament participants:",
      teamsError
    );

    throw new Error(
      `Failed to load tournament participants: ${teamsError.message}`
    );
  }

  const teams =
    (tournamentTeams ??
      []) as unknown as TournamentTeam[];

  const participantCount = teams.length;

  /*
   * Basic safety check.
   */
  if (participantCount < 2) {
    throw new Error(
      "A minimum of 2 finalized participants is required."
    );
  }

  const defaultGroupCount =
    getDefaultGroupCount(
      tournament.format,
      participantCount
    );

  const defaultGroupSize =
    getGroupSize(
      participantCount,
      defaultGroupCount
    );

  const knockoutRounds =
    getKnockoutRounds(
      participantCount
    );

  const clubs = teams.map((team) => ({
    ...team,
    club: getRelation(team.clubs),
  }));

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/admin/tournaments/${id}`}
            className="mb-4 inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to Tournament
          </Link>
        </div>

        {hasGeneratedDraw && generatedDraw ? (
  <section className="mb-6 space-y-6">
    {/* Draw summary */}
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-emerald-950">
              Draw Generated
            </h2>

            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              {generatedDraw.status}
            </span>
          </div>

          <p className="mt-2 text-sm text-emerald-800">
            The tournament draw has been generated successfully
            and is ready for administrative review.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Participants
          </p>

          <p className="mt-1 text-lg font-bold text-emerald-950">
            {generatedDraw.configuration
              ?.participant_count ?? participantCount}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Groups
          </p>

          <p className="mt-1 text-lg font-bold text-emerald-950">
            {generatedDraw.configuration
              ?.group_count ?? generatedGroups.length}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Generated
          </p>

          <p className="mt-1 text-sm font-semibold text-emerald-950">
            {new Date(
              generatedDraw.created_at,
            ).toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Draw ID
          </p>

          <p className="mt-1 break-all font-mono text-xs font-semibold text-emerald-950">
            {generatedDraw.id}
          </p>
        </div>
      </div>
    </div>

    {/* Groups */}
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Draw Groups
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Clubs are shown in their generated draw positions.
        </p>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        {generatedGroups.map((group) => {
          const groupTeams =
            generatedGroupTeams
              .filter(
                (item) =>
                  item.group_id === group.id,
              )
              .sort(
                (a, b) =>
                  (a.position ?? 0) -
                  (b.position ?? 0),
              );

          return (
            <div
              key={group.id}
              className="overflow-hidden rounded-xl border border-slate-200"
            >
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <h3 className="font-bold text-slate-900">
                  {group.name}
                </h3>
              </div>

              <div className="divide-y divide-slate-100">
                {groupTeams.map((groupTeam) => {
                  const team = teams.find(
                    (item) =>
                      item.id ===
                      groupTeam.tournament_team_id,
                  );

                  const club = team
                    ? getRelation(team.clubs)
                    : null;

                  return (
                    <div
                      key={groupTeam.id}
                      className="flex items-center gap-4 px-5 py-4"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                        {groupTeam.position}
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
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Pairings */}
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Generated Pairings
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Round-robin pairings generated from the group
          assignments.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {generatedResults.map((result) => {
          const team = teams.find(
            (item) =>
              item.id ===
              result.tournament_team_id,
          );

          const opponent = teams.find(
            (item) =>
              item.id ===
              result.opponent_team_id,
          );

          const teamClub = team
            ? getRelation(team.clubs)
            : null;

          const opponentClub = opponent
            ? getRelation(opponent.clubs)
            : null;

          const group = generatedGroups.find(
            (item) =>
              item.id === result.group_id,
          );

          return (
            <div
              key={result.id}
              className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {group?.name ?? "Group"} · Round{" "}
                  {result.round ?? 1}
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {teamClub?.name ??
                    "Unknown Club"}
                  <span className="mx-2 text-slate-400">
                    vs
                  </span>
                  {opponentClub?.name ??
                    "Unknown Club"}
                </p>
              </div>

              <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Pairing
              </span>
            </div>
          );
        })}

        {generatedResults.length === 0 && (
          <div className="p-6 text-sm text-slate-500">
            No pairings were generated.
          </div>
        )}
      </div>
    </div>

    {/* Review action */}
    {generatedDraw.status === "GENERATED" && (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-amber-900">
              Review Required
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-amber-800">
              Review the generated groups and pairings before
              approving this draw.
            </p>
          </div>

          <form
  action={async () => {
    "use server";

    await reviewTournamentDraw(
      generatedDraw.id,
      tournament.id,
    );
  }}
>
  <button
    type="submit"
    className="rounded-lg bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
  >
    Review Draw
  </button>
</form>
        </div>
      </section>
    )}

    {generatedDraw.status === "REVIEWED" && (
  <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-semibold text-blue-900">
            Draw Reviewed
          </h2>

          <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            REVIEWED
          </span>
        </div>

        <p className="mt-1 max-w-3xl text-sm leading-6 text-blue-800">
          This draw has been reviewed and is ready to be
          officially published.
        </p>

        {generatedDraw.reviewed_at && (
          <p className="mt-3 text-xs font-medium text-blue-700">
            Reviewed on{" "}
            {new Date(
              generatedDraw.reviewed_at,
            ).toLocaleString()}
          </p>
        )}
      </div>

      <form
        action={async () => {
          "use server";

          await publishTournamentDraw(
            generatedDraw.id,
            tournament.id,
          );
        }}
      >
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Publish Draw
        </button>
      </form>
    </div>
  </section>
)}

{generatedDraw.status === "PUBLISHED" && (
  <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-semibold text-emerald-900">
            Draw Published
          </h2>

          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            PUBLISHED
          </span>
        </div>

        <p className="mt-1 max-w-3xl text-sm leading-6 text-emerald-800">
          This draw is officially published and can be made
          available to the public. Lock the draw when the
          result must become permanently immutable.
        </p>

        {generatedDraw.published_at && (
          <p className="mt-3 text-xs font-medium text-emerald-700">
            Published on{" "}
            {new Date(
              generatedDraw.published_at,
            ).toLocaleString()}
          </p>
        )}
      </div>

      <form
        action={async () => {
          "use server";

          await lockTournamentDraw(
            generatedDraw.id,
            tournament.id,
          );
        }}
      >
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Lock Draw
        </button>
      </form>
    </div>
  </section>
)}

{generatedDraw.status === "LOCKED" && (
  <section className="rounded-2xl border border-slate-300 bg-slate-100 p-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-semibold text-slate-900">
            Draw Locked
          </h2>

          <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
            LOCKED
          </span>
        </div>

        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">
          This draw has been permanently locked. No further
          changes to the draw lifecycle are permitted.
        </p>

        {generatedDraw.published_at && (
          <p className="mt-3 text-xs font-medium text-slate-600">
            Published on{" "}
            {new Date(
              generatedDraw.published_at,
            ).toLocaleString()}
          </p>
        )}

        {generatedDraw.locked_at && (
          <p className="mt-1 text-xs font-medium text-slate-600">
            Locked on{" "}
            {new Date(
              generatedDraw.locked_at,
            ).toLocaleString()}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
        Read-only
      </div>
    </div>
  </section>
)}

  </section>
) : (
  <>
    <div className="mb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Configure Draw
            </h1>

            <span className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/20">
              DRAW PENDING
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {tournament.name}
          </p>
        </div>
      </div>
    </div>


        {/* Tournament summary */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">
            Tournament Draw
          </h2>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Format
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {formatLabel(
                  tournament.format
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Participants
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {participantCount}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Participants Locked
              </p>

              <p className="mt-1 font-semibold text-emerald-700">
                Yes
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Draw Status
              </p>

              <p className="mt-1 font-semibold text-purple-700">
                Pending
              </p>
            </div>
          </div>
        </section>

        {/* Configuration */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Draw Configuration
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review the proposed structure before generating
              the draw. No draw has been generated yet.
            </p>
          </div>

          {tournament.format ===
            "LEAGUE" && (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="group_count"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Number of Groups
                  </label>

                  <select
                    id="group_count"
                    name="group_count"
                    defaultValue={
                      defaultGroupCount
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  >
                    {Array.from(
                      {
                        length: Math.min(
                          participantCount,
                          16
                        ),
                      },
                      (_, index) => (
                        <option
                          key={index + 1}
                          value={index + 1}
                        >
                          {index + 1}
                          {index === 0
                            ? " Group"
                            : " Groups"}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="group_size"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Approximate Teams per Group
                  </label>

                  <input
                    id="group_size"
                    type="number"
                    min={2}
                    value={defaultGroupSize}
                    readOnly
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">
                  Random Group Assignment
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-800">
                  Participating clubs will be randomly
                  assigned to the configured groups when
                  the draw is generated.
                </p>
              </div>
            </div>
          )}

          {tournament.format ===
            "KNOCKOUT" && (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Participants
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {participantCount}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Knockout Rounds
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {knockoutRounds}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">
                  Random Knockout Pairing
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-800">
                  Teams will be randomly paired. If the
                  participant count is not a power of two,
                  the draw engine will automatically create
                  the required byes.
                </p>
              </div>
            </div>
          )}

          {tournament.format ===
            "LEAGUE_KNOCKOUT" && (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="group_count"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    League Groups
                  </label>

                  <select
                    id="group_count"
                    name="group_count"
                    defaultValue={
                      defaultGroupCount
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  >
                    {Array.from(
                      {
                        length: Math.min(
                          participantCount,
                          16
                        ),
                      },
                      (_, index) => (
                        <option
                          key={index + 1}
                          value={index + 1}
                        >
                          {index + 1}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="qualifiers_per_group"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Qualifiers per Group
                  </label>

                  <input
                    id="qualifiers_per_group"
                    type="number"
                    min={1}
                    defaultValue={1}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Participants
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {participantCount}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">
                  League → Knockout
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-800">
                  Clubs will first be randomly assigned to
                  league groups. The configured number of
                  clubs from each group will later qualify
                  for the knockout stage.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Participants */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Finalized Participants
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              These clubs are locked and will be used as the
              source for the draw.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {clubs.map(
              (team, index) => (
                <div
                  key={team.id}
                  className="flex items-center gap-4 p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                    {index + 1}
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      {team.club?.name ??
                        "Unknown Club"}
                    </p>

                    {team.club
                      ?.short_name && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {
                          team.club
                            .short_name
                        }
                      </p>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* Generate Draw */}
<section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <h2 className="font-semibold text-amber-900">
        Ready to Generate
      </h2>

      <p className="mt-1 max-w-3xl text-sm leading-6 text-amber-800">
        The configuration above will be used to generate the
        official tournament draw. The draw engine will create
        a reproducible draw using a stored random seed and
        configuration.
      </p>
    </div>

    <form
      action={async () => {
        "use server";

        await generateLeagueDraw(
          tournament.id,
          defaultGroupCount,
        );
      }}
    >
      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Generate Draw
      </button>
    </form>
  </div>
</section>
  </>
)}
      </div>
      
    </main>
    
  );
}