/**
 * The featured slider's images for one series. Each device has its own art
 * (1:1 phone, 16:9 desktop); a missing one borrows the other device's image,
 * and only when both are missing does the slide fall back to the poster. The
 * poster fields themselves are never written from here — the detail page's
 * poster stays independent of the slider.
 */
export function featuredSlideImages(
  manga: {
    featuredImageMobile: string | null;
    featuredImageDesktop: string | null;
  },
  poster: string | undefined,
): { mobileImage?: string; desktopImage?: string } {
  return {
    mobileImage: manga.featuredImageMobile ?? manga.featuredImageDesktop ?? poster,
    desktopImage: manga.featuredImageDesktop ?? manga.featuredImageMobile ?? poster,
  };
}
