import type { Collection } from "@/types";

export type CollectionMeta = {
  slug: Collection;
  label: string; // collection name, Bulgarian
  index: string; // ordinal marker
  kicker: string; // short Bulgarian descriptor
  tagline: string;
  description: string;
};

/**
 * Curated catalog collections — luxury sub-brands rather than generic body
 * classes. Order is intentional (hero → everyday).
 */
export const collections: CollectionMeta[] = [
  {
    slug: "performance",
    label: "Спортни",
    index: "01",
    kicker: "Спортни и суперавтомобили",
    tagline: "Създадени за пистата, опитомени за пътя.",
    description:
      "Високооборотни двигатели, безкомпромисна динамика и силует, роден от скоростта.",
  },
  {
    slug: "executive",
    label: "Луксозни",
    index: "02",
    kicker: "Луксозни флагмани",
    tagline: "Лукс, който пристига преди вас.",
    description:
      "Представителни седани, гран туризмо и флагмански SUV — присъствие без излишни думи.",
  },
  {
    slug: "signature",
    label: "Ежедневни",
    index: "03",
    kicker: "Премиум за всеки ден",
    tagline: "Ежедневен лукс, подбран с грижа.",
    description:
      "Практични премиум автомобили с характер — входната точка към света на AutoHaus.",
  },
];
