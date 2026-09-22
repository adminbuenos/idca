import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/authorization";
import { updateClubSessionRegistration } from "@/lib/clubs/actions";

const IDCA_DIVISION_ID =
  "89304127-99c2-4427-8edd-87a9aff3e167";

type Relation<T> = T | T[] | null;

type Club = {
  id: string;
  division_id: string;
  name: string;
  short_name: string | null;
};

type Session = {
  id: string;
  name: string;
  is_current: boolean;
};

type ClubCategory = {
  id: string;
  name: string;
  code: string;
  display_order: number;
};

type Registration = {
  id: string;
  club_id: string;
  session_id: string;
  category_id: string | null;
  registration_status: string;
  clubs: Relation<Club>;
  sessions: Relation<Session>;
  club_categories: Relation<ClubCategory>;
};

function getRelation<T>(
  relation: Relation<T>
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

export default async function EditClubRegistrationPage({
  params,
}: {
  params: Promise<{
    id: string;
    registrationId: string;
  }>;
}) {
  const { id, registrationId } = await params;

  const { supabase } = await requireAdmin();

  /*
   * ----------------------------------------------------------
   * Load registration
   * ----------------------------------------------------------
   */

  const {
    data: registration,
    error: registrationError,
  } = await supabase
    .from("club_session_registrations")
    .select(
      `
        id,
        club_id,
        session_id,
        category_id,
        registration_status,

        clubs (
  id,
  division_id,
  name,
  short_name
),

        sessions (
          id,
          name,
          is_current
        ),

        club_categories (
          id,
          name,
          code,
          display_order
        )
      `
    )
    .eq("id", registrationId)
    .eq("club_id", id)
    .maybeSingle();

  if (registrationError) {
    console.error(
      "Failed to load club registration:",
      registrationError
    );

    throw new Error(
      `Failed to load registration: ${registrationError.message}`
    );
  }

  if (!registration) {
    notFound();
  }

  const typedRegistration =
    registration as unknown as Registration;

  const club = getRelation(
    typedRegistration.clubs
  );

  const session = getRelation(
    typedRegistration.sessions
  );

  /*
   * ----------------------------------------------------------
   * Verify this is an IDCA registration.
   * ----------------------------------------------------------
   */

  if (!club || !session) {
    notFound();
  }

  if (club.division_id !== IDCA_DIVISION_ID) {
  notFound();
}

  /*
   * ----------------------------------------------------------
   * Load active club categories.
   * ----------------------------------------------------------
   */

  const {
    data: categories,
    error: categoriesError,
  } = await supabase
    .from("club_categories")
    .select(
      `
        id,
        name,
        code,
        display_order
      `
    )
    .eq("division_id", IDCA_DIVISION_ID)
    .eq("status", "ACTIVE")
    .order("display_order", {
      ascending: true,
    });

  if (categoriesError) {
    console.error(
      "Failed to load club categories:",
      categoriesError
    );

    throw new Error(
      `Failed to load categories: ${categoriesError.message}`
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href={`/admin/clubs/${id}`}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to Club
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Edit Session Registration
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Update the club category for this cricket session.
          </p>
        </div>

        {/* Club / Session summary */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Registration Details
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Club
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {club.name}
              </p>

              {club.short_name && (
                <p className="mt-0.5 text-sm text-slate-500">
                  {club.short_name}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Session
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {session.name}
              </p>

              {session.is_current && (
                <p className="mt-1 text-xs font-medium text-emerald-600">
                  Current Session
                </p>
              )}
            </div>

          </div>
        </section>

        {/* Edit form */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Club Category
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select the category in which this club is registered
              for the selected session.
            </p>
          </div>

          <form
            action={updateClubSessionRegistration}
            className="space-y-6 p-6"
          >
            <input
              type="hidden"
              name="registration_id"
              value={typedRegistration.id}
            />

            <input
              type="hidden"
              name="club_id"
              value={typedRegistration.club_id}
            />

            <input
              type="hidden"
              name="session_id"
              value={typedRegistration.session_id}
            />

            <div>
              <label
                htmlFor="category_id"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Club Category
              </label>

              <select
                id="category_id"
                name="category_id"
                required
                defaultValue={
                  typedRegistration.category_id ?? ""
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="" disabled>
                  Select club category
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
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">

              <Link
                href={`/admin/clubs/${id}`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Save Changes
              </button>

            </div>
          </form>
        </section>

      </div>
    </main>
  );
}