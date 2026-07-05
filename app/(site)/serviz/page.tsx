import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/data/services";
import { ServicePageTemplate } from "@/components/service/ServicePageTemplate";

const service = getServiceBySlug("serviz");

export const metadata: Metadata = {
  title: "Сервиз",
  description:
    "Оторизирано обслужване за луксозни марки с оригинални части и заводска диагностика. Механика, електроника, тенекеджия и боя.",
};

export default function Page() {
  if (!service) notFound();
  return <ServicePageTemplate service={service} />;
}
