import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = {
  title: "Политика за поверителност",
  description: "Политика за поверителност и защита на личните данни на AutoHaus.",
};

export default function Page() {
  return (
    <PlaceholderPage
      title="Политика за поверителност"
      note="Пълният текст на политиката за защита на личните данни предстои да бъде публикуван тук."
    />
  );
}
