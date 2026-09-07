import { requireAdmin } from "@/lib/auth/authorization";
import Footer from "@/components/layout/footer";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>

      <Footer />
    </div>
  );
}