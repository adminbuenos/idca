import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/authorization";
import {
  updateClub,
  uploadClubLogo,
} from "@/lib/clubs/actions";

const IDCA_DIVISION_ID =
  "89304127-99c2-4427-8edd-87a9aff3e167";

type Club = {
  id: string;
  name: string;
  short_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  established_year: number | null;
  status: "ACTIVE" | "INACTIVE";
  logo_path: string | null;
};

export default async function EditClubPage({
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
      name,
      short_name,
      address,
      city,
      state,
      phone,
      email,
      website_url,
      established_year,
      status,
      logo_path
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

  let logoUrl: string | null = null;

if (typedClub.logo_path) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not configured."
    );
  }

  logoUrl =
    `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/club-logos/${typedClub.logo_path}`;
}

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
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

          <span>Edit</span>
        </div>

    <h1 className="text-3xl font-bold text-slate-900">
  Edit Club
</h1>

        <p className="mt-1 text-sm text-slate-500">
          Update the club&apos;s permanent information.
        </p>
      </div>

      {/* Club Logo */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Club Logo
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Upload the official club logo. This logo will also be
            available on the public IDCA website.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center">
          {/* Current logo */}
          <div className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${typedClub.name} logo`}
                className="h-full w-full object-contain p-3"
              />
            ) : (
              <div className="text-center">
                <div className="text-4xl text-slate-300">
                  🏏
                </div>

                <p className="mt-2 text-xs font-medium text-slate-400">
                  No logo
                </p>
              </div>
            )}
          </div>

          {/* Upload form */}
          <div className="flex-1">
            <form
  action={uploadClubLogo}
  className="space-y-4"
>
              <input
                type="hidden"
                name="clubId"
                value={typedClub.id}
              />

              <div>
                <label
                  htmlFor="logo"
                  className="block text-sm font-medium text-slate-700"
                >
                  {logoUrl
                    ? "Replace Club Logo"
                    : "Upload Club Logo"}
                </label>

                <input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-700 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                />

                <p className="mt-2 text-xs text-slate-500">
                  JPG, PNG or WebP. Maximum file size: 5 MB.
                </p>
              </div>

              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                {logoUrl
                  ? "Replace Logo"
                  : "Upload Logo"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Club Information */}
      <form
        action={updateClub}
        className="space-y-6"
      >
        <input
          type="hidden"
          name="clubId"
          value={typedClub.id}
        />

        {/* Basic Information */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Basic Information
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700"
              >
                Club Name *
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                maxLength={150}
                defaultValue={typedClub.name}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              />
            </div>

            <div>
              <label
                htmlFor="shortName"
                className="block text-sm font-medium text-slate-700"
              >
                Short Name
              </label>

              <input
                id="shortName"
                name="shortName"
                type="text"
                maxLength={50}
                defaultValue={typedClub.short_name ?? ""}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              />
            </div>

            <div>
              <label
                htmlFor="establishedYear"
                className="block text-sm font-medium text-slate-700"
              >
                Established Year
              </label>

              <input
                id="establishedYear"
                name="establishedYear"
                type="number"
                min={1800}
                max={2100}
                defaultValue={
                  typedClub.established_year ?? ""
                }
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Contact Information
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-700"
              >
                Phone
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                maxLength={30}
                defaultValue={typedClub.phone ?? ""}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                maxLength={150}
                defaultValue={typedClub.email ?? ""}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="websiteUrl"
                className="block text-sm font-medium text-slate-700"
              >
                Website
              </label>

              <input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                maxLength={300}
                placeholder="https://example.com"
                defaultValue={typedClub.website_url ?? ""}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </div>
        </section>

        {/* Address */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Address
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor="address"
                className="block text-sm font-medium text-slate-700"
              >
                Address
              </label>

              <textarea
                id="address"
                name="address"
                rows={3}
                maxLength={500}
                defaultValue={typedClub.address ?? ""}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              />
            </div>

            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-slate-700"
              >
                City
              </label>

              <input
                id="city"
                name="city"
                type="text"
                maxLength={100}
                defaultValue={typedClub.city ?? ""}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              />
            </div>

            <div>
              <label
                htmlFor="state"
                className="block text-sm font-medium text-slate-700"
              >
                State
              </label>

              <input
                id="state"
                name="state"
                type="text"
                maxLength={100}
                defaultValue={typedClub.state ?? ""}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </div>
        </section>

        {/* Status */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Status
          </h2>

          <div className="mt-5">
            <label
              htmlFor="status"
              className="block text-sm font-medium text-slate-700"
            >
              Club Status
            </label>

            <select
              id="status"
              name="status"
              defaultValue={typedClub.status}
              className="mt-1.5 w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
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
            Save Changes
          </button>
        </div>
      </form>
    </main>
  );
}