import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = {
  title: "Новини",
  description: "Новини и събития от AutoHaus.",
};

export default function Page() {
  return (
    <PlaceholderPage
      title="Новини"
      note="Новини, събития и нови попълнения в нашата колекция — съвсем скоро на това място."
    />
  );
}
