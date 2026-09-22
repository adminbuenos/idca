import Link from "next/link";

import { requireAdmin } from "@/lib/auth/authorization";

const IDCA_DIVISION_ID =
  "89304127-99c2-4427-8edd-87a9aff3e167";

type Session = {
  id: string;
  division_id: string;
  name: string;
  start_year: number;
  end_year: number;
  is_current: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function statusClasses(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";

    case "INACTIVE":
      return "bg-amber-100 text-amber-700";

    case "ARCHIVED":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("sessions")
    .select(`
      id,
      division_id,
      name,
      start_year,
      end_year,
      is_current,
      status,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .eq("division_id", IDCA_DIVISION_ID)
    .maybeSingle();

  if (error) {
    console.error("Failed to load session:", error);

    throw new Error(
      `Failed to load session: ${error.message}`
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#f8fafc]">
        <section className="mx-auto max-w-4xl px-6 py-16">
          <Link
            href="/admin/sessions"
            className="text-sm font-semibold text-[#ef6c00] hover:text-[#071b2a]"
          >
            ← Back to Sessions
          </Link>

          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-black text-[#071b2a]">
              Session Not Found
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              The requested session does not exist or does not belong
              to IDCA.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const session = data as Session;

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Link
            href="/admin/sessions"
            className="text-sm font-semibold text-[#ef6c00] hover:text-[#071b2a]"
          >
            ← Back to Sessions
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-[#071b2a]">
                  {session.name}
                </h1>

                {session.is_current && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-green-700">
                    Current Session
                  </span>
                )}

                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${statusClasses(
                    session.status
                  )}`}
                >
                  {session.status}
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                IDCA cricket session workspace
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
              Session
            </p>

            <p className="mt-2 text-2xl font-black text-[#071b2a]">
              {session.name}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {session.start_year}–{session.end_year}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
              Status
            </p>

            <p className="mt-2 text-2xl font-black text-[#071b2a]">
              {session.status}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {session.is_current
                ? "This is the current IDCA session."
                : "This is not the current IDCA session."}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
              Created
            </p>

            <p className="mt-2 text-2xl font-black text-[#071b2a]">
              {formatDate(session.created_at)}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Last updated {formatDate(session.updated_at)}
            </p>
          </div>
        </div>

        {/* Session workspace */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-black text-[#071b2a]">
              Session Workspace
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage clubs, tournaments and other activities for this
              cricket session.
            </p>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            <WorkspaceCard
              title="Club Registrations"
              description="Register IDCA clubs for this session and assign their club category."
            />

            <WorkspaceCard
              title="Tournaments"
              description="View tournaments created for this session."
            />

            <WorkspaceCard
              title="Players"
              description="Session player registrations and eligibility will be managed here."
            />
          </div>
        </div>

        {/* Session information */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-black text-[#071b2a]">
              Session Information
            </h2>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              label="Session Name"
              value={session.name}
            />

            <InfoItem
              label="Start Year"
              value={String(session.start_year)}
            />

            <InfoItem
              label="End Year"
              value={String(session.end_year)}
            />

            <InfoItem
              label="Current"
              value={session.is_current ? "Yes" : "No"}
            />

            <InfoItem
              label="Status"
              value={session.status}
            />

            <InfoItem
              label="Created"
              value={formatDate(session.created_at)}
            />

            <InfoItem
              label="Last Updated"
              value={formatDate(session.updated_at)}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function WorkspaceCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
      <h3 className="font-bold text-[#071b2a]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {description}
      </p>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
        {label}
      </p>

      <p className="mt-1 font-semibold text-[#071b2a]">
        {value}
      </p>
    </div>
  );
}