export type NavItem = {
  href: string;
  label: string;
  description?: string;
};

export const services: NavItem[] = [
  {
    href: "/zastrahovki",
    label: "Застраховки",
    description: "Каско, гражданска отговорност и специализирани полици.",
  },
  {
    href: "/lizing",
    label: "Лизинг",
    description: "Индивидуални финансови условия за всеки автомобил.",
  },
  {
    href: "/serviz",
    label: "Сервиз",
    description: "Оторизирано обслужване за луксозни марки.",
  },
  {
    href: "/auto-spa",
    label: "Auto Spa",
    description: "Детайлинг, керамични покрития, презентационно почистване.",
  },
  {
    href: "/kafe-bar",
    label: "Кафе бар",
    description: "Пространство за гости, партньори и тестови прегледи.",
  },
];

export const contactInfo = {
  company: "Аутохаус България ЕООД",
  phone: "+359 884 777 147",
  email: "autohausbg@gmail.com",
  address: {
    street: "ул. „Нестор Абаджиев“ №24",
    area: "Асеновградско шосе",
    city: "Пловдив",
    postcode: "4023",
    country: "България",
  },
  eik: "200771286",
  vat: "BG200771286",
  hours: [
    { days: "Понеделник – Петък", time: "09:00 – 18:00" },
    { days: "Auto Spa / Кафе бар", time: "Всеки ден 08:00 – 20:00" },
  ],
  social: {
    facebook: "https://facebook.com/autohaus.bg",
    instagram: "https://instagram.com/autohaus.bg",
    youtube: "#",
  },
} as const;
