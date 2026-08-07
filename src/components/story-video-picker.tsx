"use client";

import { useRef, useState } from "react";
import { Camera, Images, RefreshCcw, Video } from "lucide-react";

/**
 * Story video picker: shoot with the camera (capture input) or pick from the
 * gallery, with a preview and the ability to replace the clip. Both inputs
 * share the `video` field name; an empty file input is never included in
 * FormData, so exactly one clip reaches the server action.
 */
export function StoryVideoPicker() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setFileName(file.name);
  }

  function reset() {
    if (captureRef.current) captureRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
    setPreviewUrl(null);
    setFileName(null);
  }

  if (previewUrl) {
    return (
      <div className="mt-4">
        <video
          className="aspect-[9/16] max-h-80 w-full rounded-2xl border border-[#cdbbe7] bg-black object-contain"
          controls
          src={previewUrl}
        />
        <p className="mt-1.5 truncate text-[10px] text-[#8a7d91]">{fileName}</p>
        <button
          className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-[#2c2036]/10 bg-[#fbf9fe] px-3 py-2 text-[10px] font-black text-[#5f5369] transition hover:bg-[#f0e9ff]"
          onClick={reset}
          type="button"
        >
          <RefreshCcw className="size-3.5" /> Снять или выбрать другое
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-2.5">
        <button
          className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#cdbbe7] bg-[#fbf9fe] px-3 py-5 text-[#7549d0] transition hover:bg-[#f6efff]"
          onClick={() => captureRef.current?.click()}
          type="button"
        >
          <Camera className="size-6" />
          <span className="text-[10px] font-black">Снять видео</span>
          <span className="text-[9px] leading-4 text-[#8a7d91]">Открыть камеру</span>
        </button>
        <button
          className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#cdbbe7] bg-[#fbf9fe] px-3 py-5 text-[#7549d0] transition hover:bg-[#f6efff]"
          onClick={() => galleryRef.current?.click()}
          type="button"
        >
          <Images className="size-6" />
          <span className="text-[10px] font-black">Из галереи</span>
          <span className="text-[9px] leading-4 text-[#8a7d91]">Выбрать готовое</span>
        </button>
      </div>

      <input
        ref={captureRef}
        accept="video/mp4,video/webm"
        capture="environment"
        className="sr-only"
        name="video"
        onChange={handleFile}
        type="file"
      />
      <input
        ref={galleryRef}
        accept="video/mp4,video/webm"
        className="sr-only"
        name="video"
        onChange={handleFile}
        type="file"
      />

      <p className="mt-3 flex items-center gap-1.5 text-[9px] text-[#8a7d91]">
        <Video className="size-3" /> MP4 или WebM, до 50 МБ. Вертикальный формат
        смотрится лучше.
      </p>
    </div>
  );
}
