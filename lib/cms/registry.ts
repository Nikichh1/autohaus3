// Registry of editable site content. Each field has a stable key, a default that
// mirrors the current hardcoded copy, and a group for the admin UI. Public
// components read overrides via lib/cms/read.ts and fall back to these defaults.
//
// The admin UI (components/admin/cms/ContentForms) renders every group and field
// from this registry automatically — add a field here and wire the matching
// component to read it, and a new editable input appears in the panel with no
// admin-side code change.

export type FieldType = "text" | "textarea";

export type ContentField = {
  key: string;
  group: ContentGroupId;
  label: string;
  type: FieldType;
  default: string;
  help?: string;
};

export type ContentGroupId =
  | "home_intro"
  | "home_collection"
  | "home_manifesto"
  | "home_machine"
  | "home_concierge"
  | "home_standard"
  | "home_house"
  | "home_finale"
  | "home_seo"
  | "contact";

export const CONTENT_GROUPS: { id: ContentGroupId; label: string; description?: string }[] = [
  { id: "home_intro", label: "Начало — Въведение", description: "Първият екран на телефон: етикет и водещото послание." },
  { id: "home_collection", label: "Начало — Колекция", description: "Секцията с подбраните автомобили." },
  { id: "home_manifesto", label: "Начало — Философия", description: "Изявлението, което се проявява дума по дума." },
  { id: "home_machine", label: "Начало — Машината", description: "Скрол-филмът с колата и телеметрията." },
  { id: "home_concierge", label: "Начало — Издирване", description: "Издирване и внос по поръчка." },
  { id: "home_standard", label: "Начало — Стандартът", description: "Гаранциите и проверката." },
  { id: "home_house", label: "Начало — Изживяването", description: "Шоурум, спа и кафе." },
  { id: "home_finale", label: "Начало — Покана", description: "Финалната покана за действие." },
  { id: "home_seo", label: "Начало — SEO", description: "Meta заглавие и описание." },
  { id: "contact", label: "Контакти", description: "Заглавна част на страница „Контакти“." },
];

export const CONTENT_FIELDS: ContentField[] = [
  // ── Начало — Въведение (IntroFilm, mobile opening) ──
  {
    key: "home.intro.eyebrow",
    group: "home_intro",
    label: "Етикет над заглавието",
    type: "text",
    default: "Пловдив · Премиум автомобили",
  },
  {
    key: "home.intro.line1",
    group: "home_intro",
    label: "Заглавие — първа част",
    type: "text",
    default: "Някои коли се купуват.",
  },
  {
    key: "home.intro.line2",
    group: "home_intro",
    label: "Заглавие — втора част",
    type: "text",
    default: "Други се заслужават.",
    help: "Показва се в по-светъл тон, като продължение.",
  },
  {
    key: "home.intro.scrollHint",
    group: "home_intro",
    label: "Подсказка за скролване",
    type: "text",
    default: "Продължете надолу",
  },

  // ── Начало — Колекция (CollectionGallery) ──
  {
    key: "home.collection.eyebrow",
    group: "home_collection",
    label: "Етикет",
    type: "text",
    default: "01 · Подбрани от нас",
  },
  {
    key: "home.collection.heading",
    group: "home_collection",
    label: "Заглавие",
    type: "text",
    default: "Колекция",
  },
  {
    key: "home.collection.subcopy",
    group: "home_collection",
    label: "Подзаглавие",
    type: "textarea",
    default:
      "Малка по обем, безкомпромисна по подбор. Всеки автомобил — проверен, с история и готов за пътя.",
  },

  // ── Начало — Философия (ManifestoDrive) ──
  {
    key: "home.manifesto.statement",
    group: "home_manifesto",
    label: "Изявление",
    type: "textarea",
    default:
      "Не просто автосалон — дом за машини с характер. Всяка е подбрана, проверена и готова за пътя.",
    help: "Проявява се дума по дума при скролване.",
  },

  // ── Начало — Машината (MachineScene) ──
  {
    key: "home.machine.title",
    group: "home_machine",
    label: "Заглавие",
    type: "text",
    default: "Създадени за движение.",
    help: "Всяка дума се проявява последователно при скролване (на десктоп — на отделен ред).",
  },
  {
    key: "home.machine.subcopy",
    group: "home_machine",
    label: "Подзаглавие",
    type: "textarea",
    default:
      "Силует, мощност и баланс в перфектна хармония — усещате я още преди да запалите двигателя.",
  },

  // ── Начало — Издирване (ConciergeScene) ──
  {
    key: "home.concierge.eyebrow",
    group: "home_concierge",
    label: "Етикет",
    type: "text",
    default: "04 · Издирване и внос",
  },
  {
    key: "home.concierge.headingLine1",
    group: "home_concierge",
    label: "Заглавие — ред 1",
    type: "text",
    default: "Мечтаната кола —",
  },
  {
    key: "home.concierge.headingLine2",
    group: "home_concierge",
    label: "Заглавие — ред 2",
    type: "text",
    default: "намерена и доставена.",
  },
  {
    key: "home.concierge.subcopy",
    group: "home_concierge",
    label: "Подзаглавие",
    type: "textarea",
    default:
      "Дори когато търсеният автомобил не е в нашата зала, го откриваме чрез проверена международна мрежа, инспектираме всеки детайл и го доставяме до Пловдив — напълно прозрачно.",
  },

  // ── Начало — Стандартът (StandardScene) ──
  {
    key: "home.standard.eyebrow",
    group: "home_standard",
    label: "Етикет",
    type: "text",
    default: "05 · Стандартът",
  },
  {
    key: "home.standard.headingLine1",
    group: "home_standard",
    label: "Заглавие — ред 1",
    type: "text",
    default: "Един стандарт.",
  },
  {
    key: "home.standard.headingLine2",
    group: "home_standard",
    label: "Заглавие — ред 2",
    type: "text",
    default: "без компромис.",
  },
  {
    key: "home.standard.subcopy",
    group: "home_standard",
    label: "Подзаглавие",
    type: "textarea",
    default:
      "Всеки автомобил — наличен или поръчан — преминава през един и същ безкомпромисен процес, преди да получи нов собственик.",
  },

  // ── Начало — Изживяването (HouseScene) ──
  {
    key: "home.house.eyebrow",
    group: "home_house",
    label: "Етикет",
    type: "text",
    default: "06 · Изживяването",
  },
  {
    key: "home.house.headingLine1",
    group: "home_house",
    label: "Заглавие — ред 1",
    type: "text",
    default: "Повече от място",
  },
  {
    key: "home.house.headingLine2",
    group: "home_house",
    label: "Заглавие — ред 2",
    type: "text",
    default: "за покупка.",
  },

  // ── Начало — Покана (FinaleScene) ──
  {
    key: "home.finale.headingLine1",
    group: "home_finale",
    label: "Заглавие — ред 1",
    type: "text",
    default: "Вашата следваща",
  },
  {
    key: "home.finale.headingLine2",
    group: "home_finale",
    label: "Заглавие — ред 2",
    type: "text",
    default: "глава.",
  },
  {
    key: "home.finale.subcopy",
    group: "home_finale",
    label: "Подзаглавие",
    type: "textarea",
    default:
      "Открийте автомобила, който ще разказва вашата история — на живо в Пловдив или чрез нашата услуга по издирване и внос.",
  },

  // ── Начало — SEO ──
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

  // ── Контакти ──
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
  home_intro: ["/"],
  home_collection: ["/"],
  home_manifesto: ["/"],
  home_machine: ["/"],
  home_concierge: ["/"],
  home_standard: ["/"],
  home_house: ["/"],
  home_finale: ["/"],
  home_seo: ["/"],
  contact: ["/kontakti"],
};
