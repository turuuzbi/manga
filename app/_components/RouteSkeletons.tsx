// ─── Shared comic-style tokens (reader + admin still use the ink aesthetic) ───
const pageShellStyle = {
  background: "var(--manga-bg)",
  color: "var(--manga-text)",
} as const;

const frameStyle = {
  borderColor: "var(--manga-border)",
} as const;

const tileStyle = {
  borderColor: "var(--manga-border)",
  background: "var(--manga-paper-3)",
  boxShadow: "3px 3px 0 var(--manga-shadow)",
} as const;

const innerSurfaceStyle = {
  borderColor: "var(--manga-border)",
  background: "var(--manga-paper-2)",
} as const;

const readerBackdropStyle = {
  backgroundImage:
    "radial-gradient(circle at top, var(--manga-radial-a), transparent 28%), radial-gradient(circle at bottom, var(--manga-radial-b), transparent 24%)",
} as const;

const adminBackdropStyle = {
  backgroundImage:
    "radial-gradient(circle at top left, var(--manga-radial-a), transparent 30%), radial-gradient(circle at bottom right, var(--manga-radial-b), transparent 26%), linear-gradient(to right, var(--manga-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--manga-grid) 1px, transparent 1px)",
  backgroundSize: "auto, auto, 28px 28px, 28px 28px",
} as const;

const readerChromeStyle = {
  borderColor: "var(--manga-border)",
  background: "var(--manga-nav-bg)",
  boxShadow: "0 18px 60px rgba(0, 0, 0, 0.2)",
} as const;

const readerCanvasStyle = {
  borderColor: "var(--manga-border)",
  background: "var(--manga-paper-2)",
  boxShadow: "0 24px 80px rgba(0, 0, 0, 0.24)",
} as const;

const adminCardStyle = {
  borderColor: "var(--manga-border)",
  background: "var(--manga-paper)",
  boxShadow: "0 20px 80px rgba(0, 0, 0, 0.22)",
} as const;

// ─── Shared "yume" tokens (home + manga detail use the soft gold/rose look) ───
const yumeHeroStyle = {
  borderRadius: 26,
  border: "1px solid var(--home-line-strong)",
  background: "var(--home-paper-2)",
  boxShadow: "0 30px 60px -28px var(--home-shadow-strong)",
} as const;

const yumePanelStyle = {
  borderRadius: 22,
  border: "1px solid var(--home-line)",
  background: "var(--home-paper)",
  boxShadow: "0 22px 48px -30px var(--home-shadow-strong)",
} as const;

const yumeCardStyle = {
  borderRadius: 16,
  border: "1px solid var(--home-line)",
  background: "var(--home-paper)",
  boxShadow: "0 12px 26px -20px var(--home-shadow-strong)",
} as const;

const yumeStatStyle = {
  borderRadius: 12,
  border: "1px solid var(--home-line)",
  background: "var(--home-paper-2)",
} as const;

const yumeLineStyle = { borderColor: "var(--home-line)" } as const;
const yumePosterStyle = { border: "1px solid var(--home-line)" } as const;

// Translucent placeholder shapes for text overlaid on a (dark) hero image.
const onHero = (opacity: number) =>
  ({ background: `rgba(255, 255, 255, ${opacity})` }) as const;

function YumeNavSkeleton() {
  return (
    <div
      className="motion-ink-fade sticky top-0 z-40 border-b"
      style={{ ...yumeLineStyle, background: "var(--manga-nav-bg)", backdropFilter: "blur(14px)" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <div
          className="ink-skeleton h-12 w-12 rounded-xl"
          style={yumePosterStyle}
        />
        <div className="hidden items-center gap-8 md:flex">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="ink-skeleton ink-skeleton-line h-2.5 w-14" />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="ink-skeleton h-10 w-10 rounded-full" />
          <div className="ink-skeleton hidden h-9 w-40 rounded-full md:block" />
          <div className="ink-skeleton h-9 w-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function YumePosterSkeleton() {
  return (
    <div>
      <div
        className="ink-skeleton aspect-[3/4] w-full rounded-2xl"
        style={yumePosterStyle}
      />
      <div className="ink-skeleton ink-skeleton-line mt-3 h-2.5 w-10" />
      <div className="ink-skeleton ink-skeleton-line mt-2 h-4 w-4/5" />
    </div>
  );
}

function YumeSectionHeaderSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <div>
        <div className="ink-skeleton ink-skeleton-line h-2.5 w-24" />
        <div className="ink-skeleton ink-skeleton-line mt-3 h-7 w-48" />
      </div>
      <div className="ink-skeleton hidden h-px flex-1 sm:block" />
    </div>
  );
}

function YumeHeroBodySkeleton({ minHeight }: { minHeight: string }) {
  return (
    <>
      <div className="ink-skeleton absolute inset-0" />
      <div
        className="relative z-10 flex flex-col justify-end p-6 sm:p-10"
        style={{ minHeight }}
      >
        <div className="h-2.5 w-24 rounded-full" style={onHero(0.4)} />
        <div className="mt-4 h-10 w-4/5 max-w-xl rounded-lg sm:h-14" style={onHero(0.5)} />
        <div className="mt-3 h-9 w-2/3 max-w-md rounded-lg sm:h-12" style={onHero(0.5)} />
        <div className="mt-5 h-3.5 w-full max-w-sm rounded-full" style={onHero(0.32)} />
        <div className="mt-6 flex gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-6 w-16 rounded-full" style={onHero(0.22)} />
          ))}
        </div>
        <div className="mt-7 h-11 w-44 rounded-full" style={onHero(0.55)} />
      </div>
    </>
  );
}

export function HomeLoadingSkeleton() {
  return (
    <div className="yume-surface min-h-screen">
      <YumeNavSkeleton />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="motion-ink-up relative overflow-hidden" style={yumeHeroStyle}>
          <YumeHeroBodySkeleton minHeight="clamp(360px, 52vw, 540px)" />
        </div>

        <div className="motion-ink-up motion-ink-up-delay-1 mt-12">
          <YumeSectionHeaderSkeleton />
          <div className="mt-6 flex gap-[18px] overflow-hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="w-[158px] shrink-0 sm:w-[178px]">
                <YumePosterSkeleton />
              </div>
            ))}
          </div>
        </div>

        <div className="motion-ink-up motion-ink-up-delay-2 mt-14">
          <YumeSectionHeaderSkeleton />
          <div className="mt-6 flex flex-wrap gap-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="ink-skeleton h-8 w-20 rounded-full"
                style={yumePosterStyle}
              />
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="motion-ink-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <YumePosterSkeleton />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MangaPreviewLoadingSkeleton() {
  return (
    <div className="yume-surface min-h-screen">
      <YumeNavSkeleton />

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="motion-ink-up ink-skeleton ink-skeleton-line h-3 w-20" />

        {/* Hero */}
        <div
          className="motion-ink-up motion-ink-up-delay-1 relative overflow-hidden"
          style={yumeHeroStyle}
        >
          <YumeHeroBodySkeleton minHeight="clamp(380px, 54vw, 540px)" />
        </div>

        {/* About + stats */}
        <div className="motion-ink-up motion-ink-up-delay-2 grid gap-7 lg:grid-cols-[1.4fr_1fr]">
          <div className="p-6 sm:p-9" style={yumePanelStyle}>
            <div className="ink-skeleton ink-skeleton-line h-2.5 w-16" />
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="ink-skeleton ink-skeleton-line mt-4 h-4"
                style={{ width: `${index === 3 ? 52 : 100 - index * 6}%` }}
              />
            ))}
            <div className="ink-skeleton mt-7 h-11 w-44 rounded-full" />
          </div>

          <div className="p-6 sm:p-9" style={yumePanelStyle}>
            <div className="ink-skeleton ink-skeleton-line h-2.5 w-20" />
            <div className="mt-5 grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="p-4" style={yumeStatStyle}>
                  <div className="ink-skeleton ink-skeleton-line h-2.5 w-16" />
                  <div className="ink-skeleton ink-skeleton-line mt-3 h-5 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chapters */}
        <div className="motion-ink-up motion-ink-up-delay-3 p-6 sm:p-9" style={yumePanelStyle}>
          <div className="mb-7 flex items-end justify-between">
            <div className="ink-skeleton ink-skeleton-line h-8 w-40" />
            <div className="ink-skeleton ink-skeleton-line h-3 w-24" />
          </div>
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="motion-ink-up grid grid-cols-[96px_1fr] overflow-hidden sm:grid-cols-[124px_1fr_auto]"
                style={{ ...yumeCardStyle, animationDelay: `${index * 55}ms` }}
              >
                <div className="ink-skeleton min-h-[104px]" />
                <div className="flex flex-col justify-center p-4 sm:p-5">
                  <div className="ink-skeleton ink-skeleton-line h-5 w-3/4" />
                  <div className="ink-skeleton ink-skeleton-line mt-3 h-3.5 w-1/2" />
                </div>
                <div
                  className="hidden items-center justify-center border-l px-6 sm:flex"
                  style={yumeLineStyle}
                >
                  <div className="ink-skeleton ink-skeleton-line h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReaderLoadingSkeleton() {
  return (
    <div className="min-h-screen" style={pageShellStyle}>
      <div className="fixed inset-0" style={readerBackdropStyle} />
      <div className="relative z-10">
        <div className="motion-ink-fade fixed inset-x-0 top-0 border-b backdrop-blur-xl" style={readerChromeStyle}>
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 py-3 sm:px-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <div className="ink-skeleton-dark h-9 w-9 rounded-full border" style={frameStyle} />
              </div>
              <div className="ink-skeleton-line ink-skeleton-dark mt-3 h-6 w-44" />
              <div className="ink-skeleton-line ink-skeleton mt-2 h-4 w-28" />
            </div>
            <div
              className="flex w-full items-center justify-center gap-2 rounded-full border p-1 md:w-auto"
              style={innerSurfaceStyle}
            >
              <div className="ink-skeleton-dark h-10 flex-1 rounded-full md:w-28" />
              <div className="ink-skeleton h-10 flex-1 rounded-full md:w-28" />
            </div>
          </div>
        </div>

        <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-0 pb-40 pt-20 sm:pt-24">
          <div
            className="mx-3 mb-4 flex items-center justify-between rounded-full border px-4 py-2 sm:mx-0"
            style={innerSurfaceStyle}
          >
            <div className="ink-skeleton-dark h-3 w-24 rounded-full" />
            <div className="ink-skeleton h-3 w-14 rounded-full" />
          </div>

          <div
            className="relative mx-auto min-h-[68vh] w-full max-w-4xl overflow-hidden border"
            style={readerCanvasStyle}
          >
            <div className="ink-skeleton absolute inset-0" />
            <div className="absolute inset-x-[10%] top-[7%] h-[24%] border" style={innerSurfaceStyle} />
            <div className="absolute inset-x-[10%] top-[33%] h-[29%] border" style={innerSurfaceStyle} />
            <div className="absolute inset-x-[10%] top-[66%] h-[18%] border" style={innerSurfaceStyle} />
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-4 px-3 sm:px-5">
          <div className="mx-auto w-full max-w-md">
            <div className="ink-skeleton-dark h-20 rounded-[24px] border" style={readerChromeStyle} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminLoadingSkeleton() {
  return (
    <div className="min-h-screen px-4 pb-10 pt-24 sm:px-6 lg:px-8" style={pageShellStyle}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={adminBackdropStyle} />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-6">
        <div className="motion-ink-up rounded-[28px] border p-6" style={adminCardStyle}>
          <div className="ink-skeleton-dark h-7 w-40 rounded-full" />
          <div className="ink-skeleton-line ink-skeleton-dark mt-6 h-14 w-full max-w-2xl" />
          <div className="ink-skeleton-line ink-skeleton mt-4 h-4 w-full max-w-xl" />
          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:w-[420px]">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="ink-skeleton-dark h-28 rounded-3xl border"
                style={innerSurfaceStyle}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div
              className="motion-ink-up motion-ink-up-delay-1 rounded-[28px] border p-5"
              style={adminCardStyle}
            >
              <div className="grid gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="ink-skeleton h-12 rounded-2xl border"
                    style={innerSurfaceStyle}
                  />
                ))}
              </div>
            </div>

            <div
              className="motion-ink-up motion-ink-up-delay-2 rounded-[28px] border p-6"
              style={adminCardStyle}
            >
              <div className="ink-skeleton-line ink-skeleton-dark h-8 w-56" />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="ink-skeleton h-14 rounded-2xl border"
                    style={innerSurfaceStyle}
                  />
                ))}
              </div>
              <div className="mt-4 space-y-3 rounded-2xl border p-4" style={innerSurfaceStyle}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-2xl border p-3"
                    style={tileStyle}
                  >
                    <div className="ink-skeleton-dark h-14 w-10 rounded-xl" />
                    <div className="flex-1">
                      <div className="ink-skeleton-line ink-skeleton-dark h-4 w-20" />
                      <div className="ink-skeleton-line ink-skeleton mt-2 h-3 w-12" />
                    </div>
                    <div className="flex gap-2">
                      <div className="ink-skeleton-dark h-10 w-10 rounded-2xl border" style={frameStyle} />
                      <div className="ink-skeleton h-10 w-10 rounded-2xl border" style={frameStyle} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="motion-ink-up motion-ink-up-delay-3 space-y-6">
            <div className="ink-skeleton-dark h-56 rounded-[28px] border" style={adminCardStyle} />
            <div className="ink-skeleton h-64 rounded-[28px] border" style={adminCardStyle} />
          </div>
        </div>
      </div>
    </div>
  );
}
