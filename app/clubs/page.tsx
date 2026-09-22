import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

const IDCA_DIVISION_ID =
  "89304127-99c2-4427-8edd-87a9aff3e167";

type Relation<T> = T | T[] | null;

type Session = {
  id: string;
  name: string;
  is_current: boolean;
};

type Category = {
  id: string;
  name: string;
  code: string;
  display_order: number;
};

type Club = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  logo_path: string | null;
  city: string | null;
  state: string | null;
  established_year: number | null;
};

type Registration = {
  id: string;
  club_id: string;
  session_id: string;
  category_id: string | null;
  registration_status: string;
  sessions: Relation<Session>;
  club_categories: Relation<Category>;
};

function getRelation<T>(
  relation: Relation<T>
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function getLogoUrl(
  supabaseUrl: string,
  logoPath: string | null
) {
  if (!logoPath) {
    return null;
  }

  return (
    `${supabaseUrl.replace(/\/$/, "")}` +
    `/storage/v1/object/public/club-logos/${logoPath}`
  );
}

export default async function ClubsPage() {
  const supabase = await createClient();

  /*
   * --------------------------------------------------------
   * Current session
   * --------------------------------------------------------
   */

  const {
    data: currentSession,
    error: sessionError,
  } = await supabase
    .from("sessions")
    .select(`
      id,
      name,
      is_current
    `)
    .eq("division_id", IDCA_DIVISION_ID)
    .eq("is_current", true)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (sessionError) {
    console.error(
      "Failed to load current session:",
      sessionError
    );

    throw new Error(
      "Failed to load club directory."
    );
  }

  /*
   * --------------------------------------------------------
   * No current session
   * --------------------------------------------------------
   */

  if (!currentSession) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            IDCA Clubs
          </h1>

          <p className="mt-3 text-slate-500">
            No current cricket session is available.
          </p>
        </div>
      </main>
    );
  }

  /*
   * --------------------------------------------------------
   * Current-session registrations
   * --------------------------------------------------------
   */

  const {
    data: registrations,
    error: registrationsError,
  } = await supabase
    .from("club_session_registrations")
    .select(`
      id,
      club_id,
      session_id,
      category_id,
      registration_status,
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
    `)
    .eq("session_id", currentSession.id)
    .eq("registration_status", "ACTIVE");

  if (registrationsError) {
    console.error(
      "Failed to load club registrations:",
      registrationsError
    );

    throw new Error(
      "Failed to load club directory."
    );
  }

  /*
   * --------------------------------------------------------
   * Clubs
   * --------------------------------------------------------
   */

  const clubIds = Array.from(
    new Set(
      (registrations ?? []).map(
        (registration) => registration.club_id
      )
    )
  );

  let clubs: Club[] = [];

  if (clubIds.length > 0) {
    const {
      data: clubData,
      error: clubsError,
    } = await supabase
      .from("clubs")
      .select(`
        id,
        name,
        short_name,
        slug,
        logo_path,
        city,
        state,
        established_year
      `)
      .eq("division_id", IDCA_DIVISION_ID)
      .eq("status", "ACTIVE")
      .in("id", clubIds);

    if (clubsError) {
      console.error(
        "Failed to load clubs:",
        clubsError
      );

      throw new Error(
        "Failed to load club directory."
      );
    }

    clubs = (clubData ?? []) as Club[];
  }

  /*
   * --------------------------------------------------------
   * Build directory records
   * --------------------------------------------------------
   */

  const registrationsWithClubs = (
    registrations ?? []
  )
    .map((registration) => {
      const club = clubs.find(
        (item) => item.id === registration.club_id
      );

      const category = getRelation(
        registration.club_categories as Relation<Category>
      );

      if (!club || !category) {
        return null;
      }

      return {
        registration:
          registration as unknown as Registration,
        club,
        category,
      };
    })
    .filter(
      (
        item
      ): item is {
        registration: Registration;
        club: Club;
        category: Category;
      } => item !== null
    );

  /*
   * --------------------------------------------------------
   * Group by category
   * --------------------------------------------------------
   */

  const categoryGroups = new Map<
    string,
    {
      category: Category;
      clubs: Club[];
    }
  >();

  for (
    const item of registrationsWithClubs
  ) {
    const existing =
      categoryGroups.get(item.category.id);

    if (existing) {
      existing.clubs.push(item.club);
    } else {
      categoryGroups.set(
        item.category.id,
        {
          category: item.category,
          clubs: [item.club],
        }
      );
    }
  }

  const groups = Array.from(
    categoryGroups.values()
  )
    .map((group) => ({
      ...group,
      clubs: group.clubs.sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }))
    .sort(
      (a, b) =>
        a.category.display_order -
        b.category.display_order
    );

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not configured."
    );
  }

  /*
   * --------------------------------------------------------
   * Render
   * --------------------------------------------------------
   */

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}

      <div className="mb-10">
        <div className="text-sm font-medium text-slate-500">
          Indore Division Cricket Association
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Clubs
        </h1>

        <p className="mt-3 max-w-2xl text-slate-600">
          Official clubs registered with IDCA for the{" "}
          <span className="font-semibold text-slate-900">
            {currentSession.name}
          </span>{" "}
          cricket session.
        </p>
      </div>

      {/* Empty state */}

      {groups.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
            🏏
          </div>

          <h2 className="mt-5 text-xl font-semibold text-slate-900">
            No clubs registered yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            The current session does not have any
            active club registrations.
          </p>
        </section>
      ) : (
        <div className="space-y-12">
          {groups.map((group) => (
            <section key={group.category.id}>
              {/* Category heading */}

              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {group.category.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {group.clubs.length}{" "}
                    {group.clubs.length === 1
                      ? "club"
                      : "clubs"}
                  </p>
                </div>
              </div>

              {/* Club cards */}

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.clubs.map((club) => {
                  const logoUrl =
                    getLogoUrl(
                      supabaseUrl,
                      club.logo_path
                    );

                  return (
                    <Link
                      key={club.id}
                      href={`/clubs/${club.slug}`}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex h-52 items-center justify-center bg-slate-50 p-6">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={`${club.name} logo`}
                            className="h-full w-full object-contain transition duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
                            🏏
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-slate-900 group-hover:text-slate-700">
                              {club.name}
                            </h3>

                            {club.short_name && (
                              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                                {club.short_name}
                              </p>
                            )}
                          </div>

                          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {group.category.code}
                          </span>
                        </div>

                        {(club.city ||
                          club.established_year) && (
                          <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                            {club.city && (
                              <span>
                                {club.city}
                                {club.state
                                  ? `, ${club.state}`
                                  : ""}
                              </span>
                            )}

                            {club.city &&
                              club.established_year && (
                                <span className="mx-2">
                                  •
                                </span>
                              )}

                            {club.established_year && (
                              <span>
                                Est.{" "}
                                {club.established_year}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}