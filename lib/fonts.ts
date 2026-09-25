import { Pangolin } from "next/font/google";

/**
 * Comic lettering for Yume's end-of-chapter speech bubble.
 *
 * Chosen by checking real glyph coverage, not the advertised subsets: Ө and Ү
 * (U+04E8, U+04AE) sit outside basic Cyrillic, and Neucha and Amatic SC —
 * both listed as "Cyrillic" — lack them. The comic fonts already in the title
 * list (Bangers, Permanent Marker, Bowlby One) have no Cyrillic at all.
 * Pangolin's font file maps every Mongolian Cyrillic letter, upper and lower.
 *
 * Self-hosted by next/font; "cyrillic-ext" is the subset that carries Ө/Ү.
 */
export const yumeComicFont = Pangolin({
  weight: "400",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  display: "swap",
});
