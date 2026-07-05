import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/data/services";
import { ServicePageTemplate } from "@/components/service/ServicePageTemplate";

const service = getServiceBySlug("kafe-bar");

export const metadata: Metadata = {
  title: "Кафе бар",
  description:
    "Пространство за гости и партньори. Спокойна атмосфера за разговор и оглед — премиум кафе, леки ястия и изглед към шоурума.",
};

export default function Page() {
  if (!service) notFound();
  return <ServicePageTemplate service={service} />;
}
