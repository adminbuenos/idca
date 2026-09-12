import Link from "next/link";
import { requireAdmin } from "@/lib/auth/authorization";
import { createNotice } from "@/lib/notices/actions";
import NoticeForm from "./notice-form";

const IDCA_DIVISION_ID = "89304127-99c2-4427-8edd-87a9aff3e167";

export default async function NewNoticePage() {
  const { supabase } = await requireAdmin();

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select(`
      id,
      name,
      start_year,
      end_year,
      is_current,
      status
    `)
    .eq("division_id", IDCA_DIVISION_ID)
    .eq("status", "ACTIVE")
    .order("start_year", { ascending: false });

  if (error) {
    console.error("Failed to load sessions:", error);
  }

    async function createNoticeAction(
    _previousState: {
      success: boolean;
      noticeId?: string;
      error?: string;
    },
    formData: FormData
  ) {
    "use server";

    return createNotice({
      title: String(formData.get("title") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      noticeNumber: String(formData.get("noticeNumber") ?? ""),
      category: String(formData.get("category") ?? ""),
      content: String(formData.get("content") ?? ""),
      sessionId: String(formData.get("sessionId") ?? ""),
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-6 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Back */}
        <Link
          href="/admin/notices"
          className="inline-flex items-center text-sm font-semibold text-gray-600 transition hover:text-[#ef6c00]"
        >
          ← Back to Notices
        </Link>

        {/* Header */}
        <div className="mt-6 mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#ef6c00]">
            IDCA Administration
          </p>

          <h1 className="text-3xl font-black tracking-tight text-[#071b2a] sm:text-4xl">
            Create Notice
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Create a new official IDCA notice. It will be saved as a draft.
          </p>
        </div>

        {/* Form */}
        <NoticeForm
          action={createNoticeAction}
          sessions={sessions ?? []}
        />
      </div>
    </main>
  );
}