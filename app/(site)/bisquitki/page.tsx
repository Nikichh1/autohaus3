import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = {
  title: "Политика за бисквитки",
  description: "Как AutoHaus използва бисквитки на този сайт.",
};

export default function Page() {
  return (
    <PlaceholderPage
      title="Политика за бисквитки"
      note="Информация за бисквитките, които използваме, и как да управлявате предпочитанията си — скоро тук."
    />
  );
}
