import type { Metadata } from "next";
import { Lock, Database, Download } from "lucide-react";
import { requireUser } from "@/lib/admin/session";
import { hasPermission } from "@/lib/admin/rbac";
import { getSettings } from "@/lib/settings/read";
import { PageHeader, Card } from "@/components/admin/ui/card";
import { SettingsForms } from "@/components/admin/settings/SettingsForms";

export const metadata: Metadata = { title: "Настройки" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  if (!hasPermission(user.role, "settings.manage")) {
    return (
      <div>
        <PageHeader title="Настройки" />
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Lock className="size-8 text-fg-subtle" />
          <p className="text-sm text-fg-muted">Нямате достъп до настройките.</p>
        </Card>
      </div>
    );
  }

  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Настройки"
        description="Управлявайте контактите, работното време, брандинга и условията за лизинг на сайта."
      />
      <SettingsForms initial={settings} />

      {hasPermission(user.role, "backup.manage") && (
        <Card className="mt-6 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-elevated text-fg-muted ring-1 ring-line">
                <Database className="size-5" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-fg">Архив на данните</h2>
                <p className="mt-1 max-w-md text-xs text-fg-muted">
                  Свалете моментна снимка на цялата база данни (автомобили, запитвания,
                  съдържание, настройки). Съхранявайте я на сигурно място.
                </p>
              </div>
            </div>
            <a
              href="/api/admin/backup"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-fg px-4 text-sm font-medium text-ink transition-colors hover:bg-accent-warm"
            >
              <Download className="size-4" />
              Свали архив
            </a>
          </div>
        </Card>
      )}
    </div>
  );
}
