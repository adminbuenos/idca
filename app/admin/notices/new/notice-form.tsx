"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import type { NoticeActionResult } from "@/lib/notices/actions";

type Session = {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
  is_current: boolean;
  status: string;
};

type NoticeFormProps = {
  action: (
    previousState: NoticeActionResult,
    formData: FormData
  ) => Promise<NoticeActionResult>;
  sessions: Session[];
};

const initialState: NoticeActionResult = {
  success: false,
  error: "",
};

export default function NoticeForm({
  action,
  sessions,
}: NoticeFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialState
  );

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  }

  useEffect(() => {
    if (state.success && state.noticeId) {
      window.location.href = `/admin/notices/${state.noticeId}`;
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      {/* Error */}
      {!state.success && state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-red-700">
            {state.error}
          </p>
        </div>
      )}

      {/* Main details */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-bold text-[#071b2a]">
            Notice Details
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the basic information for this notice.
          </p>
        </div>

        <div className="space-y-6 p-6">
          {/* Notice number */}
          <div>
            <label
              htmlFor="noticeNumber"
              className="mb-2 block text-sm font-bold"
            >
              Notice Number
            </label>

            <input
              id="noticeNumber"
              name="noticeNumber"
              type="text"
              placeholder="e.g. IDCA/2026/001"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#ef6c00] focus:ring-2 focus:ring-orange-100"
            />

            <p className="mt-1.5 text-xs text-gray-500">
              Optional. Use your official notice numbering format.
            </p>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-bold"
            >
              Notice Title <span className="text-[#ef6c00]">*</span>
            </label>

            <input
              id="title"
              name="title"
              type="text"
              required
              value={title}
              onChange={(event) =>
                handleTitleChange(event.target.value)
              }
              placeholder="Enter the official notice title"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#ef6c00] focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor="slug"
              className="mb-2 block text-sm font-bold"
            >
              URL Slug <span className="text-[#ef6c00]">*</span>
            </label>

            <div className="flex items-center overflow-hidden rounded-xl border border-gray-300 bg-white focus-within:border-[#ef6c00] focus-within:ring-2 focus-within:ring-orange-100">
              <span className="border-r border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500">
                /notices/
              </span>

              <input
                id="slug"
                name="slug"
                type="text"
                required
                value={slug}
                onChange={(event) =>
                  setSlug(
                    generateSlug(event.target.value)
                  )
                }
                placeholder="notice-title"
                className="min-w-0 flex-1 px-4 py-3 text-sm outline-none"
              />
            </div>

            <p className="mt-1.5 text-xs text-gray-500">
              Lowercase letters, numbers and hyphens only.
            </p>
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-bold"
            >
              Category
            </label>

            <input
              id="category"
              name="category"
              type="text"
              placeholder="e.g. Tournament, Club, Administration"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#ef6c00] focus:ring-2 focus:ring-orange-100"
            />

            <p className="mt-1.5 text-xs text-gray-500">
              Optional.
            </p>
          </div>

          {/* Session */}
          <div>
            <label
              htmlFor="sessionId"
              className="mb-2 block text-sm font-bold"
            >
              Session
            </label>

            <select
              id="sessionId"
              name="sessionId"
              defaultValue={
                sessions.find((session) => session.is_current)?.id ??
                ""
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ef6c00] focus:ring-2 focus:ring-orange-100"
            >
              <option value="">No session selected</option>

              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                  {session.is_current ? " — Current Session" : ""}
                </option>
              ))}
            </select>

            {sessions.length === 0 && (
              <p className="mt-1.5 text-xs text-amber-600">
                No active sessions are currently available.
              </p>
            )}
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="content"
              className="mb-2 block text-sm font-bold"
            >
              Notice Content
            </label>

            <textarea
              id="content"
              name="content"
              rows={12}
              placeholder="Write the official notice content here..."
              className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#ef6c00] focus:ring-2 focus:ring-orange-100"
            />

            <p className="mt-1.5 text-xs text-gray-500">
              You can add document attachments after the notice is created.
            </p>
          </div>
        </div>
      </section>

      {/* Status information */}
      <section className="rounded-2xl border border-orange-200 bg-orange-50 px-6 py-5">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm">
            📝
          </div>

          <div>
            <h3 className="font-bold text-[#071b2a]">
              This notice will be saved as a Draft
            </h3>

            <p className="mt-1 text-sm leading-6 text-gray-600">
              After saving, you can review the notice and submit it
              for approval before publishing it publicly.
            </p>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/admin/notices"
          className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-xl bg-[#ef6c00] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#d95f00] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving Draft..." : "Save Draft"}
        </button>
      </div>
    </form>
  );
}