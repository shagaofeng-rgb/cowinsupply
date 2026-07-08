import AdminShell from "@/components/admin/AdminShell";
import { requireAdminSession } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }) {
  const session = await requireAdminSession();
  return <AdminShell email={session.email}>{children}</AdminShell>;
}
