"use server";

import { requireAdmin } from "@/lib/auth/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

const IDCA_DIVISION_ID = "89304127-99c2-4427-8edd-87a9aff3e167";
const BUCKET_NAME = "idca-notices";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export type NoticeDocumentActionResult =
  | {
      success: true;
      documentId: string;
    }
  | {
      success: false;
      error: string;
    };

function getFileExtension(fileName: string, mimeType: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension && ["pdf", "jpg", "jpeg", "png"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  switch (mimeType) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    default:
      return null;
  }
}

export async function addNoticeDocument(
  noticeId: string,
  fileName: string,
  mimeType: string,
  fileSize: number,
  storagePath: string
): Promise<NoticeDocumentActionResult> {
  try {
    const { supabase, user } = await requireAdmin();

    if (!noticeId || !fileName || !mimeType || !storagePath) {
      return {
        success: false,
        error: "Missing document information.",
      };
    }

    if (!ALLOWED_MIME_TYPES.includes(
      mimeType as (typeof ALLOWED_MIME_TYPES)[number]
    )) {
      return {
        success: false,
        error: "Only PDF, JPG and PNG files are allowed.",
      };
    }

    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return {
        success: false,
        error: "Invalid file size.",
      };
    }

    if (fileSize > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "File size cannot exceed 10 MB.",
      };
    }

    const extension = getFileExtension(fileName, mimeType);

    if (!extension) {
      return {
        success: false,
        error: "Unsupported file type.",
      };
    }

    const { data: notice, error: noticeError } = await supabase
      .from("notices")
      .select("id, division_id, status, title")
      .eq("id", noticeId)
      .eq("division_id", IDCA_DIVISION_ID)
      .maybeSingle();

    if (noticeError) {
      console.error("Failed to load notice:", noticeError);

      return {
        success: false,
        error: "Failed to load notice.",
      };
    }

    if (!notice) {
      return {
        success: false,
        error: "Notice not found.",
      };
    }

    if (notice.status === "PUBLISHED" || notice.status === "ARCHIVED") {
      return {
        success: false,
        error:
          "Documents cannot be added to published or archived notices.",
      };
    }

    const { data: canEdit, error: permissionError } = await supabase.rpc(
      "current_user_has_permission",
      {
        requested_permission: "notice.edit",
        requested_division: IDCA_DIVISION_ID,
      }
    );

    if (permissionError) {
      console.error(
        "Failed to check notice document permission:",
        permissionError
      );

      return {
        success: false,
        error: "Unable to verify your permission.",
      };
    }

    if (canEdit !== true) {
      return {
        success: false,
        error: "You do not have permission to add documents to this notice.",
      };
    }

    const expectedPrefix = `notices/${noticeId}/`;

    if (!storagePath.startsWith(expectedPrefix)) {
      return {
        success: false,
        error: "Invalid document storage path.",
      };
    }

    const admin = createAdminClient();

    const { data: existingDocuments, error: existingError } = await admin
      .from("documents")
      .select("id")
      .eq("division_id", IDCA_DIVISION_ID)
      .eq("storage_path", storagePath)
      .limit(1);

    if (existingError) {
      console.error(
        "Failed to check existing document:",
        existingError
      );

      return {
        success: false,
        error: "Failed to validate document.",
      };
    }

    if (existingDocuments && existingDocuments.length > 0) {
      return {
        success: false,
        error: "This document has already been added.",
      };
    }

    const { data: document, error: documentError } = await admin
      .from("documents")
      .insert({
        division_id: IDCA_DIVISION_ID,
        session_id: null,
        title: fileName,
        description: `Official document attached to notice: ${notice.title}`,
        category: "NOTICE_ATTACHMENT",
        storage_path: storagePath,
        file_name: fileName,
        mime_type: mimeType,
        file_size: fileSize,
        visibility: "PUBLIC",
        uploaded_by: user.id,
      })
      .select("id")
      .single();

    if (documentError || !document) {
      console.error(
        "Failed to create document record:",
        documentError
      );

      return {
        success: false,
        error: "Failed to save document information.",
      };
    }

    const { data: maxOrderRows, error: orderError } = await admin
      .from("notice_documents")
      .select("display_order")
      .eq("notice_id", noticeId)
      .order("display_order", { ascending: false })
      .limit(1);

    if (orderError) {
      console.error(
        "Failed to determine document display order:",
        orderError
      );

      await admin
        .from("documents")
        .delete()
        .eq("id", document.id);

      return {
        success: false,
        error: "Failed to prepare document attachment.",
      };
    }

    const nextDisplayOrder =
      maxOrderRows && maxOrderRows.length > 0
        ? (maxOrderRows[0].display_order ?? 0) + 1
        : 0;

    const { error: linkError } = await admin
      .from("notice_documents")
      .insert({
        notice_id: noticeId,
        document_id: document.id,
        display_order: nextDisplayOrder,
      });

    if (linkError) {
      console.error(
        "Failed to link document to notice:",
        linkError
      );

      await admin
        .from("documents")
        .delete()
        .eq("id", document.id);

      return {
        success: false,
        error: "Failed to attach document to notice.",
      };
    }

    return {
      success: true,
      documentId: document.id,
    };
  } catch (error) {
    console.error("Unexpected notice document error:", error);

    return {
      success: false,
      error: "Something went wrong while adding the document.",
    };
  }
}