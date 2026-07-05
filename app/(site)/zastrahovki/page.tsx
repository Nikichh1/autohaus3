import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/data/services";
import { ServicePageTemplate } from "@/components/service/ServicePageTemplate";

const service = getServiceBySlug("zastrahovki");

export const metadata: Metadata = {
  title: "Застраховки",
  description:
    "Каско, гражданска отговорност и специализирани полици за премиум автомобили. Оптимални условия чрез водещи застрахователи.",
};

export default function Page() {
  if (!service) notFound();
  return <ServicePageTemplate service={service} />;
}
