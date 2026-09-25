import { formatRelativeMn } from "@/lib/relative-time";

export function getUserDisplayName(user: {
  username?: string | null;
  email?: string | null;
}) {
  if (user.username?.trim()) {
    return user.username.trim();
  }

  if (user.email?.trim()) {
    return user.email.split("@")[0];
  }

  return "Уншигч";
}

export function getUserInitial(user: {
  username?: string | null;
  email?: string | null;
}) {
  const displayName = getUserDisplayName(user);
  return displayName.charAt(0).toUpperCase();
}

/**
 * Comment times, in Mongolian like the rest of the site ("3 өдрийн өмнө").
 * This used the English locale, so every comment on a manga page said
 * "3 days ago". Now shares the formatter the chapter feed uses.
 */
export function formatRelativeTime(date: Date) {
  return formatRelativeMn(date);
}
