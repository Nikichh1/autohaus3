import type { Metadata } from "next";
import { IntroFilm } from "@/components/home/IntroFilm";
import { ManifestoDrive } from "@/components/home/ManifestoDrive";
import { CollectionGallery } from "@/components/home/CollectionGallery";
import { MachineScene } from "@/components/home/MachineScene";
import { ConciergeScene } from "@/components/home/ConciergeScene";
import { StandardScene } from "@/components/home/StandardScene";
import { HouseScene } from "@/components/home/HouseScene";
import { FinaleScene } from "@/components/home/FinaleScene";
import { MobileStickyCTA } from "@/components/home/MobileStickyCTA";
import { ChapterRail } from "@/components/fx/ChapterRail";
import { ScrollThemeMorph, ThemeMorphBoundary } from "@/components/fx/ScrollThemeMorph";
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
 * The homepage is one continuous film: the scroll-driven opening sequence
 * lands directly on the product, then the chapters follow as film sheets:
 *
 *   00 Филмът     — the scroll-scrubbed entry: brand, story beat, live proof
 *                   counters and the welcome card, staged in the footage
 *   01 Колекция   — the featured machines, immediately after the film
 *   02 Философия  — the manifesto over the wind-tunnel streamlines
 *   03 Машината   — the scroll-scrubbed car film with the telemetry rail
 *   04 Издирване  — the hunt: diagonal cut, console, network marquee
 *   05 Стандартът — the engineering certificate with the live gauge
 *   06 Домът      — sticky-frame storytelling through the physical house
 *   07 Покана     — end credits and the conversion close
 *
 * A fixed chapter rail (desktop) and a sticky CTA (mobile) frame the film.
 */
export default async function HomePage() {
  const [all, featuredOnly, cms] = await Promise.all([
    getAllPublicVehicles(),
    getFeaturedVehicles(),
    getContent(),
  ]);
  // Fall back to the newest inventory if nothing is explicitly featured yet.
  const featured = (featuredOnly.length ? featuredOnly : all).slice(0, 6);

  return (
    <div className="bg-base">
      <ChapterRail />
      <IntroFilm
        copy={{
          eyebrow: cms["home.intro.eyebrow"],
          line1: cms["home.intro.line1"],
          line2: cms["home.intro.line2"],
          scrollHint: cms["home.intro.scrollHint"],
        }}
      />
      {/* The scroll-scrubbed light→dark handoff: the Collection reads as the
          light "hero", and as its tail scrolls into the Manifesto the entire
          theme — background, text, icons, borders, cards — morphs to black as
          one continuous, reversible motion. The boundary marker sits at the
          seam and defines where light has fully become dark. */}
      <ScrollThemeMorph>
        <CollectionGallery
          vehicles={featured}
          total={all.length}
          copy={{
            eyebrow: cms["home.collection.eyebrow"],
            heading: cms["home.collection.heading"],
            subcopy: cms["home.collection.subcopy"],
          }}
        />
        <ThemeMorphBoundary />
        <ManifestoDrive statement={cms["home.manifesto.statement"]} />
      </ScrollThemeMorph>
      <MachineScene
        copy={{
          title: cms["home.machine.title"],
          subcopy: cms["home.machine.subcopy"],
        }}
      />
      <ConciergeScene
        copy={{
          eyebrow: cms["home.concierge.eyebrow"],
          headingLine1: cms["home.concierge.headingLine1"],
          headingLine2: cms["home.concierge.headingLine2"],
          subcopy: cms["home.concierge.subcopy"],
        }}
      />
      <StandardScene
        copy={{
          eyebrow: cms["home.standard.eyebrow"],
          headingLine1: cms["home.standard.headingLine1"],
          headingLine2: cms["home.standard.headingLine2"],
          subcopy: cms["home.standard.subcopy"],
        }}
      />
      <HouseScene
        copy={{
          eyebrow: cms["home.house.eyebrow"],
          headingLine1: cms["home.house.headingLine1"],
          headingLine2: cms["home.house.headingLine2"],
        }}
      />
      <FinaleScene
        copy={{
          headingLine1: cms["home.finale.headingLine1"],
          headingLine2: cms["home.finale.headingLine2"],
          subcopy: cms["home.finale.subcopy"],
        }}
      />
      <MobileStickyCTA />
    </div>
  );
}
