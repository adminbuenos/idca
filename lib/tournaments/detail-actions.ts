"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

const IDCA_DIVISION_ID =
  "89304127-99c2-4427-8edd-87a9aff3e167";

const EDITABLE_TOURNAMENT_STATUSES = [
  "DRAFT",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
] as const;

async function requireTournamentEditPermission() {
  /*
   * IMPORTANT:
   * Use the authenticated Supabase client for the permission
   * RPC because current_user_has_permission() relies on auth.uid().
   */
  const { user, supabase } = await requireAdmin();

  const { data, error } = await supabase.rpc(
    "current_user_has_permission",
    {
      requested_permission: "tournament.edit",
      requested_division: IDCA_DIVISION_ID,
    }
  );

  if (error) {
    console.error(
      "Failed to check tournament edit permission:",
      error
    );

    throw new Error(
      "Unable to verify tournament permissions."
    );
  }

  if (data !== true) {
    throw new Error(
      "You do not have permission to manage tournaments."
    );
  }

  /*
   * Service-role client is used only after the authenticated
   * user's permission has been verified.
   */
  const admin = createAdminClient();

  return {
    user,
    supabase,
    admin,
  };
}

async function requireTournamentDrawPermission() {
  const { user, supabase } = await requireAdmin();

  const { data, error } = await supabase.rpc(
    "current_user_has_permission",
    {
      requested_permission: "tournament.draw",
      requested_division: IDCA_DIVISION_ID,
    },
  );

  if (error) {
    console.error(
      "Failed to check tournament draw permission:",
      error,
    );

    throw new Error(
      "Unable to verify tournament draw permissions.",
    );
  }

  if (data !== true) {
    throw new Error(
      "You do not have permission to generate tournament draws.",
    );
  }

  return {
    user,
    supabase,
  };
}

export async function reviewTournamentDraw(
  drawId: string,
  tournamentId: string,
) {
  if (!drawId) {
    throw new Error("Draw ID is required.");
  }

  if (!tournamentId) {
    throw new Error("Tournament ID is required.");
  }

  const { supabase } =
    await requireTournamentDrawPermission();

  const { error } = await supabase.rpc(
    "transition_tournament_draw",
    {
      p_draw_id: drawId,
      p_target_status: "REVIEWED",
    },
  );

  if (error) {
    console.error(
      "Failed to review tournament draw:",
      error,
    );

    throw new Error(
      error.message ||
        "Failed to review the tournament draw.",
    );
  }

  revalidatePath(
    `/admin/tournaments/${tournamentId}/draw`,
  );

  revalidatePath(
    `/admin/tournaments/${tournamentId}`,
  );

  revalidatePath("/admin/tournaments");

  redirect(
    `/admin/tournaments/${tournamentId}/draw`,
  );
}

export async function publishTournamentDraw(
  drawId: string,
  tournamentId: string,
) {
  if (!drawId) {
    throw new Error("Draw ID is required.");
  }

  if (!tournamentId) {
    throw new Error("Tournament ID is required.");
  }

  const { supabase } =
    await requireTournamentDrawPermission();

  const { error } = await supabase.rpc(
    "transition_tournament_draw",
    {
      p_draw_id: drawId,
      p_target_status: "PUBLISHED",
    },
  );

  if (error) {
    console.error(
      "Failed to publish tournament draw:",
      error,
    );

    throw new Error(
      error.message ||
        "Failed to publish the tournament draw.",
    );
  }

  revalidatePath(
    `/admin/tournaments/${tournamentId}/draw`,
  );

  revalidatePath(
    `/admin/tournaments/${tournamentId}`,
  );

  revalidatePath("/admin/tournaments");

  redirect(
    `/admin/tournaments/${tournamentId}/draw`,
  );
}

export async function lockTournamentDraw(
  drawId: string,
  tournamentId: string,
) {
  if (!drawId) {
    throw new Error("Draw ID is required.");
  }

  if (!tournamentId) {
    throw new Error("Tournament ID is required.");
  }

  const { supabase } =
    await requireTournamentDrawPermission();

  const { error } = await supabase.rpc(
    "transition_tournament_draw",
    {
      p_draw_id: drawId,
      p_target_status: "LOCKED",
    },
  );

  if (error) {
    console.error(
      "Failed to lock tournament draw:",
      error,
    );

    throw new Error(
      error.message ||
        "Failed to lock the tournament draw.",
    );
  }

  revalidatePath(
    `/admin/tournaments/${tournamentId}/draw`,
  );

  revalidatePath(
    `/admin/tournaments/${tournamentId}`,
  );

  revalidatePath("/admin/tournaments");

  redirect(
    `/admin/tournaments/${tournamentId}/draw`,
  );
}

function isEditableTournamentStatus(status: string) {
  return EDITABLE_TOURNAMENT_STATUSES.includes(
    status as (typeof EDITABLE_TOURNAMENT_STATUSES)[number]
  );
}

/*
 * ----------------------------------------------------------
 * ADD TOURNAMENT TEAM
 * ----------------------------------------------------------
 */
export async function addTournamentTeam(
  tournamentId: string,
  clubId: string
) {
  if (!tournamentId || !clubId) {
    throw new Error("Tournament and club are required.");
  }

  const { user, admin } =
    await requireTournamentEditPermission();

  /*
   * Load tournament and verify that it belongs to IDCA.
   */
  const { data: tournament, error: tournamentError } =
    await admin
      .from("tournaments")
      .select(
        `
          id,
          division_id,
          session_id,
          club_category_id,
          age_category_id,
          status,
          participants_locked_at
        `
      )
      .eq("id", tournamentId)
      .eq("division_id", IDCA_DIVISION_ID)
      .maybeSingle();

  if (tournamentError) {
    console.error(
      "Failed to load tournament:",
      tournamentError
    );
    throw new Error("Unable to load tournament.");
  }

  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  /*
   * Once participants are finalized, the participant list
   * is immutable.
   */
  if (tournament.participants_locked_at) {
    throw new Error(
      "Tournament participants have already been finalized and cannot be changed."
    );
  }

  if (!isEditableTournamentStatus(tournament.status)) {
    throw new Error(
      "Participating clubs cannot be changed after the tournament has progressed."
    );
  }

  /*
   * Verify the club belongs to IDCA.
   */
  const { data: club, error: clubError } = await admin
    .from("clubs")
    .select("id, name")
    .eq("id", clubId)
    .eq("division_id", IDCA_DIVISION_ID)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (clubError) {
    console.error("Failed to load club:", clubError);
    throw new Error("Unable to verify the selected club.");
  }

  if (!club) {
    throw new Error("Invalid club selected.");
  }

  /*
   * The club must be registered for the tournament's
   * session and club category.
   */
  const { data: registration, error: registrationError } =
    await admin
      .from("club_session_registrations")
      .select(
        `
          id,
          club_id,
          session_id,
          category_id,
          registration_status
        `
      )
      .eq("club_id", clubId)
      .eq("session_id", tournament.session_id)
      .eq("category_id", tournament.club_category_id)
      .eq("registration_status", "ACTIVE")
      .maybeSingle();

  if (registrationError) {
    console.error(
      "Failed to verify club registration:",
      registrationError
    );

    throw new Error(
      "Unable to verify the club's session registration."
    );
  }

  if (!registration) {
    throw new Error(
      "This club is not registered for the selected session and category."
    );
  }

  /*
   * Prevent duplicate participation.
   */
  const { data: existingTeam, error: existingError } =
    await admin
      .from("tournament_teams")
      .select("id, registration_status")
      .eq("tournament_id", tournamentId)
      .eq("club_id", clubId)
      .maybeSingle();

  if (existingError) {
    console.error(
      "Failed to check tournament participation:",
      existingError
    );

    throw new Error(
      "Unable to check existing tournament participation."
    );
  }

  if (existingTeam) {
    if (existingTeam.registration_status === "ACTIVE") {
      throw new Error(
        "This club is already participating in the tournament."
      );
    }

    const { error: restoreError } = await admin
      .from("tournament_teams")
      .update({
        registration_status: "ACTIVE",
      })
      .eq("id", existingTeam.id);

    if (restoreError) {
      console.error(
        "Failed to restore tournament team:",
        restoreError
      );

      throw new Error(
        "Failed to add the club to the tournament."
      );
    }
  } else {
    const { error: insertError } = await admin
      .from("tournament_teams")
      .insert({
        tournament_id: tournamentId,
        club_id: clubId,
        registration_status: "ACTIVE",
      });

    if (insertError) {
      console.error(
        "Failed to add tournament team:",
        insertError
      );

      throw new Error(
        insertError.message ||
          "Failed to add the club to the tournament."
      );
    }
  }

  /*
   * Audit.
   */
  await admin.from("audit_logs").insert({
    division_id: IDCA_DIVISION_ID,
    user_id: user.id,
    action: "CREATE",
    entity_type: "TOURNAMENT_TEAM",
    entity_id: existingTeam?.id ?? null,
    metadata: {
      tournament_id: tournamentId,
      club_id: clubId,
      club_name: club.name,
    },
  });

  revalidatePath(`/admin/tournaments/${tournamentId}`);

  redirect(`/admin/tournaments/${tournamentId}`);
}

/*
 * ----------------------------------------------------------
 * REMOVE TOURNAMENT TEAM
 * ----------------------------------------------------------
 */
export async function removeTournamentTeam(
  tournamentId: string,
  tournamentTeamId: string
) {
  if (!tournamentId || !tournamentTeamId) {
    throw new Error(
      "Tournament and tournament team are required."
    );
  }

  const { user, admin } =
    await requireTournamentEditPermission();

  /*
   * Verify tournament.
   */
  const { data: tournament, error: tournamentError } =
    await admin
      .from("tournaments")
      .select(
        `
          id,
          status,
          participants_locked_at
        `
      )
      .eq("id", tournamentId)
      .eq("division_id", IDCA_DIVISION_ID)
      .maybeSingle();

  if (tournamentError) {
    console.error(
      "Failed to load tournament:",
      tournamentError
    );

    throw new Error("Unable to load tournament.");
  }

  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  /*
   * Once participants are finalized, the participant list
   * is immutable.
   */
  if (tournament.participants_locked_at) {
    throw new Error(
      "Tournament participants have already been finalized and cannot be changed."
    );
  }

  if (!isEditableTournamentStatus(tournament.status)) {
    throw new Error(
      "Participating clubs cannot be changed after the tournament has progressed."
    );
  }

  /*
   * Make sure the tournament team actually belongs
   * to this tournament.
   */
  const { data: tournamentTeam, error: teamError } =
    await admin
      .from("tournament_teams")
      .select(
        `
          id,
          tournament_id,
          club_id,
          registration_status,
          clubs (
            id,
            name
          )
        `
      )
      .eq("id", tournamentTeamId)
      .eq("tournament_id", tournamentId)
      .maybeSingle();

  if (teamError) {
    console.error(
      "Failed to load tournament team:",
      teamError
    );

    throw new Error(
      "Unable to load tournament participation."
    );
  }

  if (!tournamentTeam) {
    throw new Error(
      "Tournament participation record not found."
    );
  }

  if (tournamentTeam.registration_status !== "ACTIVE") {
    throw new Error(
      "This club is no longer an active tournament participant."
    );
  }

  /*
   * Soft-remove rather than physically deleting.
   * This preserves the audit/history chain.
   */
  const { error: updateError } = await admin
    .from("tournament_teams")
    .update({
      registration_status: "INACTIVE",
    })
    .eq("id", tournamentTeamId)
    .eq("tournament_id", tournamentId)
    .eq("registration_status", "ACTIVE");

  if (updateError) {
    console.error(
      "Failed to remove tournament team:",
      updateError
    );

    throw new Error(
      "Failed to remove the club from the tournament."
    );
  }

  const club = Array.isArray(tournamentTeam.clubs)
    ? tournamentTeam.clubs[0]
    : tournamentTeam.clubs;

  /*
   * Audit.
   */
  await admin.from("audit_logs").insert({
    division_id: IDCA_DIVISION_ID,
    user_id: user.id,
    action: "UPDATE",
    entity_type: "TOURNAMENT_TEAM",
    entity_id: tournamentTeamId,
    old_data: {
      registration_status: "ACTIVE",
    },
    new_data: {
      registration_status: "INACTIVE",
    },
    metadata: {
      tournament_id: tournamentId,
      club_id: tournamentTeam.club_id,
      club_name: club?.name ?? null,
    },
  });

  revalidatePath(`/admin/tournaments/${tournamentId}`);

  redirect(`/admin/tournaments/${tournamentId}`);
}

/*
 * ----------------------------------------------------------
 * FINALIZE TOURNAMENT PARTICIPANTS
 * ----------------------------------------------------------
 *
 * This is the point where the participant list becomes
 * immutable and the tournament moves to DRAW_PENDING.
 *
 * After this action:
 *
 * DRAFT / REGISTRATION_OPEN / REGISTRATION_CLOSED
 *                         ↓
 *                    DRAW_PENDING
 *
 * The draw engine will only operate on finalized
 * participants.
 * ----------------------------------------------------------
 */
export async function finalizeTournamentParticipants(
  tournamentId: string
) {
  if (!tournamentId) {
    throw new Error("Tournament is required.");
  }

  const { user, admin } =
    await requireTournamentEditPermission();

  /*
   * Load tournament.
   */
  const { data: tournament, error: tournamentError } =
    await admin
      .from("tournaments")
      .select(
        `
          id,
          division_id,
          status,
          participants_locked_at,
          participants_locked_by
        `
      )
      .eq("id", tournamentId)
      .eq("division_id", IDCA_DIVISION_ID)
      .maybeSingle();

  if (tournamentError) {
    console.error(
      "Failed to load tournament:",
      tournamentError
    );

    throw new Error("Unable to load tournament.");
  }

  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  /*
   * Prevent re-finalization.
   */
  if (tournament.participants_locked_at) {
    throw new Error(
      "Tournament participants have already been finalized."
    );
  }

  /*
   * Only an editable tournament can be finalized.
   */
  if (!isEditableTournamentStatus(tournament.status)) {
    throw new Error(
      "Participants can only be finalized before the tournament draw begins."
    );
  }

  /*
   * Load active participants.
   */
  const { data: teams, error: teamsError } = await admin
    .from("tournament_teams")
    .select("id, club_id")
    .eq("tournament_id", tournamentId)
    .eq("registration_status", "ACTIVE");

  if (teamsError) {
    console.error(
      "Failed to load tournament participants:",
      teamsError
    );

    throw new Error(
      "Unable to load tournament participants."
    );
  }

  const participantCount = teams?.length ?? 0;

  /*
   * A draw cannot be generated with fewer than two
   * participating clubs.
   */
  if (participantCount < 2) {
    throw new Error(
      "At least 2 participating clubs are required before finalizing the tournament."
    );
  }

  const lockedAt = new Date().toISOString();

  /*
   * Move tournament to DRAW_PENDING and permanently record
   * who finalized the participant list and when.
   */
  const { data: updatedTournament, error: updateError } =
    await admin
      .from("tournaments")
      .update({
        participants_locked_at: lockedAt,
        participants_locked_by: user.id,
        status: "DRAW_PENDING",
      })
      .eq("id", tournamentId)
      .eq("division_id", IDCA_DIVISION_ID)
      .is("participants_locked_at", null)
      .select(
        `
          id,
          status,
          participants_locked_at,
          participants_locked_by
        `
      )
      .maybeSingle();

  if (updateError) {
    console.error(
      "Failed to finalize tournament participants:",
      updateError
    );

    throw new Error(
      "Failed to finalize tournament participants."
    );
  }

  if (!updatedTournament) {
    throw new Error(
      "Participants could not be finalized. The tournament may have already been finalized."
    );
  }

  /*
   * Audit.
   */
  await admin.from("audit_logs").insert({
    division_id: IDCA_DIVISION_ID,
    user_id: user.id,
    action: "UPDATE",
    entity_type: "TOURNAMENT",
    entity_id: tournamentId,
    old_data: {
      status: tournament.status,
      participants_locked_at:
        tournament.participants_locked_at,
      participants_locked_by:
        tournament.participants_locked_by,
    },
    new_data: {
      status: "DRAW_PENDING",
      participants_locked_at: lockedAt,
      participants_locked_by: user.id,
    },
    metadata: {
      participant_count: participantCount,
      action: "FINALIZE_PARTICIPANTS",
    },
  });

  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath("/admin/tournaments");

  redirect(`/admin/tournaments/${tournamentId}`);
}

/*
 * ----------------------------------------------------------
 * GENERATE LEAGUE DRAW
 * ----------------------------------------------------------
 *
 * The database function performs the actual atomic draw
 * generation.
 *
 * This server action is responsible for:
 *
 * 1. Authentication
 * 2. tournament.draw permission
 * 3. Input validation
 * 4. Calling the database RPC
 * 5. Revalidating the tournament pages
 * 6. Redirecting to the draw page
 *
 * ----------------------------------------------------------
 */
export async function generateLeagueDraw(
  tournamentId: string,
  groupCount: number,
) {
  if (!tournamentId) {
    throw new Error("Tournament ID is required.");
  }

  if (!Number.isInteger(groupCount) || groupCount < 1) {
    throw new Error("Group count must be at least 1.");
  }

  /*
   * IMPORTANT:
   *
   * Draw generation requires tournament.draw,
   * not tournament.edit.
   */
  const { supabase } =
    await requireTournamentDrawPermission();

  /*
   * The database function performs the authoritative
   * validation of:
   *
   * - tournament existence
   * - division
   * - tournament.draw permission
   * - DRAW_PENDING status
   * - participant finalization
   * - participant count
   * - duplicate generated draws
   * - tournament format
   */
  const { data: drawId, error } = await supabase.rpc(
    "generate_league_draw",
    {
      p_tournament_id: tournamentId,
      p_group_count: groupCount,
      p_random_seed: null,
    },
  );

  if (error) {
    console.error(
      "Failed to generate league draw:",
      error,
    );

    throw new Error(
      error.message ||
        "Failed to generate the tournament draw.",
    );
  }

  if (!drawId) {
    throw new Error(
      "Draw generation completed without returning a draw ID.",
    );
  }

  /*
   * Refresh the tournament and draw pages.
   */
  revalidatePath(
    `/admin/tournaments/${tournamentId}`,
  );

  revalidatePath(
    `/admin/tournaments/${tournamentId}/draw`,
  );

  /*
   * Stay on the draw configuration page for now.
   *
   * The next step will make this page display the generated
   * draw results instead of the configuration form.
   */
  redirect(
    `/admin/tournaments/${tournamentId}/draw`,
  );
}