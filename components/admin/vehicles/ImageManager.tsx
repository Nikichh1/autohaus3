"use client";

import { useRef, useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ImagePlus, Loader2, Star, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/admin/ui/toast";
import { confirmDialog } from "@/components/admin/ui/confirm";
import {
  reorderImages,
  deleteVehicleImage,
  setPrimaryImage,
} from "@/lib/admin/vehicle-actions";

export type EditorImage = { id: string; url: string; isPrimary: boolean };

export function ImageManager({
  vehicleId,
  initial,
  canEdit,
}: {
  vehicleId: string;
  initial: EditorImage[];
  canEdit: boolean;
}) {
  const [items, setItems] = useState<EditorImage[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("vehicleId", vehicleId);
      Array.from(files).forEach((f) => fd.append("files", f));
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Грешка при качване.", "error");
      } else {
        const created: EditorImage[] = data.images.map((i: { id: string; url: string; isPrimary: boolean }) => ({
          id: i.id,
          url: i.url,
          isPrimary: i.isPrimary,
        }));
        setItems((prev) => [...prev, ...created]);
        toast(`${created.length} ${created.length === 1 ? "снимка качена" : "снимки качени"}`);
      }
    } catch {
      toast("Грешка при качване.", "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    startTransition(async () => {
      const res = await reorderImages(vehicleId, next.map((i) => i.id));
      if (!res.ok) toast(res.error, "error");
    });
  }

  function onSetPrimary(id: string) {
    setItems((prev) => prev.map((i) => ({ ...i, isPrimary: i.id === id })));
    startTransition(async () => {
      const res = await setPrimaryImage(id);
      if (!res.ok) toast(res.error, "error");
      else toast("Зададена основна снимка");
    });
  }

  async function onDelete(id: string) {
    const ok = await confirmDialog({
      title: "Изтриване на снимката?",
      danger: true,
      confirmLabel: "Изтрий",
    });
    if (!ok) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => {
      const res = await deleteVehicleImage(id);
      if (!res.ok) toast(res.error, "error");
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-fg-subtle">
          {items.length} {items.length === 1 ? "снимка" : "снимки"} · плъзнете за подреждане
        </p>
      </div>

      {canEdit ? (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          className="mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-base/40 px-6 py-8 text-center transition-colors hover:border-accent hover:bg-white/[0.02]"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? (
            <Loader2 className="size-6 animate-spin text-fg-muted" />
          ) : (
            <ImagePlus className="size-6 text-fg-subtle" />
          )}
          <span className="text-sm text-fg-muted">
            {uploading ? "Качване…" : "Пуснете снимки тук или кликнете за избор"}
          </span>
          <span className="text-xs text-fg-subtle">JPG, PNG, WebP · до 20MB · неограничен брой</span>
        </label>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-xl border border-line bg-base/40 px-6 py-10 text-center text-sm text-fg-subtle">
          Все още няма снимки.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((img, idx) => (
                <SortableTile
                  key={img.id}
                  img={img}
                  index={idx}
                  canEdit={canEdit}
                  onSetPrimary={() => onSetPrimary(img.id)}
                  onDelete={() => onDelete(img.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableTile({
  img,
  index,
  canEdit,
  onSetPrimary,
  onDelete,
}: {
  img: EditorImage;
  index: number;
  canEdit: boolean;
  onSetPrimary: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: img.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative aspect-[4/3] overflow-hidden rounded-lg border bg-elevated",
        img.isPrimary ? "border-accent ring-1 ring-accent/40" : "border-line",
        isDragging && "z-10 opacity-80 shadow-cinema"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.url} alt="" className="h-full w-full object-cover" draggable={false} />

      {img.isPrimary ? (
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-base/80 px-1.5 py-0.5 text-[10px] font-medium text-accent backdrop-blur">
          <Star className="size-3 fill-accent" /> Основна
        </span>
      ) : (
        <span className="absolute left-2 top-2 rounded bg-base/70 px-1.5 py-0.5 text-[10px] text-fg-subtle backdrop-blur">
          {index + 1}
        </span>
      )}

      {canEdit ? (
        <>
          <button
            {...attributes}
            {...listeners}
            className="absolute right-2 top-2 flex size-7 cursor-grab items-center justify-center rounded-md bg-base/70 text-fg-muted opacity-0 backdrop-blur transition-opacity hover:text-fg group-hover:opacity-100 active:cursor-grabbing"
            aria-label="Премести"
          >
            <GripVertical className="size-4" />
          </button>

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-base/90 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
            {!img.isPrimary ? (
              <button
                onClick={onSetPrimary}
                className="rounded-md bg-white/10 px-2 py-1 text-[11px] text-fg backdrop-blur transition-colors hover:bg-white/20"
              >
                Основна
              </button>
            ) : (
              <span />
            )}
            <button
              onClick={onDelete}
              className="flex size-7 items-center justify-center rounded-md bg-red-500/20 text-red-300 backdrop-blur transition-colors hover:bg-red-500/35"
              aria-label="Изтрий"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
