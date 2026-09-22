import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/authorization";
import {
  deactivateClubSessionRegistration,
  restoreClubSessionRegistration,
} from "@/lib/clubs/actions";
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
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
  updated_at: string;
};

type SessionRegistration = {
  id: string;
  registration_status: string;
  registered_at: string;
  sessions:
    | {
        id: string;
        name: string;
      }
    | {
        id: string;
        name: string;
      }[]
    | null;
  club_categories:
    | {
        id: string;
        name: string;
        code: string;
      }
    | {
        id: string;
        name: string;
        code: string;
      }[]
    | null;
};

function getRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { supabase } = await requireAdmin();

  const { data: club, error } = await supabase
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
      status,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .eq("division_id", IDCA_DIVISION_ID)
    .maybeSingle();

  if (error) {
    console.error("Failed to load club:", error);
    throw new Error("Failed to load club.");
  }

  if (!club) {
    notFound();
  }

  const typedClub = club as Club;

  const { data: registrations, error: registrationsError } =
    await supabase
      .from("club_session_registrations")
      .select(`
        id,
        registration_status,
        registered_at,
        sessions (
          id,
          name
        ),
        club_categories (
          id,
          name,
          code
        )
      `)
      .eq("club_id", typedClub.id)
      .order("registered_at", {
        ascending: false,
      });

  if (registrationsError) {
    console.error(
      "Failed to load club registrations:",
      registrationsError
    );
    throw new Error("Failed to load club registrations.");
  }

  const typedRegistrations =
    (registrations ?? []) as unknown as SessionRegistration[];

  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 text-sm text-slate-500">
            <Link
              href="/admin/clubs"
              className="hover:text-slate-900"
            >
              Clubs
            </Link>
            <span className="mx-2">/</span>
            <span>{typedClub.name}</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            {typedClub.name}
          </h1>

          {typedClub.short_name && (
            <p className="mt-1 text-slate-500">
              {typedClub.short_name}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin/clubs"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to Clubs
          </Link>

          <Link
            href={`/admin/clubs/${typedClub.id}/edit`}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Edit Club
          </Link>
        </div>
      </div>

      {/* Club overview */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Club Information
          </h2>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              typedClub.status === "ACTIVE"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {typedClub.status}
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            label="Club Name"
            value={typedClub.name}
          />

          <InfoItem
            label="Short Name"
            value={typedClub.short_name}
          />

          <InfoItem
            label="Established Year"
            value={
              typedClub.established_year
                ? String(typedClub.established_year)
                : null
            }
          />

          <InfoItem
            label="Phone"
            value={typedClub.phone}
          />

          <InfoItem
            label="Email"
            value={typedClub.email}
          />

          <InfoItem
            label="Website"
            value={typedClub.website_url}
          />

          <InfoItem
            label="City"
            value={typedClub.city}
          />

          <InfoItem
            label="State"
            value={typedClub.state}
          />

          <InfoItem
            label="Slug"
            value={typedClub.slug}
          />

          <div className="md:col-span-2 lg:col-span-3">
            <InfoItem
              label="Address"
              value={typedClub.address}
            />
          </div>
        </div>
      </section>

      {/* Session registrations */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Session Registrations
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The club&apos;s category for each cricket session.
            </p>
          </div>

          <Link
  href={`/admin/clubs/${typedClub.id}/registrations/new`}
  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
>
  Add Registration
</Link>
        </div>

        {typedRegistrations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-medium text-slate-700">
              No session registrations yet
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Session/category registration will be managed here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
  <tr>
    <th className="px-6 py-3 font-semibold text-slate-700">
      Session
    </th>

    <th className="px-6 py-3 font-semibold text-slate-700">
      Category
    </th>

    <th className="px-6 py-3 font-semibold text-slate-700">
      Status
    </th>

    <th className="px-6 py-3 font-semibold text-slate-700">
      Registered
    </th>

    <th className="px-6 py-3 text-right font-semibold text-slate-700">
      Actions
    </th>
  </tr>
</thead>

              <tbody>
                {typedRegistrations.map((registration) => {
                  const session = getRelation(
                    registration.sessions
                  );

                  const category = getRelation(
                    registration.club_categories
                  );

                  return (
                    <tr
                      key={registration.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {session?.name ?? "—"}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {category?.name ?? "—"}
                      </td>

                      <td className="px-6 py-4">
                        <span
  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
    registration.registration_status === "ACTIVE"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-red-100 text-red-700"
  }`}
>
  {registration.registration_status}
</span>
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(
                          registration.registered_at
                        )}
                      </td>

                    <td className="px-6 py-4 text-right">
  <div className="flex justify-end gap-2">
    <Link
      href={`/admin/clubs/${typedClub.id}/registrations/${registration.id}/edit`}
      className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
    >
      Edit
    </Link>

    {registration.registration_status === "ACTIVE" ? (
      <form action={deactivateClubSessionRegistration}>
        <input
          type="hidden"
          name="registration_id"
          value={registration.id}
        />

        <input
          type="hidden"
          name="club_id"
          value={typedClub.id}
        />

        <button
          type="submit"
          className="inline-flex items-center rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
        >
          Deactivate
        </button>
      </form>
    ) : (
      <form action={restoreClubSessionRegistration}>
        <input
          type="hidden"
          name="registration_id"
          value={registration.id}
        />

        <input
          type="hidden"
          name="club_id"
          value={typedClub.id}
        />

        <button
          type="submit"
          className="inline-flex items-center rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          Restore
        </button>
      </form>
    )}
  </div>
</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Metadata */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Record Information
        </h2>

        <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <InfoItem
            label="Created"
            value={formatDate(typedClub.created_at)}
          />

          <InfoItem
            label="Last Updated"
            value={formatDate(typedClub.updated_at)}
          />
        </div>
      </section>
    </main>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm text-slate-900">
        {value || "—"}
      </p>
    </div>
  );
}