import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = {
  title: "Общи условия",
  description: "Общи условия за ползване на услугите на AutoHaus.",
};

export default function Page() {
  return (
    <PlaceholderPage
      title="Общи условия"
      note="Общите условия за ползване на сайта и услугите ще бъдат публикувани тук."
    />
  );
}
