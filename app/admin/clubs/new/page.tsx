import Link from "next/link";

import { createClub } from "@/lib/clubs/actions";

export default function NewClubPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link
            href="/admin/clubs"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to Clubs
          </Link>

          <p className="mt-6 text-sm font-medium text-blue-600">
            Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Add Club
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Create the club's permanent IDCA identity. Session
            and category registration will be handled separately.
          </p>
        </div>

        <form
          action={createClub}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-slate-900"
              >
                Club Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                maxLength={150}
                placeholder="e.g. Malwa Cricket Club"
                className="mt-2 block w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />

              <p className="mt-1.5 text-xs text-slate-500">
                Use the club's official registered name.
              </p>
            </div>

            <div>
              <label
                htmlFor="shortName"
                className="block text-sm font-semibold text-slate-900"
              >
                Short Name
              </label>

              <input
                id="shortName"
                name="shortName"
                type="text"
                maxLength={50}
                placeholder="e.g. MCC"
                className="mt-2 block w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />

              <p className="mt-1.5 text-xs text-slate-500">
                Optional. Used for fixtures, scorecards and compact displays.
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                Session category
              </p>

              <p className="mt-1 text-sm text-slate-500">
                A club's A Elite, A Grade or B Grade classification
                is assigned separately for each session. It will
                not be selected here.
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
            <Link
              href="/admin/clubs"
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Create Club
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}