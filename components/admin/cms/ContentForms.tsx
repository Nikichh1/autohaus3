"use client";

import { useState, useTransition } from "react";
import { Save, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Field, Input, Textarea } from "@/components/admin/ui/input";
import { toast } from "@/components/admin/ui/toast";
import { updateContent } from "@/lib/cms/actions";
import {
  CONTENT_GROUPS,
  CONTENT_FIELDS,
  type ContentGroupId,
} from "@/lib/cms/registry";

const PREVIEW: Partial<Record<ContentGroupId, string>> = {
  home: "/",
  home_seo: "/",
  contact: "/kontakti/",
};

export function ContentForms({ initial }: { initial: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(initial);

  return (
    <div className="flex flex-col gap-6">
      {CONTENT_GROUPS.map((group) => (
        <GroupCard
          key={group.id}
          groupId={group.id}
          title={group.label}
          description={group.description}
          values={values}
          setValues={setValues}
        />
      ))}
    </div>
  );
}

function GroupCard({
  groupId,
  title,
  description,
  values,
  setValues,
}: {
  groupId: ContentGroupId;
  title: string;
  description?: string;
  values: Record<string, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const [saving, start] = useTransition();
  const fields = CONTENT_FIELDS.filter((f) => f.group === groupId);
  const preview = PREVIEW[groupId];

  function save() {
    const updates = fields.map((f) => ({ key: f.key, value: values[f.key] ?? "" }));
    start(async () => {
      const res = await updateContent(updates);
      if (res.ok) toast("Запазено");
      else toast(res.error, "error");
    });
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          {description ? <p className="mt-1 text-xs text-fg-muted">{description}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {preview ? (
            <Link
              href={preview}
              target="_blank"
              className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-fg-muted transition-colors hover:bg-white/5 hover:text-fg"
            >
              <ExternalLink className="size-3.5" /> Преглед
            </Link>
          ) : null}
          <Button variant="primary" size="sm" icon={<Save className="size-4" />} loading={saving} onClick={save}>
            Запази
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {fields.map((f) => (
          <Field key={f.key} label={f.label} hint={f.help}>
            {f.type === "textarea" ? (
              <Textarea
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                rows={3}
              />
            ) : (
              <Input
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            )}
          </Field>
        ))}
      </div>
    </Card>
  );
}
