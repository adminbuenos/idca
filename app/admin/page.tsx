import { requireAdmin } from "@/lib/auth/authorization";
import LogoutButton from "@/components/auth/logout-button";
import Link from "next/link";
export default async function AdminPage() {
  const { user } = await requireAdmin();

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              IDCA Administration
            </h1>

            <p className="text-sm text-gray-500">
              Indore Division Cricket Association
            </p>
          </div>

          <div className="flex items-center gap-4">
  <div className="text-right">
    <p className="text-sm font-medium text-gray-900">
      {user.email}
    </p>

    <p className="text-xs text-gray-500">
      Administrator
    </p>
  </div>

  <LogoutButton />
</div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h2>

        <p className="mt-2 text-gray-600">
          Welcome to the IDCA administration portal.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
         <Link href="/admin/employees">
          <DashboardCard
            title="Employees"
            description="Manage employees and access."
          />
</Link>
          <DashboardCard
            title="Clubs"
            description="Manage registered cricket clubs."
          />

          <DashboardCard
            title="Tournaments"
            description="Manage tournaments, fixtures and results."
          />
<Link
  href="/admin/notices"
  className="block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
>
          <DashboardCard
            title="Notices"
            description="Publish and manage official notices."
          />
</Link>
          <DashboardCard
            title="Documents"
            description="Manage IDCA documents and files."
          />

          <DashboardCard
            title="Audit Logs"
            description="Track administrative activity."
          />
        </div>
      </section>
    </main>
  );
}

function DashboardCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900">{title}</h3>

      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}