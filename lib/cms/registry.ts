// Registry of editable site content. Each field has a stable key, a default that
// mirrors the current hardcoded copy, and a group for the admin UI. Public
// components read overrides via lib/cms/read.ts and fall back to these defaults.

export type FieldType = "text" | "textarea";

export type ContentField = {
  key: string;
  group: ContentGroupId;
  label: string;
  type: FieldType;
  default: string;
  help?: string;
};

export type ContentGroupId = "home" | "home_seo" | "contact";

export const CONTENT_GROUPS: { id: ContentGroupId; label: string; description?: string }[] = [
  { id: "home", label: "Начало — Hero", description: "Първият екран на сайта." },
  { id: "home_seo", label: "Начало — SEO", description: "Meta заглавие и описание." },
  { id: "contact", label: "Контакти", description: "Заглавна част на страница „Контакти“." },
];

export const CONTENT_FIELDS: ContentField[] = [
  {
    key: "home.hero.eyebrow",
    group: "home",
    label: "Етикет над заглавието",
    type: "text",
    default: "Пловдив · Дом за премиум автомобили",
  },
  {
    key: "home.hero.headline",
    group: "home",
    label: "Заглавие",
    type: "textarea",
    default: "Колата, която\nви заслужава.",
    help: "Нов ред = втора линия от заглавието.",
  },
  {
    key: "home.hero.subcopy",
    group: "home",
    label: "Подзаглавие",
    type: "textarea",
    default:
      "Не просто автомобил, а начало. Всяка кола в нашата колекция е подбрана и проверена — за да я карате с увереност, не с надежда.",
  },
  {
    key: "home.hero.ctaPrimary",
    group: "home",
    label: "Основен бутон",
    type: "text",
    default: "Разгледай колекцията",
  },
  {
    key: "home.hero.ctaSecondary",
    group: "home",
    label: "Втори бутон",
    type: "text",
    default: "Запазете оглед",
  },
  {
    key: "home.seo.title",
    group: "home_seo",
    label: "SEO заглавие",
    type: "text",
    default: "AutoHaus — Премиум автомобили",
  },
  {
    key: "home.seo.description",
    group: "home_seo",
    label: "SEO описание",
    type: "textarea",
    default:
      "Премиум автосалон в Пловдив. Продажба, лизинг, застраховки и сервиз на луксозни автомобили.",
  },
  {
    key: "contact.heading",
    group: "contact",
    label: "Заглавие",
    type: "text",
    default: "Заповядайте при нас.",
  },
  {
    key: "contact.subcopy",
    group: "contact",
    label: "Подзаглавие",
    type: "textarea",
    default:
      "Посетете шоурума в Пловдив или ни пишете — отговаряме лично и без ангажимент.",
  },
];

export const CONTENT_FIELD_MAP: Record<string, ContentField> = Object.fromEntries(
  CONTENT_FIELDS.map((f) => [f.key, f]),
);

/** Which public routes to revalidate when a group changes. */
export const GROUP_ROUTES: Record<ContentGroupId, string[]> = {
  home: ["/"],
  home_seo: ["/"],
  contact: ["/kontakti"],
};
