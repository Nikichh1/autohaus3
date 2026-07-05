"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ImagePlus,
  Loader2,
  Search,
  Copy,
  Trash2,
  Check,
  X,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/admin/ui/button";
import { Field, Input } from "@/components/admin/ui/input";
import { TagInput } from "@/components/admin/vehicles/TagInput";
import { toast } from "@/components/admin/ui/toast";
import { confirmDialog } from "@/components/admin/ui/confirm";
import { updateMediaAsset, deleteMediaAsset } from "@/lib/admin/media-actions";

export type MediaItem = {
  id: string;
  url: string;
  originalName: string;
  folder: string;
  tags: string[];
  alt: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number;
};

function fmtSize(b: number) {
  return b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;
}

export function MediaLibrary({
  items,
  folders,
  currentFolder,
  q,
}: {
  items: MediaItem[];
  folders: string[];
  currentFolder: string;
  q: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFolder, setUploadFolder] = useState(currentFolder || "general");
  const [selected, setSelected] = useState<MediaItem | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("folder", uploadFolder || "general");
      Array.from(files).forEach((f) => fd.append("files", f));
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) toast(data.error ?? "Грешка при качване.", "error");
      else {
        toast(`${data.assets.length} файла качени`);
        router.refresh();
      }
    } catch {
      toast("Грешка при качване.", "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function folderHref(f: string) {
    const params = new URLSearchParams();
    if (f) params.set("folder", f);
    if (q) params.set("q", q);
    const qs = params.toString();
    return `${pathname}${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      {/* Upload */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-base/40 px-6 py-5 text-sm text-fg-muted transition-colors hover:border-accent hover:bg-white/[0.02]"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5 text-fg-subtle" />}
          {uploading ? "Качване…" : "Пуснете изображения тук или кликнете"}
        </label>
        <div className="flex items-center gap-2">
          <FolderOpen className="size-4 text-fg-subtle" />
          <Input
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.target.value)}
            placeholder="папка"
            className="w-40"
            aria-label="Папка за качване"
          />
        </div>
      </div>

      {/* Folder tabs + search */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FolderTab href={folderHref("")} active={!currentFolder}>
          Всички
        </FolderTab>
        {folders.map((f) => (
          <FolderTab key={f} href={folderHref(f)} active={currentFolder === f}>
            {f}
          </FolderTab>
        ))}
        <form action={pathname} className="relative ml-auto min-w-[200px]">
          {currentFolder ? <input type="hidden" name="folder" value={currentFolder} /> : null}
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Търси по име, alt, таг…"
            className="h-9 w-full rounded-lg border border-line-strong bg-surface/60 pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle outline-none focus:border-accent"
          />
        </form>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center">
          <ImagePlus className="mx-auto size-9 text-fg-subtle" />
          <p className="mt-3 text-sm font-medium text-fg">Няма файлове</p>
          <p className="mt-1 text-sm text-fg-muted">Качете първите изображения по-горе.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <MediaTile key={item.id} item={item} onOpen={() => setSelected(item)} />
          ))}
        </div>
      )}

      {selected && (
        <MediaEditor
          item={selected}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function FolderTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm capitalize transition-colors",
        active ? "bg-white/8 font-medium text-fg" : "text-fg-muted hover:bg-white/5 hover:text-fg",
      )}
    >
      {children}
    </Link>
  );
}

function MediaTile({ item, onOpen }: { item: MediaItem; onOpen: () => void }) {
  const [copied, setCopied] = useState(false);
  function copy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard?.writeText(window.location.origin + item.url);
    setCopied(true);
    toast("URL копиран");
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={onOpen}
      className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-elevated text-left"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt={item.alt ?? ""} className="h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/70 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex justify-end">
          <span
            onClick={copy}
            className="flex size-7 items-center justify-center rounded-md bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/80"
            aria-label="Копирай URL"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          </span>
        </div>
        <p className="truncate text-[11px] text-white">{item.originalName}</p>
      </div>
    </button>
  );
}

function MediaEditor({
  item,
  onClose,
  onChanged,
}: {
  item: MediaItem;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [alt, setAlt] = useState(item.alt ?? "");
  const [folder, setFolder] = useState(item.folder);
  const [tags, setTags] = useState<string[]>(item.tags);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  function save() {
    startSave(async () => {
      const res = await updateMediaAsset(item.id, { alt, folder, tags });
      if (res.ok) {
        toast("Запазено");
        onChanged();
      } else toast(res.error, "error");
    });
  }

  async function remove() {
    const ok = await confirmDialog({ title: "Изтриване на файла?", danger: true, confirmLabel: "Изтрий" });
    if (!ok) return;
    startDelete(async () => {
      const res = await deleteMediaAsset(item.id);
      if (res.ok) {
        toast("Изтрито");
        onChanged();
      } else toast(res.error, "error");
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />
      <div className="relative grid w-full max-w-3xl gap-0 overflow-hidden rounded-2xl border border-line-strong bg-elevated shadow-cinema md:grid-cols-2">
        <div className="relative aspect-square bg-base md:aspect-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.url} alt={item.alt ?? ""} className="h-full w-full object-contain" />
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-fg">{item.originalName}</p>
              <p className="text-xs text-fg-subtle">
                {item.width && item.height ? `${item.width}×${item.height} · ` : ""}
                {fmtSize(item.sizeBytes)}
              </p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-fg-muted hover:bg-white/5">
              <X className="size-5" />
            </button>
          </div>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.origin + item.url);
              toast("URL копиран");
            }}
            className="flex items-center justify-between gap-2 rounded-lg border border-line-strong bg-base/40 px-3 py-2 text-left text-xs text-fg-muted transition-colors hover:border-accent"
          >
            <span className="truncate">{item.url}</span>
            <Copy className="size-3.5 shrink-0" />
          </button>

          <Field label="Alt текст">
            <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Описание за достъпност" />
          </Field>
          <Field label="Папка">
            <Input value={folder} onChange={(e) => setFolder(e.target.value)} />
          </Field>
          <div>
            <p className="mb-1.5 text-xs font-medium text-fg-muted">Тагове</p>
            <TagInput value={tags} onChange={setTags} placeholder="Добави таг…" />
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <Button variant="danger" icon={<Trash2 className="size-4" />} onClick={remove} loading={deleting}>
              Изтрий
            </Button>
            <Button variant="primary" onClick={save} loading={saving}>
              Запази
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
