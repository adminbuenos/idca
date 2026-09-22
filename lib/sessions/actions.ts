"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

const IDCA_DIVISION_ID =
  "89304127-99c2-4427-8edd-87a9aff3e167";

export async function createSession(formData: FormData) {
  const { user } = await requireAdmin();

  const startYear = Number(
    String(formData.get("start_year") ?? "").trim()
  );

  const endYear = Number(
    String(formData.get("end_year") ?? "").trim()
  );

  const isCurrent =
    String(formData.get("is_current") ?? "") === "on";

  if (
    !Number.isInteger(startYear) ||
    startYear < 2000 ||
    startYear > 2200
  ) {
    throw new Error("Invalid start year.");
  }

  if (
    !Number.isInteger(endYear) ||
    endYear < 2001 ||
    endYear > 2201
  ) {
    throw new Error("Invalid end year.");
  }

  if (endYear !== startYear + 1) {
    throw new Error(
      "The end year must be exactly one year after the start year."
    );
  }

  const name = `${startYear}-${String(endYear).slice(-2)}`;

  const admin = createAdminClient();

  /*
   * Prevent duplicate seasons.
   */
  const { data: existing, error: existingError } =
    await admin
      .from("sessions")
      .select("id")
      .eq("division_id", IDCA_DIVISION_ID)
      .eq("name", name)
      .maybeSingle();

  if (existingError) {
    console.error(
      "Failed to check existing season:",
      existingError
    );

    throw new Error("Unable to check existing seasons.");
  }

  if (existing) {
    throw new Error(
      `Season ${name} already exists.`
    );
  }

  /*
   * If this is the current season, clear the current flag
   * from other IDCA seasons first.
   */
  if (isCurrent) {
    const { error: clearCurrentError } = await admin
      .from("sessions")
      .update({
        is_current: false,
        updated_at: new Date().toISOString(),
      })
      .eq("division_id", IDCA_DIVISION_ID)
      .eq("is_current", true);

    if (clearCurrentError) {
      console.error(
        "Failed to clear current season:",
        clearCurrentError
      );

      throw new Error(
        "Unable to update the current season."
      );
    }
  }

  const { data: session, error } = await admin
    .from("sessions")
    .insert({
      division_id: IDCA_DIVISION_ID,
      name,
      start_year: startYear,
      end_year: endYear,
      is_current: isCurrent,
      status: "ACTIVE",
    })
    .select("id, name")
    .single();

  if (error) {
    console.error("Failed to create season:", error);

    throw new Error(
      `Failed to create season: ${error.message}`
    );
  }

  /*
   * Audit creation.
   */
  const { error: auditError } = await admin
    .from("audit_logs")
    .insert({
      division_id: IDCA_DIVISION_ID,
      user_id: user.id,
      action: "CREATE",
      entity_type: "SESSION",
      entity_id: session.id,
      old_data: null,
      new_data: {
        name,
        start_year: startYear,
        end_year: endYear,
        is_current: isCurrent,
        status: "ACTIVE",
      },
      metadata: {
        operation: "CREATE_SESSION",
      },
    });

  if (auditError) {
    console.error(
      "Failed to write season audit log:",
      auditError
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/sessions");
  revalidatePath("/admin/clubs");

  redirect("/admin/sessions");
}