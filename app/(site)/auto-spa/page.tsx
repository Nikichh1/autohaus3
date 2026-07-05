import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/data/services";
import { ServicePageTemplate } from "@/components/service/ServicePageTemplate";

const service = getServiceBySlug("auto-spa");

export const metadata: Metadata = {
  title: "Auto Spa",
  description:
    "Детайлинг от най-високо ниво — корекция на боя, керамични покрития до 9H, защитни филми и дълбоко почистване на интериор.",
};

export default function Page() {
  if (!service) notFound();
  return <ServicePageTemplate service={service} />;
}
