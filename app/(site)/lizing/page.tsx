import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/data/services";
import { ServicePageTemplate } from "@/components/service/ServicePageTemplate";

const service = getServiceBySlug("lizing");

export const metadata: Metadata = {
  title: "Лизинг",
  description:
    "Финансов и оперативен лизинг при индивидуални условия. Гъвкави срокове, минимална първоначална вноска, корпоративни схеми.",
};

export default function Page() {
  if (!service) notFound();
  return <ServicePageTemplate service={service} />;
}
