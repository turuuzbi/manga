"use client";

/**
 * Built-in image editor / cropper for the admin console.
 *
 * `ImageEditorField` is a drop-in replacement for the plain file `UploadField`.
 * The user picks a local image, edits it (crop via pan + zoom inside an
 * aspect-ratio frame, rotate, flip, brightness / contrast / saturation), and on
 * "apply" the edited result is rendered to a Blob and injected into a real
 * hidden `<input type="file" name={name}>` using `DataTransfer`. That means the
 * surrounding <form> and its server action keep working exactly as before —
 * they still receive a normal File under the same field name.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Crop,
  FileImage,
  FlipHorizontal2,
  FlipVertical2,
  Pencil,
  RotateCcw,
  RotateCw,
  Trash2,
  X,
} from "lucide-react";

export type AspectPreset = {
  id: string;
  label: string;
  /** width / height. `null` means "use the source image's own ratio". */
  ratio: number | null;
};

/** Sensible defaults for a chapter thumbnail (the list cell is ~96x104). */
export const CHAPTER_THUMB_PRESETS: AspectPreset[] = [
  { id: "list", label: "Жагсаалт", ratio: 96 / 104 },
  { id: "square", label: "1:1", ratio: 1 },
  { id: "portrait", label: "3:4", ratio: 3 / 4 },
  { id: "wide", label: "16:9", ratio: 16 / 9 },
  { id: "original", label: "Эх хэвээр", ratio: null },
];

type EditSettings = {
  aspectId: string;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  scale: number;
  panX: number;
  panY: number;
  brightness: number;
  contrast: number;
  saturation: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function frameFromRatio(ratio: number, box: number) {
  if (ratio >= 1) {
    return { w: box, h: Math.round(box / ratio) };
  }
  return { w: Math.round(box * ratio), h: box };
}

function effectiveDims(nw: number, nh: number, rotation: number) {
  const rot = ((rotation % 360) + 360) % 360;
  return rot === 90 || rot === 270 ? { ew: nh, eh: nw } : { ew: nw, eh: nh };
}

function computeMinScale(
  nw: number,
  nh: number,
  vw: number,
  vh: number,
  rotation: number,
) {
  const { ew, eh } = effectiveDims(nw, nh, rotation);
  return Math.max(vw / ew, vh / eh);
}

function clampPan(
  panX: number,
  panY: number,
  nw: number,
  nh: number,
  vw: number,
  vh: number,
  rotation: number,
  scale: number,
) {
  const { ew, eh } = effectiveDims(nw, nh, rotation);
  const maxX = Math.max(0, (ew * scale) / 2 - vw / 2);
  const maxY = Math.max(0, (eh * scale) / 2 - vh / 2);
  return { x: clamp(panX, -maxX, maxX), y: clamp(panY, -maxY, maxY) };
}

// ── The field wrapper (what AdminConsole renders) ──────────────────────────

export function ImageEditorField({
  name,
  label,
  helper,
  existingImage,
  presets = CHAPTER_THUMB_PRESETS,
  defaultAspectId = presets[0]?.id,
  outputType = "image/jpeg",
  outputQuality = 0.92,
  maxOutputDimension = 1600,
}: {
  name: string;
  label: string;
  helper: string;
  existingImage?: string | null;
  presets?: AspectPreset[];
  defaultAspectId?: string;
  outputType?: "image/jpeg" | "image/png" | "image/webp";
  outputQuality?: number;
  maxOutputDimension?: number;
}) {
  const submitInputRef = useRef<HTMLInputElement>(null);
  const sourcePickerRef = useRef<HTMLInputElement>(null);

  const [source, setSource] = useState<{ url: string; name: string } | null>(
    null,
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [result, setResult] = useState<{ url: string; name: string } | null>(
    null,
  );
  const [lastEdit, setLastEdit] = useState<EditSettings | null>(null);

  // Revoke object URLs when they are replaced / on unmount.
  useEffect(() => {
    return () => {
      if (source) URL.revokeObjectURL(source.url);
    };
  }, [source]);
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const openPicker = useCallback(() => sourcePickerRef.current?.click(), []);

  const onSourceChosen = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Allow re-picking the same file next time.
      event.target.value = "";
      if (!file || !file.type.startsWith("image/")) return;
      setSource((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { url: URL.createObjectURL(file), name: file.name };
      });
      setLastEdit(null);
      setEditorOpen(true);
    },
    [],
  );

  const applyEdited = useCallback(
    (blob: Blob, settings: EditSettings) => {
      const input = submitInputRef.current;
      if (!input) return;
      const ext =
        outputType === "image/png"
          ? "png"
          : outputType === "image/webp"
            ? "webp"
            : "jpg";
      const base = (source?.name ?? "chapter-cover").replace(/\.[^.]+$/, "");
      const file = new File([blob], `${base}-edited.${ext}`, {
        type: outputType,
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      // Notify any listeners bound to the real input.
      input.dispatchEvent(new Event("change", { bubbles: true }));

      setResult((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { url: URL.createObjectURL(blob), name: file.name };
      });
      setLastEdit(settings);
      setEditorOpen(false);
    },
    [outputType, source],
  );

  const clearResult = useCallback(() => {
    const input = submitInputRef.current;
    if (input) {
      input.value = "";
      input.files = new DataTransfer().files;
    }
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    setLastEdit(null);
  }, []);

  const hasNew = Boolean(result);

  return (
    <label className="block">
      <span className="ad-label">{label}</span>

      {/* Real submitted input — receives the edited File via DataTransfer. */}
      <input ref={submitInputRef} type="file" name={name} className="hidden" />
      {/* Source picker — never submitted, only feeds the editor. */}
      <input
        ref={sourcePickerRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onSourceChosen}
      />

      {hasNew ? (
        <div className="pe-field-result">
          <div className="pe-field-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result!.url} alt="Засварласан урьдчилсан харагдац" />
            <span className="pe-field-tag">
              <Check size={12} /> Засварласан
            </span>
          </div>
          <div className="pe-field-actions">
            <p className="pe-field-name">{result!.name}</p>
            <div className="pe-field-btns">
              <button
                type="button"
                className="ad-btn ad-btn-line pe-mini"
                onClick={() => setEditorOpen(true)}
              >
                <Pencil size={14} /> Дахин засах
              </button>
              <button
                type="button"
                className="ad-btn ad-btn-line pe-mini"
                onClick={openPicker}
              >
                <FileImage size={14} /> Өөр зураг
              </button>
              <button
                type="button"
                className="ad-btn ad-btn-line pe-mini pe-danger"
                onClick={clearResult}
              >
                <Trash2 size={14} /> Устгах
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" className="ad-upload pe-dropzone" onClick={openPicker}>
          {existingImage ? (
            <div className="pe-field-existing">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={existingImage} alt="Одоогийн зураг" />
              <div className="pe-field-existing-text">
                <p className="pe-strong">Зураг сонгож засах</p>
                <p className="pe-muted">{helper}</p>
              </div>
            </div>
          ) : (
            <div className="flex min-h-32 flex-col items-center justify-center gap-3 text-center">
              <div className="ad-upload-ico">
                <Crop size={20} />
              </div>
              <div>
                <p className="pe-strong">Зураг сонгож засах</p>
                <p className="pe-muted mt-1">{helper}</p>
              </div>
            </div>
          )}
        </button>
      )}

      {editorOpen && source ? (
        <PhotoEditorModal
          src={source.url}
          presets={presets}
          defaultAspectId={defaultAspectId ?? presets[0].id}
          initial={lastEdit}
          outputType={outputType}
          outputQuality={outputQuality}
          maxOutputDimension={maxOutputDimension}
          onCancel={() => setEditorOpen(false)}
          onApply={applyEdited}
        />
      ) : null}

      <EditorStyles />
    </label>
  );
}

// ── The editor modal ───────────────────────────────────────────────────────

function PhotoEditorModal({
  src,
  presets,
  defaultAspectId,
  initial,
  outputType,
  outputQuality,
  maxOutputDimension,
  onCancel,
  onApply,
}: {
  src: string;
  presets: AspectPreset[];
  defaultAspectId: string;
  initial: EditSettings | null;
  outputType: "image/jpeg" | "image/png" | "image/webp";
  outputQuality: number;
  maxOutputDimension: number;
  onCancel: () => void;
  onApply: (blob: Blob, settings: EditSettings) => void;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  } | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [box, setBox] = useState(340);
  const [busy, setBusy] = useState(false);

  const [aspectId, setAspectId] = useState(initial?.aspectId ?? defaultAspectId);
  const [rotation, setRotation] = useState(initial?.rotation ?? 0);
  const [flipH, setFlipH] = useState(initial?.flipH ?? false);
  const [flipV, setFlipV] = useState(initial?.flipV ?? false);
  const [scale, setScale] = useState(initial?.scale ?? 1);
  const [pan, setPan] = useState({
    x: initial?.panX ?? 0,
    y: initial?.panY ?? 0,
  });
  const [brightness, setBrightness] = useState(initial?.brightness ?? 100);
  const [contrast, setContrast] = useState(initial?.contrast ?? 100);
  const [saturation, setSaturation] = useState(initial?.saturation ?? 100);

  const activePreset =
    presets.find((preset) => preset.id === aspectId) ?? presets[0];
  const ratio =
    activePreset.ratio ?? (nat.w && nat.h ? nat.w / nat.h : 1);
  const frame = frameFromRatio(ratio, box);
  const minScale = loaded
    ? computeMinScale(nat.w, nat.h, frame.w, frame.h, rotation)
    : 1;
  const maxScale = minScale * 6;

  // Responsive frame box.
  useEffect(() => {
    const update = () => {
      const next = Math.max(
        220,
        Math.min(
          360,
          window.innerWidth - 72,
          Math.round(window.innerHeight * 0.5),
        ),
      );
      setBox(next);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Lock body scroll + Escape to close.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  // Load the source image.
  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      imgRef.current = image;
      setNat({ w: image.naturalWidth, h: image.naturalHeight });
      setLoaded(true);
    };
    image.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  // Once the image + frame are known, fit it (respecting any initial settings).
  const didInit = useRef(false);
  useEffect(() => {
    if (!loaded || didInit.current) return;
    didInit.current = true;
    const fit = computeMinScale(nat.w, nat.h, frame.w, frame.h, rotation);
    if (initial) {
      const nextScale = Math.max(initial.scale, fit);
      setScale(nextScale);
      setPan(
        clampPan(
          initial.panX,
          initial.panY,
          nat.w,
          nat.h,
          frame.w,
          frame.h,
          rotation,
          nextScale,
        ),
      );
    } else {
      setScale(fit);
      setPan({ x: 0, y: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // Keep scale >= min and pan within bounds whenever the geometry changes.
  useEffect(() => {
    if (!loaded) return;
    setScale((prev) => clamp(prev, minScale, maxScale));
    setPan((prev) =>
      clampPan(prev.x, prev.y, nat.w, nat.h, frame.w, frame.h, rotation, scale),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame.w, frame.h, rotation, minScale]);

  const paint = useCallback(
    (
      canvas: HTMLCanvasElement,
      vw: number,
      vh: number,
      k: number,
    ) => {
      const image = imgRef.current;
      if (!image) return;
      canvas.width = Math.round(vw * k);
      canvas.height = Math.round(vh * k);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.save();
      ctx.scale(k, k);
      if (outputType === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, vw, vh);
      }
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      ctx.translate(vw / 2 + pan.x, vh / 2 + pan.y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale * (flipH ? -1 : 1), scale * (flipV ? -1 : 1));
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, -nat.w / 2, -nat.h / 2, nat.w, nat.h);
      ctx.restore();
    },
    [brightness, contrast, saturation, pan, rotation, scale, flipH, flipV, nat, outputType],
  );

  // Live preview.
  useEffect(() => {
    if (!loaded || !canvasRef.current) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    paint(canvasRef.current, frame.w, frame.h, dpr);
  }, [loaded, paint, frame.w, frame.h]);

  // Panning.
  const onPointerDown = (event: React.PointerEvent) => {
    if (!loaded) return;
    frameRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };
  const onPointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const nextX = drag.panX + (event.clientX - drag.startX);
    const nextY = drag.panY + (event.clientY - drag.startY);
    setPan(
      clampPan(nextX, nextY, nat.w, nat.h, frame.w, frame.h, rotation, scale),
    );
  };
  const endPan = (event: React.PointerEvent) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  const onWheel = (event: React.WheelEvent) => {
    if (!loaded) return;
    const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
    const next = clamp(scale * factor, minScale, maxScale);
    setScale(next);
    setPan((prev) =>
      clampPan(prev.x, prev.y, nat.w, nat.h, frame.w, frame.h, rotation, next),
    );
  };

  const rotate = (delta: number) => {
    setRotation((prev) => ((prev + delta) % 360 + 360) % 360);
    setPan({ x: 0, y: 0 });
  };

  const changeAspect = (id: string) => {
    setAspectId(id);
    setPan({ x: 0, y: 0 });
    const preset = presets.find((entry) => entry.id === id) ?? presets[0];
    const nextRatio =
      preset.ratio ?? (nat.w && nat.h ? nat.w / nat.h : 1);
    const nextFrame = frameFromRatio(nextRatio, box);
    setScale(computeMinScale(nat.w, nat.h, nextFrame.w, nextFrame.h, rotation));
  };

  const resetAll = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setPan({ x: 0, y: 0 });
    setScale(computeMinScale(nat.w, nat.h, frame.w, frame.h, 0));
  };

  const apply = async () => {
    if (!loaded || busy) return;
    setBusy(true);
    try {
      let k = Math.max(1 / scale, 1);
      const outMax = Math.max(frame.w, frame.h) * k;
      if (outMax > maxOutputDimension) k *= maxOutputDimension / outMax;
      const exportCanvas = document.createElement("canvas");
      paint(exportCanvas, frame.w, frame.h, k);
      const blob = await new Promise<Blob | null>((resolve) =>
        exportCanvas.toBlob(resolve, outputType, outputQuality),
      );
      if (!blob) {
        setBusy(false);
        return;
      }
      onApply(blob, {
        aspectId,
        rotation,
        flipH,
        flipV,
        scale,
        panX: pan.x,
        panY: pan.y,
        brightness,
        contrast,
        saturation,
      });
    } catch {
      setBusy(false);
    }
  };

  return (
    <div
      className="pe-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="pe-modal" onClick={(event) => event.stopPropagation()}>
        <div className="pe-head">
          <div className="pe-head-title">
            <Crop size={16} />
            <span>Зураг засах</span>
          </div>
          <button
            type="button"
            className="ad-icon-btn pe-close"
            onClick={onCancel}
            aria-label="Хаах"
          >
            <X size={16} />
          </button>
        </div>

        <div className="pe-body">
          <div className="pe-stage">
            <div
              ref={frameRef}
              className="pe-frame"
              style={{ width: frame.w, height: frame.h }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endPan}
              onPointerCancel={endPan}
              onWheel={onWheel}
            >
              <canvas
                ref={canvasRef}
                className="pe-canvas"
                style={{ width: frame.w, height: frame.h }}
              />
              <div className="pe-grid" aria-hidden>
                <span /><span /><span /><span />
              </div>
              {!loaded ? <div className="pe-loading">Ачааллаж байна…</div> : null}
            </div>
            <p className="pe-hint">Зурагаа чирж байрлуулна · дугуйгаар томруулна</p>
          </div>

          <div className="pe-controls">
            <div className="pe-group">
              <p className="pe-group-label">Харьцаа</p>
              <div className="pe-chips">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`pe-chip${
                      preset.id === aspectId ? " pe-chip-active" : ""
                    }`}
                    onClick={() => changeAspect(preset.id)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pe-group">
              <p className="pe-group-label">Байрлал</p>
              <div className="pe-tools">
                <button
                  type="button"
                  className="pe-tool"
                  onClick={() => rotate(-90)}
                  title="Зүүн эргүүлэх"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  type="button"
                  className="pe-tool"
                  onClick={() => rotate(90)}
                  title="Баруун эргүүлэх"
                >
                  <RotateCw size={16} />
                </button>
                <button
                  type="button"
                  className={`pe-tool${flipH ? " pe-tool-active" : ""}`}
                  onClick={() => setFlipH((prev) => !prev)}
                  title="Хэвтээ эргүүлэх"
                >
                  <FlipHorizontal2 size={16} />
                </button>
                <button
                  type="button"
                  className={`pe-tool${flipV ? " pe-tool-active" : ""}`}
                  onClick={() => setFlipV((prev) => !prev)}
                  title="Босоо эргүүлэх"
                >
                  <FlipVertical2 size={16} />
                </button>
              </div>
            </div>

            <Slider
              label="Томруулах"
              min={minScale}
              max={maxScale}
              step={(maxScale - minScale) / 200 || 0.01}
              value={scale}
              onChange={(value) => {
                setScale(value);
                setPan((prev) =>
                  clampPan(
                    prev.x,
                    prev.y,
                    nat.w,
                    nat.h,
                    frame.w,
                    frame.h,
                    rotation,
                    value,
                  ),
                );
              }}
            />

            <div className="pe-group">
              <p className="pe-group-label">Өнгө тохируулга</p>
              <Slider
                label="Гэрэл"
                min={50}
                max={150}
                step={1}
                value={brightness}
                suffix="%"
                onChange={setBrightness}
              />
              <Slider
                label="Тодрол"
                min={50}
                max={150}
                step={1}
                value={contrast}
                suffix="%"
                onChange={setContrast}
              />
              <Slider
                label="Ханалт"
                min={0}
                max={200}
                step={1}
                value={saturation}
                suffix="%"
                onChange={setSaturation}
              />
            </div>

            <button type="button" className="pe-reset" onClick={resetAll}>
              Тохиргоог цэвэрлэх
            </button>
          </div>
        </div>

        <div className="pe-foot">
          <button
            type="button"
            className="ad-btn ad-btn-line"
            onClick={onCancel}
          >
            Болих
          </button>
          <button
            type="button"
            className="ad-btn ad-btn-primary"
            onClick={apply}
            disabled={!loaded || busy}
          >
            <Check size={16} />
            {busy ? "Боловсруулж байна…" : "Хэрэглэх"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  suffix,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  const percent =
    max > min ? Math.round(((value - min) / (max - min)) * 100) : 0;
  return (
    <label className="pe-slider">
      <span className="pe-slider-top">
        <span>{label}</span>
        <span className="pe-slider-val">
          {suffix ? `${Math.round(value)}${suffix}` : `${percent}%`}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

// ── Scoped styles (inherits --home-* tokens from .yume-surface) ────────────

function EditorStyles() {
  return (
    <style>{`
.pe-strong { font-size: 0.875rem; font-weight: 600; color: var(--home-plum); }
.pe-muted { font-size: 0.75rem; color: var(--home-plum-soft); }
.pe-dropzone { display: block; width: 100%; text-align: left; cursor: pointer;
  border: 1px dashed var(--home-line-strong); background: var(--home-paper-2); }
.pe-dropzone:hover { transform: none; border-color: var(--home-rose); background: var(--home-paper); }

.pe-field-existing { display: flex; align-items: center; gap: 14px; }
.pe-field-existing img { width: 56px; height: 60px; object-fit: cover; border-radius: 10px;
  border: 1px solid var(--home-line); }
.pe-field-existing-text { min-width: 0; }

.pe-field-result { border-radius: 16px; border: 1px solid var(--home-line);
  background: var(--home-paper-2); padding: 14px; display: flex; gap: 14px; align-items: center; }
.pe-field-thumb { position: relative; flex: none; width: 74px; height: 80px; border-radius: 12px;
  overflow: hidden; border: 1px solid var(--home-line); background: var(--home-paper); }
.pe-field-thumb img { width: 100%; height: 100%; object-fit: cover; }
.pe-field-tag { position: absolute; left: 5px; bottom: 5px; display: inline-flex; align-items: center;
  gap: 3px; padding: 2px 7px; border-radius: 999px; font-size: 9.5px; letter-spacing: 0.04em;
  background: linear-gradient(135deg, var(--home-rose), var(--home-rose-deep)); color: #fff; }
.pe-field-actions { min-width: 0; flex: 1; }
.pe-field-name { font-size: 12.5px; color: var(--home-plum); word-break: break-all; margin-bottom: 10px; }
.pe-field-btns { display: flex; flex-wrap: wrap; gap: 8px; }
.pe-mini { padding: 8px 12px; font-size: 10px; border-radius: 11px; }
.pe-mini:hover { transform: none; }
.pe-danger { color: #a8506a; }
.pe-danger:hover { border-color: #c15f73; }

.pe-overlay { position: fixed; inset: 0; z-index: 120; display: flex;
  align-items: center; justify-content: center; padding: 16px;
  background: color-mix(in srgb, var(--home-plum) 55%, rgba(0,0,0,0.55));
  backdrop-filter: blur(6px); }
.pe-modal { width: 100%; max-width: 860px; max-height: 92vh; overflow: hidden;
  display: flex; flex-direction: column; border-radius: 22px; background: var(--home-paper);
  border: 1px solid var(--home-line-strong);
  box-shadow: 0 40px 90px -30px var(--home-shadow-strong); }

.pe-head { display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px; border-bottom: 1px solid var(--home-line); }
.pe-head-title { display: inline-flex; align-items: center; gap: 9px;
  font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 700;
  font-size: 20px; color: var(--home-plum); }
.pe-head-title svg { color: var(--home-rose-deep); }
.pe-close { padding: 8px; }

.pe-body { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 20px;
  padding: 20px; overflow: auto; }
@media (max-width: 720px) { .pe-body { grid-template-columns: minmax(0, 1fr); } }

.pe-stage { display: flex; flex-direction: column; align-items: center; gap: 10px;
  justify-content: center; }
.pe-frame { position: relative; overflow: hidden; border-radius: 12px; cursor: grab;
  touch-action: none; user-select: none;
  background:
    repeating-conic-gradient(var(--home-paper-2) 0% 25%, var(--home-paper) 0% 50%) 50% / 22px 22px;
  box-shadow: 0 0 0 1px var(--home-line-strong), 0 24px 50px -28px var(--home-shadow-strong); }
.pe-frame:active { cursor: grabbing; }
.pe-canvas { display: block; position: relative; z-index: 0; }
.pe-grid { position: absolute; inset: 0; pointer-events: none; z-index: 1;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.55); }
.pe-grid span { position: absolute; background: rgba(255,255,255,0.4); }
.pe-grid span:nth-child(1) { left: 33.33%; top: 0; bottom: 0; width: 1px; }
.pe-grid span:nth-child(2) { left: 66.66%; top: 0; bottom: 0; width: 1px; }
.pe-grid span:nth-child(3) { top: 33.33%; left: 0; right: 0; height: 1px; }
.pe-grid span:nth-child(4) { top: 66.66%; left: 0; right: 0; height: 1px; }
.pe-loading { position: absolute; inset: 0; display: flex; align-items: center;
  justify-content: center; font-size: 13px; color: var(--home-plum-soft); z-index: 2; }
.pe-hint { font-size: 11px; color: var(--home-plum-soft); text-align: center; }

.pe-controls { display: flex; flex-direction: column; gap: 16px; }
.pe-group { display: flex; flex-direction: column; gap: 9px; }
.pe-group-label { font-family: 'Marcellus', serif; font-size: 10px; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--home-gold); }
.pe-chips { display: flex; flex-wrap: wrap; gap: 7px; }
.pe-chip { padding: 7px 12px; border-radius: 10px; font-size: 11px; cursor: pointer;
  border: 1px solid var(--home-line); background: var(--home-paper-2); color: var(--home-plum);
  transition: all 0.18s; }
.pe-chip:hover { border-color: var(--home-rose); }
.pe-chip-active { background: linear-gradient(135deg, var(--home-rose), var(--home-rose-deep));
  color: #fff; border-color: transparent; }
.pe-tools { display: flex; gap: 8px; }
.pe-tool { display: inline-flex; align-items: center; justify-content: center; width: 42px;
  height: 40px; border-radius: 11px; cursor: pointer; border: 1px solid var(--home-line);
  background: var(--home-paper-2); color: var(--home-plum); transition: all 0.18s; }
.pe-tool:hover { border-color: var(--home-rose); color: var(--home-rose-deep); }
.pe-tool-active { background: linear-gradient(135deg, var(--home-rose), var(--home-rose-deep));
  color: #fff; border-color: transparent; }

.pe-slider { display: flex; flex-direction: column; gap: 6px; }
.pe-slider-top { display: flex; justify-content: space-between; font-size: 12px; color: var(--home-plum); }
.pe-slider-val { color: var(--home-plum-soft); font-variant-numeric: tabular-nums; }
.pe-slider input[type="range"] { -webkit-appearance: none; appearance: none; width: 100%; height: 5px;
  border-radius: 999px; background: var(--home-line); outline: none; }
.pe-slider input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none;
  width: 17px; height: 17px; border-radius: 50%; cursor: pointer; border: 2px solid #fff;
  background: var(--home-rose-deep); box-shadow: 0 2px 6px -1px var(--home-shadow-strong); }
.pe-slider input[type="range"]::-moz-range-thumb { width: 15px; height: 15px; border-radius: 50%;
  cursor: pointer; border: 2px solid #fff; background: var(--home-rose-deep); }

.pe-reset { align-self: flex-start; background: none; border: none; cursor: pointer; padding: 2px 0;
  font-family: 'Marcellus', serif; font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--home-plum-soft); text-decoration: underline; text-underline-offset: 3px; }
.pe-reset:hover { color: var(--home-rose-deep); }

.pe-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 15px 18px;
  border-top: 1px solid var(--home-line); background: var(--home-paper-2); }
`}</style>
  );
}
