"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/authorization";

const IDCA_DIVISION_ID = "89304127-99c2-4427-8edd-87a9aff3e167";

export type NoticeActionResult =
  | {
      success: true;
      noticeId: string;
    }
  | {
      success: false;
      error: string;
    };

type NoticeInput = {
  title: string;
  slug: string;
  noticeNumber?: string;
  category?: string;
  content?: string;
  sessionId?: string;
};

function cleanOptional(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function validateSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/**
 * Create a new notice as DRAFT.
 */
export async function createNotice(
  input: NoticeInput
): Promise<NoticeActionResult> {
  try {
    const { supabase, user } = await requireAdmin();

    const title = input.title.trim();
    const slug = input.slug.trim().toLowerCase();

    if (!title) {
      return {
        success: false,
        error: "Notice title is required.",
      };
    }

    if (!slug) {
      return {
        success: false,
        error: "Notice slug is required.",
      };
    }

    if (!validateSlug(slug)) {
      return {
        success: false,
        error:
          "Slug may contain only lowercase letters, numbers, and hyphens.",
      };
    }

    const { data: allowed, error: permissionError } =
      await supabase.rpc("current_user_has_permission", {
        requested_permission: "notice.create",
        requested_division: IDCA_DIVISION_ID,
      });

    if (permissionError) {
      console.error(
        "Notice create permission check failed:",
        permissionError
      );

      return {
        success: false,
        error: "Unable to verify notice permissions.",
      };
    }

    if (allowed !== true) {
      return {
        success: false,
        error: "You do not have permission to create notices.",
      };
    }

    const { data: existingSlug, error: slugError } = await supabase
      .from("notices")
      .select("id")
      .eq("division_id", IDCA_DIVISION_ID)
      .eq("slug", slug)
      .maybeSingle();

    if (slugError) {
      console.error("Notice slug check failed:", slugError);

      return {
        success: false,
        error: "Unable to validate notice slug.",
      };
    }

    if (existingSlug) {
      return {
        success: false,
        error: "A notice with this slug already exists.",
      };
    }

    const { data: notice, error } = await supabase
      .from("notices")
      .insert({
        division_id: IDCA_DIVISION_ID,
        session_id: input.sessionId || null,
        notice_number: cleanOptional(input.noticeNumber),
        title,
        slug,
        content: cleanOptional(input.content),
        category: cleanOptional(input.category),
        status: "DRAFT",
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();

    if (error || !notice) {
      console.error("Notice creation failed:", error);

      return {
        success: false,
        error: error?.message || "Unable to create notice.",
      };
    }

    const { error: auditError } = await supabase
      .from("audit_logs")
      .insert({
        division_id: IDCA_DIVISION_ID,
        user_id: user.id,
        action: "CREATE",
        entity_type: "notice",
        entity_id: notice.id,
        old_data: null,
        new_data: {
          status: "DRAFT",
          title,
          slug,
        },
        metadata: {
          operation: "CREATE_NOTICE",
        },
      });

    if (auditError) {
      console.error("Notice audit logging failed:", auditError);

      // The notice itself was successfully created.
      // We don't delete it just because audit logging failed.
      return {
        success: false,
        error:
          "Notice was created, but audit logging failed. Please contact an administrator.",
      };
    }

    return {
      success: true,
      noticeId: notice.id,
    };
  } catch (error) {
    console.error("Unexpected notice creation error:", error);

    return {
      success: false,
      error: "An unexpected error occurred while creating the notice.",
    };
  }
}


/**
 * Update editable notice fields.
 *
 * Lifecycle status is deliberately excluded.
 * Status changes must go through the dedicated transition actions.
 */
export async function updateNotice(
  noticeId: string,
  input: NoticeInput
): Promise<NoticeActionResult> {
  try {
    const { supabase, user } = await requireAdmin();

    const title = input.title.trim();
    const slug = input.slug.trim().toLowerCase();

    if (!noticeId) {
      return {
        success: false,
        error: "Notice ID is required.",
      };
    }

    if (!title) {
      return {
        success: false,
        error: "Notice title is required.",
      };
    }

    if (!slug || !validateSlug(slug)) {
      return {
        success: false,
        error:
          "Slug may contain only lowercase letters, numbers, and hyphens.",
      };
    }

    const { data: notice, error: noticeError } = await supabase
      .from("notices")
      .select("id, division_id, status")
      .eq("id", noticeId)
      .single();

    if (noticeError || !notice) {
      return {
        success: false,
        error: "Notice not found.",
      };
    }

    if (notice.division_id !== IDCA_DIVISION_ID) {
      return {
        success: false,
        error: "You are not authorized to edit this notice.",
      };
    }

    if (notice.status === "PUBLISHED" || notice.status === "ARCHIVED") {
      return {
        success: false,
        error:
          "Published or archived notices cannot be edited through the standard editor.",
      };
    }

    const { data: allowed, error: permissionError } =
      await supabase.rpc("current_user_has_permission", {
        requested_permission: "notice.edit",
        requested_division: notice.division_id,
      });

    if (permissionError || allowed !== true) {
      return {
        success: false,
        error: "You do not have permission to edit notices.",
      };
    }

    /*
     * Generic UPDATE is intentionally not exposed through normal RLS.
     * We therefore use the server-only service-role client AFTER
     * performing the authenticated permission checks above.
     */
    const admin = createAdminClient();

    const { data: updatedNotice, error: updateError } = await admin
      .from("notices")
      .update({
        session_id: input.sessionId || null,
        notice_number: cleanOptional(input.noticeNumber),
        title,
        slug,
        content: cleanOptional(input.content),
        category: cleanOptional(input.category),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", noticeId)
      .eq("division_id", notice.division_id)
      .select("id")
      .single();

    if (updateError || !updatedNotice) {
      console.error("Notice update failed:", updateError);

      return {
        success: false,
        error:
          updateError?.message || "Unable to update the notice.",
      };
    }

    const { error: auditError } = await supabase
      .from("audit_logs")
      .insert({
        division_id: notice.division_id,
        user_id: user.id,
        action: "UPDATE",
        entity_type: "notice",
        entity_id: noticeId,
        old_data: {
          status: notice.status,
        },
        new_data: {
          status: notice.status,
          title,
          slug,
        },
        metadata: {
          operation: "UPDATE_NOTICE",
        },
      });

    if (auditError) {
      console.error("Notice update audit logging failed:", auditError);

      return {
        success: false,
        error:
          "Notice was updated, but audit logging failed. Please contact an administrator.",
      };
    }

    return {
      success: true,
      noticeId,
    };
  } catch (error) {
    console.error("Unexpected notice update error:", error);

    return {
      success: false,
      error: "An unexpected error occurred while updating the notice.",
    };
  }
}


/**
 * Submit:
 *
 * DRAFT -> REVIEW
 */
export async function submitNoticeForReview(
  noticeId: string
): Promise<NoticeActionResult> {
  try {
    await requireAdmin();

    if (!noticeId) {
      return {
        success: false,
        error: "Notice ID is required.",
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc(
      "submit_notice_for_review",
      {
        notice_id: noticeId,
      }
    );

    if (error || !data) {
      console.error("Submit notice for review failed:", error);

      return {
        success: false,
        error:
          error?.message ||
          "Unable to submit the notice for review.",
      };
    }

    return {
      success: true,
      noticeId,
    };
  } catch (error) {
    console.error(
      "Unexpected submit-for-review error:",
      error
    );

    return {
      success: false,
      error:
        "An unexpected error occurred while submitting the notice.",
    };
  }
}


/**
 * Publish:
 *
 * REVIEW -> PUBLISHED
 */
export async function publishNotice(
  noticeId: string
): Promise<NoticeActionResult> {
  try {
    await requireAdmin();

    if (!noticeId) {
      return {
        success: false,
        error: "Notice ID is required.",
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("publish_notice", {
      notice_id: noticeId,
    });

    if (error || !data) {
      console.error("Publish notice failed:", error);

      return {
        success: false,
        error:
          error?.message || "Unable to publish the notice.",
      };
    }

    return {
      success: true,
      noticeId,
    };
  } catch (error) {
    console.error("Unexpected publish notice error:", error);

    return {
      success: false,
      error:
        "An unexpected error occurred while publishing the notice.",
    };
  }
}


/**
 * Archive:
 *
 * PUBLISHED -> ARCHIVED
 */
export async function archiveNotice(
  noticeId: string
): Promise<NoticeActionResult> {
  try {
    await requireAdmin();

    if (!noticeId) {
      return {
        success: false,
        error: "Notice ID is required.",
      };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("archive_notice", {
      notice_id: noticeId,
    });

    if (error || !data) {
      console.error("Archive notice failed:", error);

      return {
        success: false,
        error:
          error?.message || "Unable to archive the notice.",
      };
    }

    return {
      success: true,
      noticeId,
    };
  } catch (error) {
    console.error("Unexpected archive notice error:", error);

    return {
      success: false,
      error:
        "An unexpected error occurred while archiving the notice.",
    };
  }
}