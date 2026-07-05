import type { Metadata } from "next";
import { IntroFilm } from "@/components/home/IntroFilm";
import { HeroStage } from "@/components/home/HeroStage";
import { ManifestoDrive } from "@/components/home/ManifestoDrive";
import { CollectionGallery } from "@/components/home/CollectionGallery";
import { MachineScene } from "@/components/home/MachineScene";
import { ConciergeScene } from "@/components/home/ConciergeScene";
import { StandardScene } from "@/components/home/StandardScene";
import { HouseScene } from "@/components/home/HouseScene";
import { FinaleScene } from "@/components/home/FinaleScene";
import { MobileStickyCTA } from "@/components/home/MobileStickyCTA";
import { ChapterRail } from "@/components/fx/ChapterRail";
import { EngineRumble } from "@/components/fx/EngineRumble";
import { getFeaturedVehicles, getAllPublicVehicles } from "@/lib/data/vehicles";
import { getContent } from "@/lib/cms/read";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getContent();
  return {
    title: { absolute: cms["home.seo.title"] },
    description: cms["home.seo.description"],
  };
}

/**
 * The homepage is one continuous film: a scroll-driven opening sequence, then
 * eight chapters, each sliding over the last as a sheet of film stock:
 *
 *   00 Филмът     — the scroll-scrubbed entry into the dealership, story
 *                   beats staged in the depth of the footage
 *   01 Начало     — the stage (showroom at golden hour)
 *   02 Философия  — the manifesto while a wireframe GT draws itself
 *   03 Колекция   — a horizontal drive through the featured machines
 *   04 Машината   — the scroll-scrubbed car film
 *   05 Издирване  — the hunt: diagonal cut, console, network marquee
 *   06 Стандартът — the engineering certificate with the live gauge
 *   07 Домът      — sticky-frame storytelling through the physical house
 *   08 Покана     — end credits and the conversion close
 *
 * A fixed chapter rail (desktop) and a sticky CTA (mobile) frame the film.
 */
export default async function HomePage() {
  const cms = await getContent();
  const all = await getAllPublicVehicles();
  const featuredOnly = await getFeaturedVehicles();
  // Fall back to the newest inventory if nothing is explicitly featured yet.
  const featured = (featuredOnly.length ? featuredOnly : all).slice(0, 6);

  return (
    <div className="bg-base">
      <ChapterRail />
      <IntroFilm />
      <HeroStage
        content={{
          eyebrow: cms["home.hero.eyebrow"],
          headline: cms["home.hero.headline"],
          subcopy: cms["home.hero.subcopy"],
          ctaPrimary: cms["home.hero.ctaPrimary"],
          ctaSecondary: cms["home.hero.ctaSecondary"],
        }}
      />
      <ManifestoDrive />
      <CollectionGallery vehicles={featured} total={all.length} />
      <MachineScene />
      <ConciergeScene />
      <StandardScene />
      <HouseScene />
      <FinaleScene />
      <MobileStickyCTA />
      <EngineRumble />
    </div>
  );
}
