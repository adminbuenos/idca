import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const IDCA_DIVISION_ID =
  "89304127-99c2-4427-8edd-87a9aff3e167";

type Club = {
  id: string;
  division_id: string;
  name: string;
  short_name: string | null;
  slug: string;
  logo_path: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  established_year: number | null;
  status: string;
};



type Session = {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
  is_current: boolean;
  status: string;
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
  registered_at: string | null;
  sessions:
    | Session
    | Session[]
    | null;
  club_categories:
    | ClubCategory
    | ClubCategory[]
    | null;
};

function getRelation<T>(
  value: T | T[] | null
): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function getInitials(
  shortName: string | null,
  name: string
) {
  return (
    shortName ||
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((word) => word[0])
      .join("")
  )
    .slice(0, 3)
    .toUpperCase();
}

function getCategoryClass(code: string) {
  switch (code) {
    case "A_ELITE":
      return "border-amber-300 bg-amber-50 text-amber-800";

    case "A_GRADE":
      return "border-blue-300 bg-blue-50 text-blue-800";

    case "B_GRADE":
      return "border-slate-300 bg-slate-50 text-slate-800";

    default:
      return "border-gray-300 bg-gray-50 text-gray-700";
  }
}

export default async function ClubProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();

  /*
   * ----------------------------------------------------------
   * Load the club
   * ----------------------------------------------------------
   */

  const { data: club, error: clubError } =
    await supabase
      .from("clubs")
      .select(`
        id,
        division_id,
        name,
        short_name,
        slug,
        logo_path,
        address,
        city,
        state,
        phone,
        email,
        website_url,
        established_year,
        status
      `)
      .eq("division_id", IDCA_DIVISION_ID)
      .eq("slug", slug)
      .eq("status", "ACTIVE")
      .maybeSingle();

  if (clubError) {
    console.error(
      "Failed to load club:",
      clubError
    );
    notFound();
  }

  if (!club) {
    notFound();
  }

  const typedClub = club as Club;

  const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is not configured."
  );
}

let logoUrl: string | null = null;

if (typedClub.logo_path) {
  logoUrl =
    `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/club-logos/${typedClub.logo_path}`;
}

  /*
   * ----------------------------------------------------------
   * Load the club's current active registration
   * ----------------------------------------------------------
   */

  const { data: currentSession, error: sessionError } =
    await supabase
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
      .eq("is_current", true)
      .eq("status", "ACTIVE")
      .maybeSingle();

  if (sessionError) {
    console.error(
      "Failed to load current session:",
      sessionError
    );
  }

  let registration: Registration | null = null;

  if (currentSession) {
    const {
      data: registrationData,
      error: registrationError,
    } = await supabase
      .from("club_session_registrations")
      .select(`
        id,
        club_id,
        session_id,
        category_id,
        registration_status,
        registered_at,
        sessions (
          id,
          name,
          start_year,
          end_year,
          is_current,
          status
        ),
        club_categories (
          id,
          name,
          code,
          display_order
        )
      `)
      .eq("club_id", typedClub.id)
      .eq("session_id", currentSession.id)
      .eq("registration_status", "ACTIVE")
      .maybeSingle();

    if (registrationError) {
      console.error(
        "Failed to load club registration:",
        registrationError
      );
    } else {
      registration =
        (registrationData as Registration | null) ??
        null;
    }
  }

  const category = registration
    ? getRelation(registration.club_categories)
    : null;

  const session = registration
    ? getRelation(registration.sessions)
    : currentSession;

  /*
   * ----------------------------------------------------------
   * Render
   * ----------------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/clubs"
            className="text-sm font-medium text-blue-700 hover:text-blue-900"
          >
            ← Back to Registered Clubs
          </Link>
        </div>
      </section>

      {/* Club Header */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* Logo */}
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
              {logoUrl ? (
  <img
    src={logoUrl}
    alt={`${typedClub.name} logo`}
    className="h-full w-full object-contain"
  />
) : (
  <div className="flex h-full w-full items-center justify-center">
    <span className="text-sm text-slate-400">
      No logo
    </span>
  </div>
)}
            </div>

            {/* Name */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                IDCA Registered Club
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {typedClub.name}
              </h1>

              {typedClub.short_name && (
                <p className="mt-2 text-lg font-medium text-gray-500">
                  {typedClub.short_name}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {category && (
                  <span
                    className={`rounded-full border px-3 py-1 text-sm font-semibold ${getCategoryClass(
                      category.code
                    )}`}
                  >
                    {category.name}
                  </span>
                )}

                {session && (
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-700">
                    Session {session.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Club Information */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-5">
                <h2 className="text-xl font-bold text-gray-900">
                  Club Information
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {typedClub.established_year && (
                  <div className="flex flex-col gap-1 px-6 py-5 sm:flex-row sm:justify-between sm:gap-6">
                    <span className="text-sm font-medium text-gray-500">
                      Established
                    </span>

                    <span className="text-sm font-semibold text-gray-900">
                      {typedClub.established_year}
                    </span>
                  </div>
                )}

                {typedClub.city && (
                  <div className="flex flex-col gap-1 px-6 py-5 sm:flex-row sm:justify-between sm:gap-6">
                    <span className="text-sm font-medium text-gray-500">
                      City
                    </span>

                    <span className="text-sm font-semibold text-gray-900">
                      {typedClub.city}
                    </span>
                  </div>
                )}

                {typedClub.state && (
                  <div className="flex flex-col gap-1 px-6 py-5 sm:flex-row sm:justify-between sm:gap-6">
                    <span className="text-sm font-medium text-gray-500">
                      State
                    </span>

                    <span className="text-sm font-semibold text-gray-900">
                      {typedClub.state}
                    </span>
                  </div>
                )}

                {typedClub.address && (
                  <div className="flex flex-col gap-1 px-6 py-5 sm:flex-row sm:justify-between sm:gap-6">
                    <span className="text-sm font-medium text-gray-500">
                      Address
                    </span>

                    <span className="text-sm font-semibold text-gray-900 sm:max-w-md sm:text-right">
                      {typedClub.address}
                    </span>
                  </div>
                )}

                {!typedClub.established_year &&
                  !typedClub.city &&
                  !typedClub.state &&
                  !typedClub.address && (
                    <div className="px-6 py-8 text-sm text-gray-500">
                      Additional club information has not
                      been provided yet.
                    </div>
                  )}
              </div>
            </div>

            {/* Current Registration */}
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-5">
                <h2 className="text-xl font-bold text-gray-900">
                  Current Registration
                </h2>
              </div>

              {registration && category && session ? (
                <div className="grid gap-5 px-6 py-6 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      Session
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {session.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Category
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {category.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Registration Status
                    </p>

                    <p className="mt-1 font-semibold text-green-700">
                      Active
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-8 text-sm text-gray-500">
                  This club does not have an active
                  registration for the current session.
                </div>
              )}
            </div>
          </div>

          {/* Contact */}
          <aside>
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-5">
                <h2 className="text-xl font-bold text-gray-900">
                  Contact
                </h2>
              </div>

              <div className="space-y-5 px-6 py-6">
                {typedClub.phone && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Phone
                    </p>

                    <a
                      href={`tel:${typedClub.phone}`}
                      className="mt-1 block text-sm font-medium text-blue-700 hover:text-blue-900"
                    >
                      {typedClub.phone}
                    </a>
                  </div>
                )}

                {typedClub.email && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Email
                    </p>

                    <a
                      href={`mailto:${typedClub.email}`}
                      className="mt-1 block break-words text-sm font-medium text-blue-700 hover:text-blue-900"
                    >
                      {typedClub.email}
                    </a>
                  </div>
                )}

                {typedClub.website_url && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Website
                    </p>

                    <a
                      href={typedClub.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block break-words text-sm font-medium text-blue-700 hover:text-blue-900"
                    >
                      Visit website →
                    </a>
                  </div>
                )}

                {!typedClub.phone &&
                  !typedClub.email &&
                  !typedClub.website_url && (
                    <p className="text-sm text-gray-500">
                      Contact information has not been
                      provided yet.
                    </p>
                  )}
              </div>
            </div>

            {/* IDCA Status */}
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6">
              <p className="text-sm font-semibold text-green-800">
                IDCA Registered Club
              </p>

              <p className="mt-2 text-sm leading-6 text-green-700">
                {registration
                  ? `This club is actively registered with IDCA for session ${session?.name ?? "the current session"}.`
                  : "This club is currently active in the IDCA club directory."}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}