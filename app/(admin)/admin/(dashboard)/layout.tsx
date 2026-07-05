import type { Metadata } from "next";
import { requireUser } from "@/lib/admin/session";
import { permissionsFor } from "@/lib/admin/rbac";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { ThemeScript } from "@/components/admin/layout/ThemeControls";

export const metadata: Metadata = {
  title: { default: "Администрация", template: "%s · AutoHaus Admin" },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const permissions = permissionsFor(user.role);

  return (
    <>
      <ThemeScript />
      <AdminShell user={user} permissions={permissions}>
        {children}
      </AdminShell>
    </>
  );
}
