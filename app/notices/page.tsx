import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const IDCA_DIVISION_ID = "89304127-99c2-4427-8edd-87a9aff3e167";

export default async function NoticesPage() {
  const supabase = await createClient();

  const { data: notices, error } = await supabase
    .from("notices")
    .select(`
      id,
      notice_number,
      title,
      slug,
      category,
      published_at,
      sessions (
        id,
        name
      )
    `)
    .eq("division_id", IDCA_DIVISION_ID)
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Failed to load public notices:", error);
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#071b2a]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#ef6c00]/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-[#ef6c00]">
            Indore Division Cricket Association
          </p>

          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Official Notices
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg">
            Official announcements, circulars and important information
            from IDCA.
          </p>
        </div>
      </section>

      {/* Notices */}
      <section className="mx-auto max-w-7xl px-6 py-10 sm:py-14">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
            <h2 className="text-lg font-bold text-red-700">
              Unable to load notices
            </h2>
            <p className="mt-2 text-sm text-red-600">
              Please try again later.
            </p>
          </div>
        ) : !notices || notices.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-3xl">
              📢
            </div>

            <h2 className="mt-5 text-xl font-black text-[#071b2a]">
              No notices published yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Official IDCA notices and announcements will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {notices.map((notice) => {
              const session = Array.isArray(notice.sessions)
                ? notice.sessions[0]
                : notice.sessions;

              return (
                <Link
                  key={notice.id}
                  href={`/notices/${notice.slug}`}
                  className="group block"
                >
                  <article className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md">
                    <div className="absolute bottom-0 left-0 top-0 w-1 bg-[#ef6c00]" />

                    <div className="p-6 pl-7 sm:p-7 sm:pl-9">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {notice.notice_number && (
                              <span className="text-xs font-black uppercase tracking-[0.16em] text-[#ef6c00]">
                                {notice.notice_number}
                              </span>
                            )}

                            {notice.category && (
                              <>
                                {notice.notice_number && (
                                  <span className="text-gray-300">
                                    •
                                  </span>
                                )}

                                <span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#c45a00]">
                                  {notice.category}
                                </span>
                              </>
                            )}
                          </div>

                          <h2 className="mt-3 text-xl font-black tracking-tight text-[#071b2a] transition group-hover:text-[#ef6c00] sm:text-2xl">
                            {notice.title}
                          </h2>

                          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-gray-500">
                            <span>
                              Published{" "}
                              {formatDate(notice.published_at)}
                            </span>

                            {session?.name && (
                              <span>
                                Session: {session.name}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          <span className="inline-flex items-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold text-[#071b2a] transition group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-[#ef6c00]">
                            Read Notice →
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
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