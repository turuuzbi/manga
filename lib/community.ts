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

  return "Reader";
}

export function getUserInitial(user: {
  username?: string | null;
  email?: string | null;
}) {
  const displayName = getUserDisplayName(user);
  return displayName.charAt(0).toUpperCase();
}

export function formatRelativeTime(date: Date) {
  const formatter = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(seconds);

  if (absSeconds < 60) {
    return formatter.format(seconds, "second");
  }

  const minutes = Math.round(seconds / 60);

  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, "minute");
  }

  const hours = Math.round(minutes / 60);

  if (Math.abs(hours) < 24) {
    return formatter.format(hours, "hour");
  }

  const days = Math.round(hours / 24);

  if (Math.abs(days) < 30) {
    return formatter.format(days, "day");
  }

  const months = Math.round(days / 30);

  if (Math.abs(months) < 12) {
    return formatter.format(months, "month");
  }

  const years = Math.round(days / 365);
  return formatter.format(years, "year");
}
