/**
 * Gift collections — thematic series «подарок под характер человека»,
 * like Telegram releases themed gift sets. Each collection has its own
 * visual language and a semantic Lucide icon (see CollectionIcon).
 */

export const GIFT_COLLECTIONS = [
  {
    slug: "cute",
    label: "Мимими",
    tagline: "Для милых и нежных",
    description: "Котики, пончики и всё, что хочется затискать.",
  },
  {
    slug: "brutal",
    label: "Брутал",
    tagline: "Для суровых",
    description: "Черепа, молоты и характер, который не гнётся.",
  },
  {
    slug: "glamour",
    label: "Гламур",
    tagline: "Для роскошных",
    description: "Помада, туфельки и жизнь в золотом свете.",
  },
  {
    slug: "nerd",
    label: "Ботаник",
    tagline: "Для умных",
    description: "Атомы, пробирки и любовь к открытиям.",
  },
  {
    slug: "sport",
    label: "Спорт",
    tagline: "Для активных",
    description: "Мячи, гантели и дух победы.",
  },
  {
    slug: "racer",
    label: "Гонщик",
    tagline: "Для быстрых",
    description: "Болиды, шлемы и скорость, от которой захватывает дух.",
  },
  {
    slug: "street",
    label: "Улица",
    tagline: "Для своих",
    description: "Кепки, кроссовки и уличная культура.",
  },
  {
    slug: "beauty",
    label: "Красотка",
    tagline: "Для красивых",
    description: "Зеркальца, бабочки и сияние, которое видно издалека.",
  },
  {
    slug: "attention",
    label: "Внимание",
    tagline: "Для звёзд",
    description: "Прожекторы, микрофоны — для тех, кто хочет, чтобы на него смотрели.",
  },
  {
    slug: "mafia",
    label: "Мафия",
    tagline: "Для серьёзных",
    description: "Шляпы, карты и дела, о которых не говорят вслух.",
  },
] as const;

export type GiftCollectionSlug = (typeof GIFT_COLLECTIONS)[number]["slug"];

export const collectionMeta = (slug: string | null) =>
  GIFT_COLLECTIONS.find((collection) => collection.slug === slug) ?? null;
