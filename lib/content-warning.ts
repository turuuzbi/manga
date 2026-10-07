/**
 * Per-chapter content warnings (Chapter.contentWarning). Types, labels and the
 * reader's modal copy only — no server imports — so the admin form, the save
 * actions and the reader all share one list.
 */

export type ContentWarningValue = "ADULT" | "VIOLENCE";

export const CONTENT_WARNINGS: Record<
  ContentWarningValue,
  { label: string; badge: string; body: string }
> = {
  ADULT: {
    label: "18+ насанд хүрэгчдийн агуулга",
    badge: "+18",
    body: "Энэхүү бүлэг нь насанд хүрэгчдийн буюу +18 дүрслэл агуулах тул бага насны хүүхдүүд үзэхэд тохиромжгүй.",
  },
  VIOLENCE: {
    label: "Хэрцгий дүрслэл",
    badge: "Хэрцгий",
    body: "Энэхүү бүлэг нь хэрцгий дүрслэл агуулах тул бага насны хүүхдүүд үзэхэд тохиромжгүй.",
  },
};

/** A form value as a warning; anything else (including "") means none. */
export function parseContentWarning(value: unknown): ContentWarningValue | null {
  return value === "ADULT" || value === "VIOLENCE" ? value : null;
}
