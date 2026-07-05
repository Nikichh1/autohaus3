import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = {
  title: "За нас",
  description: "Историята и екипът зад AutoHaus.",
};

export default function Page() {
  return (
    <PlaceholderPage
      title="За нас"
      note="Скоро тук ще разкажем историята на AutoHaus, екипа и философията, с която работим. Междувременно сме на разположение лично."
    />
  );
}
