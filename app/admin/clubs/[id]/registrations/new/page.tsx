import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/authorization";
import {
  createClubSessionRegistration,
} from "@/lib/clubs/actions";

const IDCA_DIVISION_ID =
  "89304127-99c2-4427-8edd-87a9aff3e167";

type Club = {
  id: string;
  name: string;
};

type Session = {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
  is_current: boolean;
};

type ClubCategory = {
  id: string;
  name: string;
  code: string;
  display_order: number;
};

export default async function NewClubRegistrationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { supabase } = await requireAdmin();

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("id", id)
    .eq("division_id", IDCA_DIVISION_ID)
    .maybeSingle();

  if (clubError) {
    console.error("Failed to load club:", clubError);
    throw new Error("Failed to load club.");
  }

  if (!club) {
    notFound();
  }

  const typedClub = club as Club;

  const { data: sessions, error: sessionsError } =
    await supabase
      .from("sessions")
      .select(`
        id,
        name,
        start_year,
        end_year,
        is_current
      `)
      .eq("division_id", IDCA_DIVISION_ID)
      .eq("status", "ACTIVE")
      .order("start_year", { ascending: false });

  if (sessionsError) {
    console.error(
      "Failed to load sessions:",
      sessionsError
    );
    throw new Error("Failed to load sessions.");
  }

  const { data: categories, error: categoriesError } =
    await supabase
      .from("club_categories")
      .select(`
        id,
        name,
        code,
        display_order
      `)
      .eq("division_id", IDCA_DIVISION_ID)
      .eq("status", "ACTIVE")
      .order("display_order", { ascending: true });

  if (categoriesError) {
    console.error(
      "Failed to load club categories:",
      categoriesError
    );
    throw new Error("Failed to load club categories.");
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="mb-2 text-sm text-slate-500">
          <Link
            href="/admin/clubs"
            className="hover:text-slate-900"
          >
            Clubs
          </Link>

          <span className="mx-2">/</span>

          <Link
            href={`/admin/clubs/${typedClub.id}`}
            className="hover:text-slate-900"
          >
            {typedClub.name}
          </Link>

          <span className="mx-2">/</span>

          <span>New Registration</span>
        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          Add Session Registration
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Register this club for a cricket session and
          assign its club category.
        </p>
      </div>

      <form
        action={createClubSessionRegistration}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <input
          type="hidden"
          name="clubId"
          value={typedClub.id}
        />

        <div className="space-y-5">
          <div>
            <label
              htmlFor="sessionId"
              className="block text-sm font-medium text-slate-700"
            >
              Cricket Session *
            </label>

            <select
              id="sessionId"
              name="sessionId"
              required
              defaultValue=""
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            >
              <option value="" disabled>
                Select session
              </option>

              {(sessions ?? []).map((session) => (
                <option
                  key={session.id}
                  value={session.id}
                >
                  {session.name}
                  {session.is_current ? " — Current" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="categoryId"
              className="block text-sm font-medium text-slate-700"
            >
              Club Category *
            </label>

            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue=""
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            >
              <option value="" disabled>
                Select category
              </option>

              {(categories ?? []).map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-slate-500">
              This determines the club&apos;s classification
              for the selected session.
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <Link
            href={`/admin/clubs/${typedClub.id}`}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Add Registration
          </button>
        </div>
      </form>
    </main>
  );
}