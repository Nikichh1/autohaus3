import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { requireUser } from "@/lib/admin/session";
import { hasPermission } from "@/lib/admin/rbac";
import { getContent } from "@/lib/cms/read";
import { PageHeader, Card } from "@/components/admin/ui/card";
import { ContentForms } from "@/components/admin/cms/ContentForms";

export const metadata: Metadata = { title: "Съдържание" };
export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const user = await requireUser();

  if (!hasPermission(user.role, "cms.view") && !hasPermission(user.role, "cms.update")) {
    return (
      <div>
        <PageHeader title="Съдържание" />
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Lock className="size-8 text-fg-subtle" />
          <p className="text-sm text-fg-muted">Нямате достъп до съдържанието.</p>
        </Card>
      </div>
    );
  }

  const content = await getContent();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Съдържание"
        description="Редактирайте текстовете на сайта без код. Промените се отразяват веднага."
      />
      <ContentForms initial={content} />
    </div>
  );
}
