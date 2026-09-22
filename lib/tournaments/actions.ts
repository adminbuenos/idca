"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/authorization";

const IDCA_DIVISION_ID = "89304127-99c2-4427-8edd-87a9aff3e167";

type CreateTournamentInput = {
  name: string;
  sessionId: string | null;
  clubCategoryId: string | null;
  ageCategoryId?: string | null;
  format: "LEAGUE" | "KNOCKOUT" | "LEAGUE_KNOCKOUT";
  startDate?: string | null;
  endDate?: string | null;
  overs?: string | number | null;
  description?: string | null;
};
function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string,
) {
  const baseSlug = slugify(name) || "tournament";

  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const { data, error } = await supabase
      .from("tournaments")
      .select("id")
      .eq("division_id", IDCA_DIVISION_ID)
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to check tournament slug: ${error.message}`);
    }

    if (!data) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function createTournament(input: CreateTournamentInput) {
  const { supabase, user } = await requireAdmin();

  const name = input.name?.trim();
const sessionId = input.sessionId?.trim() || null;
const clubCategoryId = input.clubCategoryId?.trim() || null;
const ageCategoryId = input.ageCategoryId?.trim() || null;
const description = input.description?.trim() || null;

if (!name) {
    throw new Error("Tournament name is required.");
  }

  if (!sessionId) {
    throw new Error("Session is required.");
  }

  if (!clubCategoryId) {
    throw new Error("Club category is required.");
  }

  if (!input.format) {
    throw new Error("Tournament format is required.");
  }

  const oversText =
  input.overs === null || input.overs === undefined
    ? ""
    : String(input.overs).trim();
  let overs: number | null = null;

  if (oversText) {
    const parsedOvers = Number(oversText);

    if (!Number.isInteger(parsedOvers) || parsedOvers <= 0) {
      throw new Error("Overs must be a positive whole number.");
    }

    overs = parsedOvers;
  }

  if (
    input.startDate &&
    input.endDate &&
    input.endDate < input.startDate
  ) {
    throw new Error("End date cannot be before start date.");
  }

  /*
   * ---------------------------------------------------------
   * Verify session
   * ---------------------------------------------------------
   */

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) {
    throw new Error(`Failed to validate session: ${sessionError.message}`);
  }

  if (!session) {
    throw new Error("Selected session does not exist.");
  }

  /*
   * ---------------------------------------------------------
   * Verify club category
   * ---------------------------------------------------------
   */

  const { data: clubCategory, error: clubCategoryError } = await supabase
    .from("club_categories")
    .select("id, code, name")
    .eq("id", clubCategoryId)
    .eq("division_id", IDCA_DIVISION_ID)
    .maybeSingle();

  if (clubCategoryError) {
    throw new Error(
      `Failed to validate club category: ${clubCategoryError.message}`,
    );
  }

  if (!clubCategory) {
    throw new Error("Selected club category is invalid.");
  }

  /*
   * ---------------------------------------------------------
   * Validate age-category rules
   *
   * A Grade / A Elite => age category required
   * B Grade            => age category must be empty
   * ---------------------------------------------------------
   */

  const requiresAgeCategory =
    clubCategory.code === "A_GRADE" ||
    clubCategory.code === "A_ELITE";

  if (requiresAgeCategory && !ageCategoryId) {
    throw new Error(
      "An age category is required for A Grade and A Elite tournaments.",
    );
  }

  if (clubCategory.code === "B_GRADE" && ageCategoryId) {
    throw new Error("B Grade tournaments cannot have an age category.");
  }

  /*
   * ---------------------------------------------------------
   * Verify age category
   * ---------------------------------------------------------
   */

  if (ageCategoryId) {
    const { data: ageCategory, error: ageCategoryError } = await supabase
      .from("age_categories")
      .select("id, code, name")
      .eq("id", ageCategoryId)
      .eq("division_id", IDCA_DIVISION_ID)
      .maybeSingle();

    if (ageCategoryError) {
      throw new Error(
        `Failed to validate age category: ${ageCategoryError.message}`,
      );
    }

    if (!ageCategory) {
      throw new Error("Selected age category is invalid.");
    }
  }

  /*
   * ---------------------------------------------------------
   * Check tournament creation permission
   * ---------------------------------------------------------
   */

  const { data: hasPermission, error: permissionError } = await supabase.rpc(
    "current_user_has_permission",
    {
      requested_permission: "tournament.create",
      requested_division: IDCA_DIVISION_ID,
    },
  );

  if (permissionError) {
    throw new Error(
      `Failed to verify tournament permission: ${permissionError.message}`,
    );
  }

  if (!hasPermission) {
    throw new Error("You do not have permission to create tournaments.");
  }

  /*
   * ---------------------------------------------------------
   * Generate unique slug
   * ---------------------------------------------------------
   */

  const slug = await generateUniqueSlug(supabase, name);

  /*
   * ---------------------------------------------------------
   * Create tournament
   *
   * IMPORTANT:
   * "overs" does NOT belong in this insert.
   * It belongs in tournament_settings.
   * ---------------------------------------------------------
   */

  const { data: tournament, error: tournamentError } = await supabase
  .from("tournaments")
  .insert({
    division_id: IDCA_DIVISION_ID,
    session_id: sessionId,
    name,
    slug,
    description,
    club_category_id: clubCategoryId,
    age_category_id: ageCategoryId,
    format: input.format,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    status: "DRAFT",
    created_by: user.id,
  })
  .select("id")
  .single();

  if (tournamentError || !tournament) {
    console.error("Failed to create tournament:", tournamentError);

    throw new Error(
      tournamentError?.message || "Failed to create tournament.",
    );
  }

  /*
   * ---------------------------------------------------------
   * Create tournament settings
   *
   * overs belongs here.
   * ---------------------------------------------------------
   */

  const { error: settingsError } = await supabase
    .from("tournament_settings")
    .insert({
      tournament_id: tournament.id,
      overs,
      points_win: 2,
      points_loss: 0,
      points_tie: 1,
      points_no_result: 1,
      allow_draw: false,
    });

  if (settingsError) {
    console.error(
      "Failed to create tournament settings:",
      settingsError,
    );

    /*
     * Best-effort cleanup so we don't leave an incomplete
     * tournament record behind.
     */
    await supabase
      .from("tournaments")
      .delete()
      .eq("id", tournament.id);

    throw new Error(
      settingsError.message ||
        "Tournament was created but its settings could not be saved.",
    );
  }

  /*
   * ---------------------------------------------------------
   * Audit log
   * ---------------------------------------------------------
   */

  const { error: auditError } = await supabase
    .from("audit_logs")
    .insert({
      division_id: IDCA_DIVISION_ID,
      user_id: user.id,
      action: "CREATE",
      entity_type: "tournament",
      entity_id: tournament.id,
      old_data: null,
      new_data: {
        name,
        session_id: sessionId,
        club_category_id: clubCategoryId,
        age_category_id: ageCategoryId,
        format: input.format,
        start_date: input.startDate || null,
        end_date: input.endDate || null,
        overs,
        description,
        status: "DRAFT",
      },
      metadata: {
        source: "admin_tournament_creation",
      },
    });

  if (auditError) {
    console.error("Failed to write tournament audit log:", auditError);
  }

  /*
   * ---------------------------------------------------------
   * Go to tournament workspace
   * ---------------------------------------------------------
   */

  redirect(`/admin/tournaments/${tournament.id}`);
}