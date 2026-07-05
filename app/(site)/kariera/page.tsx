import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = {
  title: "Кариери",
  description: "Свободни позиции и кариера в AutoHaus.",
};

export default function Page() {
  return (
    <PlaceholderPage
      title="Кариери"
      note="Търсите ли среда сред хора, които живеят с автомобилите? Пишете ни — винаги се радваме на силни кандидати."
    />
  );
}
