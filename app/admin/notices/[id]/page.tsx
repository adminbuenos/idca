import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/authorization";
import {
  archiveNotice,
  publishNotice,
  submitNoticeForReview,
} from "@/lib/notices/actions";
import DocumentUpload from "./document-upload";
type NoticePageProps = {
  params: Promise<{
    id: string;
  }>;
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  REVIEW: "bg-amber-100 text-amber-800",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-slate-200 text-slate-700",
};

export default async function AdminNoticeDetailPage({
  params,
}: NoticePageProps) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: notice, error } = await supabase
    .from("notices")
    .select(`
      id,
      division_id,
      session_id,
      notice_number,
      title,
      slug,
      content,
      category,
      status,
      created_by,
      updated_by,
      published_by,
      created_at,
      updated_at,
      published_at,
      sessions (
        id,
        name,
        start_year,
        end_year
      )
    `)
    .eq("id", id)
    .single();

  if (error || !notice) {
    notFound();
  }

  const { data: noticeDocuments, error: documentsError } = await supabase
  .from("notice_documents")
  .select(`
    display_order,
    documents (
      id,
      title,
      file_name,
      mime_type,
      file_size,
      storage_path,
      visibility,
      created_at
    )
  `)
  .eq("notice_id", notice.id)
  .order("display_order", { ascending: true });

if (documentsError) {
  console.error("Failed to load notice attachments:", documentsError);
}
  const session = Array.isArray(notice.sessions)
    ? notice.sessions[0]
    : notice.sessions;

   async function submitForReview() {
    "use server";

    const result = await submitNoticeForReview(id);

    if (!result.success) {
      throw new Error(result.error);
    }

    redirect(`/admin/notices/${id}`);
  }

  async function publish() {
    "use server";

    const result = await publishNotice(id);

    if (!result.success) {
      throw new Error(result.error);
    }

    redirect(`/admin/notices/${id}`);
  }

  async function archive() {
    "use server";

    const result = await archiveNotice(id);

    if (!result.success) {
      throw new Error(result.error);
    }

    redirect(`/admin/notices/${id}`);
  }
  return (
    <main className="min-h-screen bg-[#f7f3ea] px-6 py-8">
      <div className="mx-auto max-w-5xl">

        {/* Back */}
        <Link
          href="/admin/notices"
          className="inline-flex items-center text-sm font-semibold text-gray-600 transition hover:text-[#ef6c00]"
        >
          ← Back to Notices
        </Link>

        {/* Header */}
        <div className="mt-6 mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#ef6c00]">
                IDCA Administration
              </p>

              <h1 className="text-3xl font-black tracking-tight text-[#071b2a] sm:text-4xl">
                {notice.title}
              </h1>

              {notice.notice_number && (
                <p className="mt-2 text-sm font-bold text-[#ef6c00]">
                  {notice.notice_number}
                </p>
              )}
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-black tracking-wide ${
                STATUS_STYLES[notice.status] ||
                "bg-gray-100 text-gray-700"
              }`}
            >
              {notice.status}
            </span>
          </div>
        </div>

        {/* Actions */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-[#071b2a]">
                Notice Actions
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage the notice through its publication lifecycle.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {notice.status === "DRAFT" && (
                <>
                  <Link
                    href={`/admin/notices/${notice.id}/edit`}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                  >
                    Edit
                  </Link>

                  <form action={submitForReview}>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-xl bg-[#ef6c00] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#d95f00]"
                    >
                      Submit for Review
                    </button>
                  </form>
                </>
              )}

              {notice.status === "REVIEW" && (
                <form action={publish}>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700"
                  >
                    Publish Notice
                  </button>
                </form>
              )}

              {notice.status === "PUBLISHED" && (
                <>
                  <Link
                    href={`/notices/${notice.slug}`}
                    target="_blank"
                    className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                  >
                    View Public Notice ↗
                  </Link>

                  <form action={archive}>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-xl bg-[#071b2a] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-black"
                    >
                      Archive
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Notice Information */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-bold text-[#071b2a]">
              Notice Information
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Official notice details.
            </p>
          </div>

          <div className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
            <InfoItem
              label="Notice Number"
              value={notice.notice_number || "—"}
            />

            <InfoItem
              label="Category"
              value={notice.category || "—"}
            />

            <InfoItem
              label="Session"
              value={session?.name || "—"}
            />

            <InfoItem
              label="URL Slug"
              value={`/notices/${notice.slug}`}
            />

            <InfoItem
              label="Created"
              value={formatDate(notice.created_at)}
            />

            <InfoItem
              label="Last Updated"
              value={formatDate(notice.updated_at)}
            />

            <InfoItem
              label="Published"
              value={
                notice.published_at
                  ? formatDate(notice.published_at)
                  : "Not published"
              }
            />

            <InfoItem
              label="Status"
              value={notice.status}
            />
          </div>
        </section>

        {/* Content */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-bold text-[#071b2a]">
              Notice Content
            </h2>
          </div>

          <div className="p-6">
            {notice.content ? (
              <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                {notice.content}
              </div>
            ) : (
              <p className="text-sm italic text-gray-400">
                No notice content has been added.
              </p>
            )}
          </div>
        </section>

        {/* Lifecycle */}
        <section className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 px-6 py-5">
          <h2 className="font-bold text-[#071b2a]">
            Publication Workflow
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold">
            <WorkflowStep
              label="DRAFT"
              active={notice.status === "DRAFT"}
            />

            <span className="text-gray-400">→</span>

            <WorkflowStep
              label="REVIEW"
              active={notice.status === "REVIEW"}
            />

            <span className="text-gray-400">→</span>

            <WorkflowStep
              label="PUBLISHED"
              active={notice.status === "PUBLISHED"}
            />

            {notice.status === "ARCHIVED" && (
              <>
                <span className="text-gray-400">→</span>

                <WorkflowStep
                  label="ARCHIVED"
                  active
                />
              </>
            )}
          </div>
        </section>

        {/* Attachments placeholder */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
  <div className="border-b border-gray-200 px-6 py-5">
    <h2 className="text-lg font-bold text-[#071b2a]">
      Attachments
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Documents attached to this notice.
    </p>
  </div>

  <div className="p-6">
    {noticeDocuments && noticeDocuments.length > 0 ? (
      <div className="space-y-3">
        {noticeDocuments.map((item) => {
          const document = Array.isArray(item.documents)
            ? item.documents[0]
            : item.documents;

          if (!document) {
            return null;
          }

          const fileSize =
            document.file_size &&
            document.file_size > 1024 * 1024
              ? `${(document.file_size / (1024 * 1024)).toFixed(1)} MB`
              : document.file_size
                ? `${(document.file_size / 1024).toFixed(1)} KB`
                : "";

          return (
            <div
              key={document.id}
              className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-xl">
                  📄
                </div>

                <div>
                  <p className="font-semibold text-[#071b2a]">
                    {document.file_name}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {document.mime_type || "Document"}
                    {fileSize ? ` · ${fileSize}` : ""}
                  </p>
                </div>
              </div>

             {notice.status === "PUBLISHED" && (
  <a
    href={`/api/notices/${encodeURIComponent(
      notice.slug
    )}/documents/${document.id}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex w-fit items-center rounded-lg bg-green-50 px-4 py-2 text-xs font-bold text-green-700 transition hover:bg-green-100"
  >
    View Official Copy →
  </a>
)}
            </div>
          );
        })}
      </div>
    ) : (
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-xl">
          📎
        </div>

        <p className="mt-3 text-sm font-semibold text-gray-600">
          No attachments yet
        </p>

        <p className="mt-1 text-xs text-gray-400">
          No document has been attached to this notice.
        </p>
      </div>
    )}

    {(notice.status === "DRAFT" || notice.status === "REVIEW") && (
      <div className="mt-5">
        <DocumentUpload noticeId={notice.id} />
      </div>
    )}

    {notice.status === "PUBLISHED" && (
      <div className="mt-5 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
        Attachments are locked because this notice has been published.
      </div>
    )}

    {notice.status === "ARCHIVED" && (
      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        Attachments are locked because this notice has been archived.
      </div>
    )}
  </div>
</section>

      </div>
    </main>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-semibold text-[#071b2a]">
        {value}
      </p>
    </div>
  );
}

function WorkflowStep({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 ${
        active
          ? "bg-[#ef6c00] text-white"
          : "bg-white text-gray-400"
      }`}
    >
      {label}
    </span>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}