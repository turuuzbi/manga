const pageShellStyle = {
  background: "var(--manga-bg)",
  color: "var(--manga-text)",
} as const;

const grid32Style = {
  backgroundImage:
    "linear-gradient(to right, var(--manga-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--manga-grid) 1px, transparent 1px)",
  backgroundSize: "32px 32px",
} as const;

const navStyle = {
  borderColor: "var(--manga-border)",
  background: "var(--manga-nav-bg)",
} as const;

const frameStyle = {
  borderColor: "var(--manga-border)",
} as const;

const panelStyle = {
  borderColor: "var(--manga-border)",
  background: "var(--manga-paper)",
  boxShadow: "7px 7px 0 var(--manga-shadow)",
} as const;

const sectionCardStyle = {
  borderColor: "var(--manga-border)",
  background: "var(--manga-paper)",
  boxShadow: "5px 5px 0 var(--manga-shadow)",
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

const accentStyle = {
  borderColor: "var(--manga-border)",
  background: "var(--manga-highlight)",
} as const;

const heroOverlayStyle = {
  background: "linear-gradient(to top, var(--manga-hero-overlay), transparent)",
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

export function HomeLoadingSkeleton() {
  return (
    <div className="min-h-screen" style={pageShellStyle}>
      <div className="fixed inset-0 -z-10" style={grid32Style} />
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-8">
        <div
          className="motion-ink-fade flex h-16 items-center justify-between border-b-[3px] px-1"
          style={navStyle}
        >
          <div className="flex items-center gap-3">
            <div className="ink-skeleton-dark h-10 w-16 border-2" style={frameStyle} />
            <div className="ink-skeleton-line ink-skeleton h-7 w-28" />
          </div>
          <div className="flex items-center gap-2">
            <div className="ink-skeleton-line ink-skeleton hidden h-10 w-24 md:block" />
            <div className="ink-skeleton-line ink-skeleton-dark h-10 w-10 rounded-full" />
          </div>
        </div>

        <div className="mt-8 grid gap-10">
          <div
            className="motion-ink-up grid overflow-hidden border-[3px] lg:grid-cols-5"
            style={panelStyle}
          >
            <div
              className="relative min-h-[420px] border-b-[3px] lg:col-span-3 lg:border-b-0 lg:border-r-[3px]"
              style={innerSurfaceStyle}
            >
              <div className="ink-skeleton absolute inset-0" />
              <div className="absolute left-5 top-5 h-8 w-32 border-2" style={accentStyle} />
              <div
                className="absolute right-5 top-5 h-16 w-16 rounded-full border-2"
                style={accentStyle}
              />
              <div
                className="absolute inset-x-0 bottom-0 border-t-[3px] border-transparent px-6 py-7"
                style={heroOverlayStyle}
              >
                <div className="ink-skeleton-line ink-skeleton h-4 w-28 bg-white/80" />
                <div className="ink-skeleton-line ink-skeleton mt-4 h-12 w-4/5 bg-white/90" />
                <div className="ink-skeleton-line ink-skeleton mt-4 h-4 w-full max-w-xl bg-white/70" />
                <div className="ink-skeleton-line ink-skeleton mt-2 h-4 w-3/4 bg-white/70" />
                <div className="ink-skeleton mt-7 h-12 w-40 border-2" style={tileStyle} />
              </div>
            </div>

            <div className="grid lg:col-span-2 lg:grid-rows-[auto_1fr]">
              <div className="grid grid-cols-2 border-b-[3px]" style={frameStyle}>
                <div className="p-5">
                  <div className="ink-skeleton-line ink-skeleton h-3 w-16" />
                  <div className="ink-skeleton-line ink-skeleton mt-4 h-9 w-12" />
                </div>
                <div className="border-l-[3px] p-5" style={frameStyle}>
                  <div className="ink-skeleton-line ink-skeleton h-3 w-20" />
                  <div className="ink-skeleton-line ink-skeleton mt-4 h-9 w-12" />
                </div>
              </div>

              <div className="p-6">
                <div className="ink-skeleton-line ink-skeleton h-3 w-32" />
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="ink-skeleton-line ink-skeleton mt-4 h-4"
                    style={{ width: `${index === 3 ? 58 : 100 - index * 8}%` }}
                  />
                ))}
                <div className="mt-6 space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="ink-skeleton-dark h-8 w-8 border-2" style={frameStyle} />
                      <div className="flex-1">
                        <div className="ink-skeleton-line ink-skeleton h-4 w-3/4" />
                        <div className="ink-skeleton-line ink-skeleton mt-2 h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1fr_264px]">
            <div className="motion-ink-up motion-ink-up-delay-1">
              <div
                className="ink-skeleton-dark h-12 w-44 border-[3px]"
                style={sectionCardStyle}
              />
              <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="motion-ink-up"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <div
                      className="relative aspect-[3/4] overflow-hidden border-2"
                      style={tileStyle}
                    >
                      <div className="ink-skeleton absolute inset-0" />
                      <div
                        className="absolute bottom-0 left-0 h-6 w-16"
                        style={{ background: "var(--manga-border)" }}
                      />
                    </div>
                    <div className="ink-skeleton-line ink-skeleton mt-3 h-3 w-16" />
                    <div className="ink-skeleton-line ink-skeleton mt-2 h-5 w-4/5" />
                  </div>
                ))}
              </div>
            </div>

            <div className="motion-ink-up motion-ink-up-delay-2">
              <div className="border-[3px] p-5" style={sectionCardStyle}>
                <div className="ink-skeleton-line ink-skeleton h-3 w-28" />
                <div className="mt-5 flex flex-wrap gap-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="ink-skeleton-dark h-8 w-20 border-2"
                      style={frameStyle}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MangaPreviewLoadingSkeleton() {
  return (
    <div className="min-h-screen px-4 pb-14 pt-24 sm:px-6 lg:px-8" style={pageShellStyle}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="motion-ink-up ink-skeleton-line ink-skeleton h-5 w-28" />

        <div
          className="motion-ink-up motion-ink-up-delay-1 grid overflow-hidden border-[3px] lg:grid-cols-[1.15fr_0.85fr]"
          style={panelStyle}
        >
          <div
            className="relative min-h-[520px] border-b-[3px] lg:border-b-0 lg:border-r-[3px]"
            style={frameStyle}
          >
            <div className="ink-skeleton absolute inset-0" />
            <div className="absolute left-5 top-5 h-8 w-28 border-2" style={accentStyle} />
            <div
              className="absolute right-5 top-5 h-16 w-16 rounded-full border-2"
              style={accentStyle}
            />
            <div className="absolute inset-x-0 bottom-0 px-6 py-7" style={heroOverlayStyle}>
              <div className="ink-skeleton-line ink-skeleton h-4 w-28 bg-white/80" />
              <div className="ink-skeleton-line ink-skeleton mt-4 h-12 w-4/5 bg-white/90" />
              <div className="ink-skeleton-line ink-skeleton mt-4 h-4 w-full max-w-xl bg-white/70" />
              <div className="ink-skeleton-line ink-skeleton mt-2 h-4 w-3/4 bg-white/70" />
            </div>
          </div>

          <div className="grid grid-rows-[auto_auto_1fr]">
            <div className="grid grid-cols-3 border-b-[3px]" style={frameStyle}>
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className={`p-5 ${index < 2 ? "border-r-[3px]" : ""}`}
                  style={index < 2 ? frameStyle : undefined}
                >
                  <div className="ink-skeleton-line ink-skeleton h-3 w-16" />
                  <div className="ink-skeleton-line ink-skeleton mt-4 h-6 w-20" />
                </div>
              ))}
            </div>

            <div className="border-b-[3px] p-6" style={frameStyle}>
              <div className="ink-skeleton-line ink-skeleton h-3 w-24" />
              <div className="ink-skeleton-line ink-skeleton mt-5 h-4 w-full" />
              <div className="ink-skeleton-line ink-skeleton mt-3 h-4 w-5/6" />
            </div>

            <div className="p-6">
              <div className="border-2 p-4" style={tileStyle}>
                <div className="ink-skeleton-line ink-skeleton h-3 w-20" />
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="ink-skeleton-line ink-skeleton h-16 w-full" />
                  <div className="ink-skeleton-line ink-skeleton h-16 w-full" />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <div className="ink-skeleton-dark h-12 w-40 border-2" style={frameStyle} />
                <div className="ink-skeleton h-12 w-36 border-2" style={frameStyle} />
              </div>
            </div>
          </div>
        </div>

        <div className="motion-ink-up motion-ink-up-delay-2 border-[3px] p-5 sm:p-7" style={panelStyle}>
          <div className="ink-skeleton-line ink-skeleton-dark h-8 w-40" />
          <div className="mt-6 grid gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="motion-ink-up grid grid-cols-[72px_1fr] overflow-hidden border-2 sm:grid-cols-[84px_1fr_auto]"
                style={{ ...tileStyle, animationDelay: `${index * 55}ms` }}
              >
                <div className="relative border-r-2" style={accentStyle}>
                  <div className="ink-skeleton absolute inset-0" style={accentStyle} />
                </div>
                <div className="p-4">
                  <div className="ink-skeleton-line ink-skeleton h-5 w-3/4" />
                  <div className="ink-skeleton-line ink-skeleton mt-3 h-4 w-1/2" />
                </div>
                <div className="hidden border-l-2 sm:block" style={innerSurfaceStyle} />
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
