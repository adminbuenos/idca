"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/authorization";

const IDCA_DIVISION_ID =
  "89304127-99c2-4427-8edd-87a9aff3e167";

function generateSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createClub(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const shortName =
    String(formData.get("shortName") ?? "").trim() || null;

  if (!name) {
    throw new Error("Club name is required.");
  }

  if (name.length > 150) {
    throw new Error("Club name is too long.");
  }

  if (shortName && shortName.length > 50) {
    throw new Error("Short name is too long.");
  }

  const baseSlug = generateSlug(name);

  if (!baseSlug) {
    throw new Error("Unable to generate a valid club slug.");
  }

  let slug = baseSlug;

  const { data: existingClub, error: existingError } =
    await supabase
      .from("clubs")
      .select("id")
      .eq("division_id", IDCA_DIVISION_ID)
      .eq("slug", slug)
      .maybeSingle();

  if (existingError) {
    console.error("Failed to check club slug:", existingError);
    throw new Error("Failed to validate club name.");
  }

  if (existingClub) {
    let suffix = 2;

    while (true) {
      const candidate = `${baseSlug}-${suffix}`;

      const { data: duplicate, error: duplicateError } =
        await supabase
          .from("clubs")
          .select("id")
          .eq("division_id", IDCA_DIVISION_ID)
          .eq("slug", candidate)
          .maybeSingle();

      if (duplicateError) {
        console.error(
          "Failed to check club slug:",
          duplicateError
        );
        throw new Error("Failed to validate club name.");
      }

      if (!duplicate) {
        slug = candidate;
        break;
      }

      suffix += 1;

      if (suffix > 1000) {
        throw new Error(
          "Unable to generate a unique club slug."
        );
      }
    }
  }

  const { data: club, error } = await supabase
    .from("clubs")
    .insert({
      division_id: IDCA_DIVISION_ID,
      name,
      short_name: shortName,
      slug,
      status: "ACTIVE",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create club:", error);
    throw new Error(
      `Failed to create club: ${error.message}`
    );
  }

  console.log("Club created:", {
    clubId: club.id,
    createdBy: user.id,
  });

  revalidatePath("/admin/clubs");
  redirect(`/admin/clubs/${club.id}`);
}

export async function updateClub(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const clubId = String(formData.get("clubId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const shortName =
    String(formData.get("shortName") ?? "").trim() || null;
  const establishedYearRaw = String(
    formData.get("establishedYear") ?? ""
  ).trim();
  const phone =
    String(formData.get("phone") ?? "").trim() || null;
  const email =
    String(formData.get("email") ?? "").trim() || null;
  const websiteUrl =
    String(formData.get("websiteUrl") ?? "").trim() || null;
  const address =
    String(formData.get("address") ?? "").trim() || null;
  const city =
    String(formData.get("city") ?? "").trim() || null;
  const state =
    String(formData.get("state") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "").trim();

  if (!clubId) {
    throw new Error("Club ID is required.");
  }

  if (!name) {
    throw new Error("Club name is required.");
  }

  if (name.length > 150) {
    throw new Error("Club name is too long.");
  }

  if (shortName && shortName.length > 50) {
    throw new Error("Short name is too long.");
  }

  if (
    status !== "ACTIVE" &&
    status !== "INACTIVE"
  ) {
    throw new Error("Invalid club status.");
  }

  let establishedYear: number | null = null;

  if (establishedYearRaw) {
    establishedYear = Number(establishedYearRaw);

    if (
      !Number.isInteger(establishedYear) ||
      establishedYear < 1800 ||
      establishedYear > 2100
    ) {
      throw new Error("Invalid established year.");
    }
  }

  const { data: existingClub, error: existingError } =
    await supabase
      .from("clubs")
      .select(`
        id,
        name,
        short_name,
        address,
        city,
        state,
        phone,
        email,
        website_url,
        established_year,
        status
      `)
      .eq("id", clubId)
      .eq("division_id", IDCA_DIVISION_ID)
      .maybeSingle();

  if (existingError) {
    console.error(
      "Failed to load club for update:",
      existingError
    );
    throw new Error("Failed to load club.");
  }

  if (!existingClub) {
    throw new Error("Club not found.");
  }

  const { error } = await supabase
    .from("clubs")
    .update({
      name,
      short_name: shortName,
      established_year: establishedYear,
      phone,
      email,
      website_url: websiteUrl,
      address,
      city,
      state,
      status,
    })
    .eq("id", clubId)
    .eq("division_id", IDCA_DIVISION_ID);

  if (error) {
    console.error("Failed to update club:", error);
    throw new Error(
      `Failed to update club: ${error.message}`
    );
  }

  console.log("Club updated:", {
    clubId,
    updatedBy: user.id,
  });

  revalidatePath("/admin/clubs");
  revalidatePath(`/admin/clubs/${clubId}`);
  revalidatePath(`/admin/clubs/${clubId}/edit`);

  redirect(`/admin/clubs/${clubId}`);
}

export async function createClubSessionRegistration(
  formData: FormData
) {
  const { supabase, user } = await requireAdmin();

  const clubId = String(formData.get("clubId") ?? "").trim();
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();

  if (!clubId) {
    throw new Error("Club is required.");
  }

  if (!sessionId) {
    throw new Error("Session is required.");
  }

  if (!categoryId) {
    throw new Error("Club category is required.");
  }

  /*
   * ----------------------------------------------------------
   * Verify the club belongs to IDCA and is active.
   * This uses the authenticated Supabase client.
   * ----------------------------------------------------------
   */
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id, division_id, status")
    .eq("id", clubId)
    .eq("division_id", IDCA_DIVISION_ID)
    .maybeSingle();

  if (clubError) {
    throw new Error(
      `Failed to validate club: ${clubError.message}`
    );
  }

  if (!club) {
    throw new Error(
      "Club not found or does not belong to this division."
    );
  }

  if (club.status !== "ACTIVE") {
    throw new Error("Only active clubs can be registered.");
  }

  /*
   * ----------------------------------------------------------
   * Verify the session belongs to IDCA and is active.
   * ----------------------------------------------------------
   */
  const { data: session, error: sessionError } =
    await supabase
      .from("sessions")
      .select("id, division_id, status")
      .eq("id", sessionId)
      .eq("division_id", IDCA_DIVISION_ID)
      .maybeSingle();

  if (sessionError) {
    throw new Error(
      `Failed to validate session: ${sessionError.message}`
    );
  }

  if (!session) {
    throw new Error(
      "Session not found or does not belong to this division."
    );
  }

  if (session.status !== "ACTIVE") {
    throw new Error("Only active sessions can be used.");
  }

  /*
   * ----------------------------------------------------------
   * Verify the club category belongs to IDCA and is active.
   * ----------------------------------------------------------
   */
  const { data: category, error: categoryError } =
    await supabase
      .from("club_categories")
      .select("id, division_id, status")
      .eq("id", categoryId)
      .eq("division_id", IDCA_DIVISION_ID)
      .maybeSingle();

  if (categoryError) {
    throw new Error(
      `Failed to validate club category: ${categoryError.message}`
    );
  }

  if (!category) {
    throw new Error(
      "Club category not found or does not belong to this division."
    );
  }

  if (category.status !== "ACTIVE") {
    throw new Error(
      "Only active club categories can be used."
    );
  }

  /*
   * ----------------------------------------------------------
   * Explicit authorization check.
   *
   * This is the important security boundary before using
   * the service-role client for the mutation.
   * ----------------------------------------------------------
   */
  const { data: canEdit, error: permissionError } =
    await supabase.rpc(
      "current_user_has_permission",
      {
        requested_permission: "club.edit",
        requested_division: IDCA_DIVISION_ID,
      }
    );

  if (permissionError) {
    throw new Error(
      `Failed to verify club permission: ${permissionError.message}`
    );
  }

  if (!canEdit) {
    throw new Error(
      "You do not have permission to manage club registrations."
    );
  }

  /*
   * ----------------------------------------------------------
   * Use the server-only service-role client for the actual
   * mutation.
   *
   * This avoids the child-table RLS evaluation problem while
   * keeping authorization in the server action.
   * ----------------------------------------------------------
   */
  const { createAdminClient } =
    await import("@/lib/supabase/admin");

  const adminSupabase = createAdminClient();

  /*
   * Check for an existing registration.
   */
  const {
    data: existingRegistration,
    error: existingError,
  } = await adminSupabase
    .from("club_session_registrations")
    .select(
      "id, registration_status"
    )
    .eq("club_id", clubId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Failed to check existing registration: ${existingError.message}`
    );
  }

  /*
   * Restore an existing inactive registration.
   */
  if (existingRegistration) {
    if (
      existingRegistration.registration_status ===
      "ACTIVE"
    ) {
      throw new Error(
        "This club is already registered for this session."
      );
    }

    const {
      data: restoredRegistration,
      error: restoreError,
    } = await adminSupabase
      .from("club_session_registrations")
      .update({
        category_id: categoryId,
        registration_status: "ACTIVE",
        registered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingRegistration.id)
      .select("id")
      .single();

    if (restoreError) {
      throw new Error(
        `Failed to restore registration: ${restoreError.message}`
      );
    }

    /*
     * Audit the restoration using the authenticated user's ID.
     */
    const { error: auditError } = await adminSupabase
      .from("audit_logs")
      .insert({
        division_id: IDCA_DIVISION_ID,
        user_id: user.id,
        action: "UPDATE",
        entity_type: "club_session_registration",
        entity_id: restoredRegistration.id,
        old_data: {
          registration_status: "INACTIVE",
        },
        new_data: {
          registration_status: "ACTIVE",
          category_id: categoryId,
        },
        metadata: {
          operation: "RESTORE_REGISTRATION",
          club_id: clubId,
          session_id: sessionId,
        },
      });

    if (auditError) {
      console.error(
        "Failed to write registration audit log:",
        auditError
      );
    }

    revalidatePath(`/admin/clubs/${clubId}`);
    redirect(`/admin/clubs/${clubId}`);
  }

  /*
   * ----------------------------------------------------------
   * Create a new registration.
   * ----------------------------------------------------------
   */
  const {
    data: registration,
    error: insertError,
  } = await adminSupabase
    .from("club_session_registrations")
    .insert({
      club_id: clubId,
      session_id: sessionId,
      category_id: categoryId,
      registration_status: "ACTIVE",
      registered_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(
      `Failed to create registration: ${insertError.message}`
    );
  }

  /*
   * Audit creation.
   */
  const { error: auditError } = await adminSupabase
  .from("audit_logs")
  .insert({
    division_id: IDCA_DIVISION_ID,
    user_id: user.id,
    action: "CREATE",
    entity_type: "club_session_registration",
    entity_id: registration.id,
    old_data: null,
    new_data: {
      club_id: clubId,
      session_id: sessionId,
      category_id: categoryId,
      registration_status: "ACTIVE",
    },
    metadata: {
      operation: "CREATE_REGISTRATION",
    },
  });

  if (auditError) {
    console.error(
      "Failed to write registration audit log:",
      auditError
    );
  }

  revalidatePath(`/admin/clubs/${clubId}`);
  redirect(`/admin/clubs/${clubId}`);
}

export async function updateClubSessionRegistration(
  formData: FormData
) {
  const { supabase, user } = await requireAdmin();

  const registrationId = String(
    formData.get("registration_id") ?? ""
  ).trim();

  const clubId = String(
    formData.get("club_id") ?? ""
  ).trim();

  const sessionId = String(
    formData.get("session_id") ?? ""
  ).trim();

  const categoryId = String(
    formData.get("category_id") ?? ""
  ).trim();

  if (!registrationId) {
    throw new Error("Registration is required.");
  }

  if (!clubId) {
    throw new Error("Club is required.");
  }

  if (!sessionId) {
    throw new Error("Session is required.");
  }

  if (!categoryId) {
    throw new Error("Club category is required.");
  }

  /*
   * Verify the club belongs to IDCA.
   */
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id, division_id, status")
    .eq("id", clubId)
    .eq("division_id", IDCA_DIVISION_ID)
    .maybeSingle();

  if (clubError) {
    throw new Error(
      `Failed to validate club: ${clubError.message}`
    );
  }

  if (!club) {
    throw new Error(
      "Club not found or does not belong to this division."
    );
  }

  /*
   * Verify the session belongs to IDCA.
   */
  const { data: session, error: sessionError } =
    await supabase
      .from("sessions")
      .select("id, division_id, status")
      .eq("id", sessionId)
      .eq("division_id", IDCA_DIVISION_ID)
      .maybeSingle();

  if (sessionError) {
    throw new Error(
      `Failed to validate session: ${sessionError.message}`
    );
  }

  if (!session) {
    throw new Error(
      "Session not found or does not belong to this division."
    );
  }

  /*
   * Verify the category belongs to IDCA.
   */
  const { data: category, error: categoryError } =
    await supabase
      .from("club_categories")
      .select("id, division_id, status")
      .eq("id", categoryId)
      .eq("division_id", IDCA_DIVISION_ID)
      .maybeSingle();

  if (categoryError) {
    throw new Error(
      `Failed to validate club category: ${categoryError.message}`
    );
  }

  if (!category) {
    throw new Error(
      "Club category not found or does not belong to this division."
    );
  }

  if (category.status !== "ACTIVE") {
    throw new Error(
      "Only active club categories can be used."
    );
  }

  /*
   * Verify the registration belongs to this club/session.
   */
  const { data: registration, error: registrationError } =
    await supabase
      .from("club_session_registrations")
      .select(
        "id, club_id, session_id, category_id, registration_status"
      )
      .eq("id", registrationId)
      .eq("club_id", clubId)
      .eq("session_id", sessionId)
      .maybeSingle();

  if (registrationError) {
    throw new Error(
      `Failed to load registration: ${registrationError.message}`
    );
  }

  if (!registration) {
    throw new Error(
      "Registration not found."
    );
  }

  /*
   * Explicit permission check.
   */
  const {
    data: canEdit,
    error: permissionError,
  } = await supabase.rpc(
    "current_user_has_permission",
    {
      requested_permission: "club.edit",
      requested_division: IDCA_DIVISION_ID,
    }
  );

  if (permissionError) {
    throw new Error(
      `Failed to verify club permission: ${permissionError.message}`
    );
  }

  if (!canEdit) {
    throw new Error(
      "You do not have permission to manage club registrations."
    );
  }

  /*
   * Use service-role client for the mutation.
   */
  const { createAdminClient } =
    await import("@/lib/supabase/admin");

  const adminSupabase = createAdminClient();

  const {
    data: updatedRegistration,
    error: updateError,
  } = await adminSupabase
    .from("club_session_registrations")
    .update({
      category_id: categoryId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", registrationId)
    .eq("club_id", clubId)
    .eq("session_id", sessionId)
    .select("id")
    .single();

  if (updateError) {
    throw new Error(
      `Failed to update registration: ${updateError.message}`
    );
  }

  /*
   * Audit the change.
   */
  const { error: auditError } = await adminSupabase
  .from("audit_logs")
  .insert({
    division_id: IDCA_DIVISION_ID,
    user_id: user.id,
    action: "UPDATE",
    entity_type: "club_session_registration",
    entity_id: updatedRegistration.id,
    old_data: {
      category_id: registration.category_id,
    },
    new_data: {
      category_id: categoryId,
    },
    metadata: {
      operation: "UPDATE_REGISTRATION_CATEGORY",
      club_id: clubId,
      session_id: sessionId,
    },
  });
  if (auditError) {
    console.error(
      "Failed to write registration audit log:",
      auditError
    );
  }

  revalidatePath(`/admin/clubs/${clubId}`);
  redirect(`/admin/clubs/${clubId}`);
}


export async function deactivateClubSessionRegistration(
  formData: FormData
) {
  const { supabase, user } = await requireAdmin();

  const registrationId = String(
    formData.get("registration_id") ?? ""
  ).trim();

  const clubId = String(
    formData.get("club_id") ?? ""
  ).trim();

  if (!registrationId) {
    throw new Error("Registration is required.");
  }

  if (!clubId) {
    throw new Error("Club is required.");
  }

  /*
   * Verify the registration belongs to an IDCA club.
   */
  const { data: registration, error: registrationError } =
    await supabase
      .from("club_session_registrations")
      .select(
        `
          id,
          club_id,
          session_id,
          registration_status,
          category_id,
          clubs (
            id,
            division_id
          )
        `
      )
      .eq("id", registrationId)
      .eq("club_id", clubId)
      .maybeSingle();

  if (registrationError) {
    throw new Error(
      `Failed to load registration: ${registrationError.message}`
    );
  }

  if (!registration) {
    throw new Error("Registration not found.");
  }

  const club = Array.isArray(registration.clubs)
    ? registration.clubs[0]
    : registration.clubs;

  if (
    !club ||
    club.division_id !== IDCA_DIVISION_ID
  ) {
    throw new Error(
      "Registration does not belong to this division."
    );
  }

  if (
    registration.registration_status !== "ACTIVE"
  ) {
    throw new Error(
      "This registration is already inactive."
    );
  }

  /*
   * Explicit permission check.
   */
  const {
    data: canEdit,
    error: permissionError,
  } = await supabase.rpc(
    "current_user_has_permission",
    {
      requested_permission: "club.edit",
      requested_division: IDCA_DIVISION_ID,
    }
  );

  if (permissionError) {
    throw new Error(
      `Failed to verify club permission: ${permissionError.message}`
    );
  }

  if (!canEdit) {
    throw new Error(
      "You do not have permission to manage club registrations."
    );
  }

  /*
   * Service-role mutation.
   */
  const { createAdminClient } =
    await import("@/lib/supabase/admin");

  const adminSupabase = createAdminClient();

  const {
    data: updatedRegistration,
    error: updateError,
  } = await adminSupabase
    .from("club_session_registrations")
    .update({
      registration_status: "INACTIVE",
      updated_at: new Date().toISOString(),
    })
    .eq("id", registrationId)
    .eq("club_id", clubId)
    .eq("registration_status", "ACTIVE")
    .select("id")
    .single();

  if (updateError) {
    throw new Error(
      `Failed to deactivate registration: ${updateError.message}`
    );
  }

  /*
   * Audit the deactivation.
   */
  const { error: auditError } = await adminSupabase
    .from("audit_logs")
    .insert({
      division_id: IDCA_DIVISION_ID,
      user_id: user.id,
      action: "UPDATE",
      entity_type: "club_session_registration",
      entity_id: updatedRegistration.id,
      old_data: {
        registration_status: "ACTIVE",
      },
      new_data: {
        registration_status: "INACTIVE",
      },
      metadata: {
        operation: "DEACTIVATE_REGISTRATION",
        club_id: clubId,
        registration_id: registrationId,
      },
    });

  if (auditError) {
    console.error(
      "Failed to write registration audit log:",
      auditError
    );
  }

  revalidatePath(`/admin/clubs/${clubId}`);
  redirect(`/admin/clubs/${clubId}`);
}


export async function restoreClubSessionRegistration(
  formData: FormData
) {
  const { supabase, user } = await requireAdmin();

  const registrationId = String(
    formData.get("registration_id") ?? ""
  ).trim();

  const clubId = String(
    formData.get("club_id") ?? ""
  ).trim();

  if (!registrationId || !clubId) {
    throw new Error("Invalid registration.");
  }

  /*
   * ----------------------------------------------------------
   * Verify club belongs to IDCA
   * ----------------------------------------------------------
   */

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id, division_id, status")
    .eq("id", clubId)
    .eq("division_id", IDCA_DIVISION_ID)
    .maybeSingle();

  if (clubError) {
    console.error("Failed to load club:", clubError);
    throw new Error("Failed to load club.");
  }

  if (!club) {
    throw new Error("Invalid club.");
  }

  /*
   * ----------------------------------------------------------
   * Permission check
   * ----------------------------------------------------------
   */

  const { data: canEdit, error: permissionError } =
    await supabase.rpc("current_user_has_permission", {
      requested_permission: "club.edit",
      requested_division: IDCA_DIVISION_ID,
    });

  if (permissionError) {
    console.error(
      "Failed to check club permission:",
      permissionError
    );

    throw new Error("Unable to verify permissions.");
  }

  if (!canEdit) {
    throw new Error(
      "You do not have permission to manage club registrations."
    );
  }

  /*
   * ----------------------------------------------------------
   * Load registration
   * ----------------------------------------------------------
   */

  const { data: registration, error: registrationError } =
    await supabase
      .from("club_session_registrations")
      .select(`
        id,
        club_id,
        session_id,
        registration_status,
        category_id
      `)
      .eq("id", registrationId)
      .eq("club_id", clubId)
      .maybeSingle();

  if (registrationError) {
    console.error(
      "Failed to load registration:",
      registrationError
    );

    throw new Error("Failed to load registration.");
  }

  if (!registration) {
    throw new Error("Registration not found.");
  }

  if (registration.registration_status === "ACTIVE") {
    throw new Error(
      "This registration is already active."
    );
  }

  /*
   * ----------------------------------------------------------
   * Use service role for controlled mutation
   * ----------------------------------------------------------
   */

  const { createAdminClient } =
    await import("@/lib/supabase/admin");

  const admin = createAdminClient();

  const { error: updateError } = await admin
    .from("club_session_registrations")
    .update({
      registration_status: "ACTIVE",
      updated_at: new Date().toISOString(),
    })
    .eq("id", registrationId)
.eq("club_id", clubId)
.eq("registration_status", "INACTIVE");

  if (updateError) {
    console.error(
      "Failed to restore registration:",
      updateError
    );

    throw new Error(
      `Failed to restore registration: ${updateError.message}`
    );
  }

  /*
   * ----------------------------------------------------------
   * Audit
   * ----------------------------------------------------------
   */

 const { error: auditError } = await admin
  .from("audit_logs")
  .insert({
    division_id: IDCA_DIVISION_ID,
    user_id: user.id,
    action: "UPDATE",
    entity_type: "club_session_registration",
    entity_id: registrationId,
    old_data: {
      registration_status: "INACTIVE",
    },
    new_data: {
      registration_status: "ACTIVE",
    },
    metadata: {
      operation: "RESTORE_REGISTRATION",
      club_id: clubId,
      session_id: registration.session_id,
    },
  });

if (auditError) {
  console.error(
    "Failed to write registration audit log:",
    auditError
  );
}

  revalidatePath(`/admin/clubs/${clubId}`);
  redirect(`/admin/clubs/${clubId}`);
}

export async function uploadClubLogo(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const clubId = String(
    formData.get("clubId") ?? ""
  ).trim();

  const file = formData.get("logo");

  if (!clubId) {
    throw new Error("Club ID is required.");
  }

  if (!(file instanceof File)) {
    throw new Error("Please select a logo image.");
  }

  if (file.size === 0) {
    throw new Error("The selected logo file is empty.");
  }

  /*
   * ----------------------------------------------------------
   * Validate file size
   * ----------------------------------------------------------
   */

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "Logo image must be 5 MB or smaller."
    );
  }

  /*
   * ----------------------------------------------------------
   * Validate MIME type
   * ----------------------------------------------------------
   */

  const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

  if (!allowedMimeTypes.has(file.type)) {
    throw new Error(
      "Logo must be a JPG, PNG, or WebP image."
    );
  }

  /*
   * ----------------------------------------------------------
   * Verify club belongs to IDCA
   * ----------------------------------------------------------
   */

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select(`
      id,
      division_id,
      name,
      logo_path
    `)
    .eq("id", clubId)
    .eq("division_id", IDCA_DIVISION_ID)
    .maybeSingle();

  if (clubError) {
    console.error(
      "Failed to load club for logo upload:",
      clubError
    );

    throw new Error(
      "Failed to load club."
    );
  }

  if (!club) {
    throw new Error(
      "Club not found or does not belong to this division."
    );
  }

  /*
   * ----------------------------------------------------------
   * Explicit permission check
   * ----------------------------------------------------------
   */

  const {
    data: canEdit,
    error: permissionError,
  } = await supabase.rpc(
    "current_user_has_permission",
    {
      requested_permission: "club.edit",
      requested_division: IDCA_DIVISION_ID,
    }
  );

  if (permissionError) {
    console.error(
      "Failed to check club permission:",
      permissionError
    );

    throw new Error(
      "Unable to verify permissions."
    );
  }

  if (!canEdit) {
    throw new Error(
      "You do not have permission to upload club logos."
    );
  }

  /*
   * ----------------------------------------------------------
   * Server-only Supabase client
   * ----------------------------------------------------------
   */

  const { createAdminClient } =
    await import("@/lib/supabase/admin");

  const admin = createAdminClient();

  /*
   * ----------------------------------------------------------
   * Determine extension
   * ----------------------------------------------------------
   */

  const extensionMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  const extension =
    extensionMap[file.type];

  if (!extension) {
    throw new Error(
      "Unsupported logo image type."
    );
  }

  /*
   * ----------------------------------------------------------
   * Generate unique storage path
   * ----------------------------------------------------------
   *
   * Example:
   *
   * club-uuid/logo-uuid.webp
   *
   * Never use the original filename as the storage path.
   * ----------------------------------------------------------
   */

  const storagePath =
    `${clubId}/logo-${crypto.randomUUID()}.${extension}`;

  /*
   * ----------------------------------------------------------
   * Upload new logo
   * ----------------------------------------------------------
   */

  const {
    error: uploadError,
  } = await admin.storage
    .from("club-logos")
    .upload(
      storagePath,
      file,
      {
        contentType: file.type,
        upsert: false,
      }
    );

  if (uploadError) {
    console.error(
      "Failed to upload club logo:",
      uploadError
    );

    throw new Error(
      `Failed to upload club logo: ${uploadError.message}`
    );
  }

  /*
   * ----------------------------------------------------------
   * Update database
   * ----------------------------------------------------------
   */

  const {
    data: updatedClub,
    error: updateError,
  } = await admin
    .from("clubs")
    .update({
      logo_path: storagePath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clubId)
    .eq("division_id", IDCA_DIVISION_ID)
    .select(`
      id,
      logo_path
    `)
    .single();

  if (updateError) {
    console.error(
      "Failed to save club logo path:",
      updateError
    );

    /*
     * Remove uploaded file if database update fails.
     * This prevents orphaned Storage files.
     */

    await admin.storage
      .from("club-logos")
      .remove([storagePath]);

    throw new Error(
      `Failed to save club logo: ${updateError.message}`
    );
  }

  /*
   * ----------------------------------------------------------
   * Remove previous logo
   * ----------------------------------------------------------
   */

  if (
    club.logo_path &&
    club.logo_path !== storagePath
  ) {
    const {
      error: removeOldLogoError,
    } = await admin.storage
      .from("club-logos")
      .remove([club.logo_path]);

    if (removeOldLogoError) {
      /*
       * Do not fail the operation because the new logo
       * is already correctly stored and referenced.
       *
       * Log the problem so the old file can be cleaned up.
       */

      console.error(
        "Failed to remove previous club logo:",
        removeOldLogoError
      );
    }
  }

  /*
   * ----------------------------------------------------------
   * Audit
   * ----------------------------------------------------------
   */

  const {
    error: auditError,
  } = await admin
    .from("audit_logs")
    .insert({
      division_id: IDCA_DIVISION_ID,
      user_id: user.id,
      action: "UPDATE",
      entity_type: "club",
      entity_id: updatedClub.id,
      old_data: {
        logo_path: club.logo_path,
      },
      new_data: {
        logo_path: storagePath,
      },
      metadata: {
        operation: "UPLOAD_CLUB_LOGO",
        club_id: clubId,
        file_type: file.type,
        file_size: file.size,
      },
    });

  if (auditError) {
    console.error(
      "Failed to write club logo audit log:",
      auditError
    );
  }

  /*
   * ----------------------------------------------------------
   * Refresh relevant pages
   * ----------------------------------------------------------
   */

  revalidatePath("/admin/clubs");
  revalidatePath(`/admin/clubs/${clubId}`);
  revalidatePath(`/admin/clubs/${clubId}/edit`);

  redirect(`/admin/clubs/${clubId}`);
}