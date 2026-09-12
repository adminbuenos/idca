import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type NoticePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicNoticePage({
  params,
}: NoticePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

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
      published_at,
      sessions (
        id,
        name,
        start_year,
        end_year
      )
    `)
    .eq("slug", slug)
    .eq("status", "PUBLISHED")
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
      file_name,
      mime_type,
      file_size
    )
  `)
  .eq("notice_id", notice.id)
  .order("display_order", { ascending: true });

if (documentsError) {
  console.error(
    "Failed to load notice attachments:",
    documentsError
  );
}

  const session = Array.isArray(notice.sessions)
    ? notice.sessions[0]
    : notice.sessions;

  return (
    <main className="min-h-screen bg-[#f7f3ea]">
      {/* Header */}
      <section className="relative overflow-hidden bg-[#071b2a]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#ef6c00]/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-6 py-12 sm:py-16">
          <Link
            href="/notices"
            className="inline-flex items-center text-sm font-semibold text-gray-300 transition hover:text-white"
          >
            ← Back to Notices
          </Link>

          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-3">
              {notice.notice_number && (
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#ef6c00]">
                  {notice.notice_number}
                </span>
              )}

              {notice.category && (
                <span className="rounded-full bg-[#ef6c00]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-orange-300">
                  {notice.category}
                </span>
              )}
            </div>

            <h1 className="mt-5 max-w-4xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              {notice.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-300">
              <span>
                Published{" "}
                <strong className="font-semibold text-white">
                  {formatDate(notice.published_at)}
                </strong>
              </span>

              {session?.name && (
                <span>
                  Session{" "}
                  <strong className="font-semibold text-white">
                    {session.name}
                  </strong>
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Notice document */}
      <section className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
        <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Official document heading */}
          <div className="border-b border-gray-200 px-6 py-7 sm:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                  Indore Division Cricket Association
                </p>

                <p className="mt-1 text-sm font-semibold text-[#071b2a]">
                  Official Notice
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Notice No.
                </p>

                <p className="mt-1 text-sm font-bold text-[#ef6c00]">
                  {notice.notice_number || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            {notice.content ? (
              <div className="whitespace-pre-wrap text-[15px] leading-8 text-gray-700">
                {notice.content}
              </div>
            ) : (
              <p className="text-sm italic text-gray-400">
                No notice content is available.
              </p>
            )}
          </div>

          {/* Publication information */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-6 sm:px-10">
            <div className="grid gap-5 sm:grid-cols-3">
              <MetaItem
                label="Published"
                value={formatDate(notice.published_at)}
              />

              <MetaItem
                label="Session"
                value={session?.name || "—"}
              />

              <MetaItem
                label="Category"
                value={notice.category || "General"}
              />
            </div>
          </div>
        </article>

        {noticeDocuments && noticeDocuments.length > 0 && (
  <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-200 px-6 py-5">
      <h2 className="text-lg font-bold text-[#071b2a]">
        Official Documents
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Signed and official documents attached to this notice.
      </p>
    </div>

    <div className="space-y-3 p-6">
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

            <a
              href={`/api/notices/${encodeURIComponent(
                notice.slug
              )}/documents/${document.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center justify-center rounded-xl bg-[#ef6c00] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#d95f00]"
            >
              View Official Copy →
            </a>
          </div>
        );
      })}
    </div>
  </section>
)}

        {/* Back */}
        <div className="mt-6">
          <Link
            href="/notices"
            className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-[#071b2a] transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#ef6c00]"
          >
            ← All Notices
          </Link>
        </div>
      </section>
    </main>
  );
}

function MetaItem({
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

      <p className="mt-1.5 text-sm font-semibold text-[#071b2a]">
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}