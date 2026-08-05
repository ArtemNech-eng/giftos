"use client";

import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { Camera, Mic, VideoOff } from "lucide-react";

export function LiveKitRoom({ slug, isHost }: { slug: string; isHost: boolean }) {
  const videoRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<
    "connecting" | "connected" | "unavailable" | "error"
  >("connecting");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let room: Room | null = null;
    let cancelled = false;

    async function connect() {
      try {
        const response = await fetch(
          `/api/live/token?room=${encodeURIComponent(slug)}`,
        );
        if (response.status === 503) {
          if (!cancelled) setStatus("unavailable");
          return;
        }
        if (!response.ok) throw new Error("Не удалось подключиться к медиа-комнате.");
        const { token, url } = await response.json();
        room = new Room({ adaptiveStream: true, dynacast: true });
        const attachTrack = (track: { attach: () => HTMLMediaElement }) => {
          const element = track.attach();
          element.className = "size-full object-cover";
          videoRef.current?.replaceChildren(element);
        };
        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio)
            attachTrack(track);
        });
        await room.connect(url, token);
        if (isHost) {
          await room.localParticipant.enableCameraAndMicrophone();
          const publication = [
            ...room.localParticipant.videoTrackPublications.values(),
          ][0];
          if (publication?.videoTrack) attachTrack(publication.videoTrack);
        }
        if (!cancelled) setStatus("connected");
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(
            error instanceof Error ? error.message : "Ошибка видео-подключения.",
          );
        }
      }
    }
    void connect();
    return () => {
      cancelled = true;
      void room?.disconnect();
    };
  }, [isHost, slug]);

  if (status === "unavailable") {
    return (
      <div className="grid aspect-video place-items-center bg-gradient-to-br from-[#3b193d] via-[#1f1a38] to-[#151a2c] text-center">
        <div>
          <VideoOff className="mx-auto size-10 text-[#ff5b99]" />
          <p className="mt-3 text-sm font-bold">Видео подключается</p>
          <p className="mt-1 max-w-xs text-xs text-[#b9b1c5]">
            Комната и чат уже работают. Media server будет подключён в
            production-контуре.
          </p>
        </div>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="grid aspect-video place-items-center bg-[#211722] p-5 text-center">
        <div>
          <VideoOff className="mx-auto size-9 text-[#ff9bc5]" />
          <p className="mt-3 text-sm font-bold">Не удалось подключить видео</p>
          <p className="mt-1 text-xs text-[#c3b9c9]">{errorMessage}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="relative aspect-video bg-[#151722]">
      <div className="size-full" ref={videoRef} />
      {status === "connecting" && (
        <div className="absolute inset-0 grid place-items-center text-sm text-[#cfc6d8]">
          <span className="inline-flex items-center gap-2">
            <Camera className="size-4" /> Подключаем видео…
          </span>
        </div>
      )}
      {isHost && status === "connected" && (
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs">
          <Mic className="size-3" /> Вы в эфире
        </span>
      )}
    </div>
  );
}
