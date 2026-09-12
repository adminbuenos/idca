import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "idca-notices";

type RouteContext = {
  params: Promise<{
    slug: string;
    documentId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  const { slug, documentId } = await params;

  if (!slug || !documentId) {
    return new NextResponse("Invalid document request.", {
      status: 400,
    });
  }

  const supabase = createAdminClient();

  /*
   * Find the notice and verify that it is published.
   */
  const { data: notice, error: noticeError } = await supabase
    .from("notices")
    .select("id, slug, status")
    .eq("slug", slug)
    .eq("status", "PUBLISHED")
    .maybeSingle();

  if (noticeError) {
    console.error(
      "Failed to load notice for document:",
      noticeError
    );

    return new NextResponse("Unable to load notice.", {
      status: 500,
    });
  }

  if (!notice) {
    return new NextResponse("Notice not found.", {
      status: 404,
    });
  }

  /*
   * Verify that this document is actually attached
   * to the published notice.
   */
  const { data: noticeDocument, error: linkError } = await supabase
    .from("notice_documents")
    .select(`
      document_id,
      documents (
        id,
        storage_path,
        mime_type,
        file_name
      )
    `)
    .eq("notice_id", notice.id)
    .eq("document_id", documentId)
    .maybeSingle();

  if (linkError) {
    console.error(
      "Failed to load notice document:",
      linkError
    );

    return new NextResponse(
      "Unable to load notice document.",
      {
        status: 500,
      }
    );
  }

  if (!noticeDocument) {
    return new NextResponse(
      "Document is not attached to this notice.",
      {
        status: 404,
      }
    );
  }

  const document = Array.isArray(noticeDocument.documents)
    ? noticeDocument.documents[0]
    : noticeDocument.documents;

  if (!document) {
    return new NextResponse("Document not found.", {
      status: 404,
    });
  }

  /*
   * Generate a temporary signed URL for the private
   * Supabase Storage object.
   */
  const { data: signedUrl, error: signedUrlError } =
    await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(document.storage_path, 60 * 60);

  if (signedUrlError || !signedUrl?.signedUrl) {
    console.error(
      "Failed to create signed document URL:",
      signedUrlError
    );

    return new NextResponse(
      "Unable to open the document.",
      {
        status: 500,
      }
    );
  }

  return NextResponse.redirect(signedUrl.signedUrl);
}