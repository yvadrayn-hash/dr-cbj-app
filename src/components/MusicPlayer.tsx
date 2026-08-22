"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const tracks = [
  { src: "/assets/Dr. CBJ App Music 1.mp3", title: "Calm Welcome" },
  { src: "/assets/Dr. CBJ App Music 2.mp3", title: "Quiet Reflection" },
  { src: "/assets/Dr. CBJ App Music 3.mp3", title: "Gentle Hope" },
  { src: "/assets/Dr. CBJ App Music 4.mp3", title: "Still Waters" },
  { src: "/assets/Dr. CBJ App Music 5.mp3", title: "New Day" },
  { src: "/assets/Dr. CBJ App Music 6.mp3", title: "Serenity" },
  { src: "/assets/Dr. CBJ App Music 7.mp3", title: "Peaceful Moments" },
  { src: "/assets/Dr. CBJ App Music 8.mp3", title: "Soft Horizons" },
];

const TRACK_KEY = "drcbj-music-track";
const PLAY_KEY = "drcbj-music-playing";
const VOLUME_KEY = "drcbj-music-volume";
const MINIMIZED_KEY = "drcbj-music-minimized";
const POSITION_KEY = "drcbj-music-position";
const POSITION_X_KEY = "drcbj-music-pos-x";
const POSITION_Y_KEY = "drcbj-music-pos-y";

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.25);
  const [ready, setReady] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // Position as pixel values
  const [position, setPosition] = useState({ left: 16, top: 16 });
  const dragStartRef = useRef({ x: 0, y: 0, left: 0, top: 0 });
  const isDraggingRef = useRef(false);
  const dragThreshold = 8;
  const dragDistanceRef = useRef(0);

  // Load position on mount
  useEffect(() => {
    const savedX = localStorage.getItem(POSITION_X_KEY);
    const savedY = localStorage.getItem(POSITION_Y_KEY);

    let defaultLeft = 16;
    let defaultTop = 16;

    if (window.innerWidth >= 640) {
      defaultLeft = window.innerWidth - 100 - 20;
      defaultTop = window.innerHeight - 60 - 20;
    } else {
      defaultLeft = 16;
      defaultTop = window.innerHeight - 60 - 20;
    }

    if (savedX !== null && savedY !== null) {
      const x = parseFloat(savedX);
      const y = parseFloat(savedY);
      if (!Number.isNaN(x) && !Number.isNaN(y)) {
        defaultLeft = x;
        defaultTop = y;
      }
    }

    setPosition({ left: defaultLeft, top: defaultTop });
    setReady(true);
  }, []);

  // Save position when not dragging
  useEffect(() => {
    if (isDraggingRef.current) return;
    localStorage.setItem(POSITION_KEY, JSON.stringify(position));
    localStorage.setItem(POSITION_X_KEY, String(position.left));
    localStorage.setItem(POSITION_Y_KEY, String(position.top));
  }, [position]);

  // Load persisted music settings
  useEffect(() => {
    const savedTrack = Number(localStorage.getItem(TRACK_KEY));
    const savedVolume = Number(localStorage.getItem(VOLUME_KEY));
    const savedPlayState = localStorage.getItem(PLAY_KEY);
    const savedMinimizedState = localStorage.getItem(MINIMIZED_KEY);

    if (
      Number.isInteger(savedTrack) &&
      savedTrack >= 0 &&
      savedTrack < tracks.length
    ) {
      setTrackIndex(savedTrack);
    }

    if (
      !Number.isNaN(savedVolume) &&
      savedVolume > 0 &&
      savedVolume <= 1
    ) {
      setVolume(savedVolume);
    } else {
      setVolume(0.25);
      localStorage.setItem(VOLUME_KEY, "0.25");
    }

    setIsPlaying(savedPlayState === null ? true : savedPlayState === "true");

    setMinimized(savedMinimizedState === null ? window.innerWidth < 640 : savedMinimizedState === "true");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    localStorage.setItem(VOLUME_KEY, String(volume));
  }, [volume, ready]);

  useEffect(() => {
    if (!ready) return;
    const audio = audioRef.current;
    if (!audio) return;
    localStorage.setItem(TRACK_KEY, String(trackIndex));
    audio.src = tracks[trackIndex].src;
    audio.load();
    if (isPlaying) {
      const playCurrentTrack = () => audio.play().catch(() => {});
      if (audio.readyState >= 2) playCurrentTrack();
      else audio.addEventListener("canplay", playCurrentTrack, { once: true });
    }
  }, [trackIndex, ready]);

  useEffect(() => {
    if (!ready) return;
    const audio = audioRef.current;
    if (!audio) return;
    localStorage.setItem(PLAY_KEY, String(isPlaying));
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying, ready]);

  useEffect(() => {
    function startOnFirstInteraction() {
      const audio = audioRef.current;
      if (!audio || localStorage.getItem(PLAY_KEY) === "false") {
        window.removeEventListener("pointerdown", startOnFirstInteraction);
        window.removeEventListener("keydown", startOnFirstInteraction);
        return;
      }
      audio.play().then(() => {
        setIsPlaying(true);
        localStorage.setItem(PLAY_KEY, "true");
        window.removeEventListener("pointerdown", startOnFirstInteraction);
        window.removeEventListener("keydown", startOnFirstInteraction);
      }).catch(() => {});
    }
    window.addEventListener("pointerdown", startOnFirstInteraction);
    window.addEventListener("keydown", startOnFirstInteraction);
    return () => {
      window.removeEventListener("pointerdown", startOnFirstInteraction);
      window.removeEventListener("keydown", startOnFirstInteraction);
    };
  }, []);

  // Re-clamp position on viewport resize
  useEffect(() => {
    function handleResize() {
      const padding = 16;
      const viewportWidth = window.visualViewport?.width || window.innerWidth;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;

      const playerWidth = minimized ? 56 : 330;
      const playerHeight = minimized ? 56 : 60;

      setPosition((prev) => ({
        left: Math.min(Math.max(prev.left, padding), Math.max(padding, viewportWidth - playerWidth - padding)),
        top: Math.min(Math.max(prev.top, padding), Math.max(padding, viewportHeight - playerHeight - padding)),
      }));
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [minimized]);

  function togglePlay() {
    setIsPlaying((current) => !current);
  }

  function nextTrack() {
    setTrackIndex((current) => (current + 1) % tracks.length);
  }

  function previousTrack() {
    setTrackIndex((current) => (current === 0 ? tracks.length - 1 : current - 1));
  }

  function handleEnded() {
    setTrackIndex((current) => (current + 1) % tracks.length);
  }

  function toggleMinimized() {
    setMinimized((current) => {
      const next = !current;
      localStorage.setItem(MINIMIZED_KEY, String(next));
      return next;
    });
  }

  // Expand-mode drag handlers - only on the drag handle, prevents propagation to controls
  const handleDragStart = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    if (e.button !== 0 && e.pointerType !== "touch") return;

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    dragStartRef.current = { x: e.clientX, y: e.clientY, left: position.left, top: position.top };
    dragDistanceRef.current = 0;
    isDraggingRef.current = false;
  }, [position.left, position.top]);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    if (!dragStartRef.current.left) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (!isDraggingRef.current && distance > dragThreshold) {
      isDraggingRef.current = true;
    }

    if (isDraggingRef.current) {
      const newLeft = dragStartRef.current.left + dx;
      const newTop = dragStartRef.current.top + dy;

      const padding = 16;
      const playerWidth = 330;
      const playerHeight = 60;

      const viewportWidth = window.visualViewport?.width || window.innerWidth;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;

      setPosition({
        left: Math.max(padding, Math.min(newLeft, viewportWidth - playerWidth - padding)),
        top: Math.max(padding, Math.min(newTop, viewportHeight - playerHeight - padding)),
      });
      e.preventDefault();
    } else {
      dragDistanceRef.current = distance;
    }
  }, []);

  const handleDragEnd = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);
    dragStartRef.current = { x: 0, y: 0, left: 0, top: 0 };
    isDraggingRef.current = false;
    dragDistanceRef.current = 0;
  }, []);

  if (!ready) return null;

  return (
    <div className="pointer-events-none fixed z-50" style={{ left: position.left, top: position.top }}>
      <audio ref={audioRef} preload="metadata" onEnded={handleEnded} />

      {minimized ? (
        <button
          type="button"
          onClick={(e) => {
            if (!isDraggingRef.current) {
              e.stopPropagation();
              toggleMinimized();
            }
          }}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-teal-100 bg-white/95 text-2xl shadow-2xl backdrop-blur-xl transition hover:scale-105 hover:bg-teal-50 cursor-grab active:cursor-grabbing"
          aria-label={isDraggingRef.current ? "Drag music player" : "Open music player"}
          title={`Now Playing: ${tracks[trackIndex].title}`}
        >
          {"\u{1F3B5}"}
          {isPlaying && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-teal-500" />}
        </button>
      ) : (
        <div
          className="pointer-events-auto w-full rounded-3xl border border-teal-100/80 bg-white/95 px-3 py-3 shadow-2xl backdrop-blur-xl sm:w-auto sm:min-w-[330px] sm:px-4"
          style={{ touchAction: "none", WebkitUserSelect: "none" }}
        >
          {/* Drag handle */}
          <div
            className="mb-3 flex items-start justify-between gap-4 cursor-grab active:cursor-grabbing"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-600">Now Playing</p>
              <p className="truncate text-sm font-semibold text-teal-900">{tracks[trackIndex].title}</p>
            </div>

            <button
              type="button"
              onClick={toggleMinimized}
              className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-gray-400 transition hover:bg-gray-100 hover:text-teal-700"
              aria-label="Minimize music player"
              title="Minimize"
            >
              {"\u2212"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={previousTrack}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-100 bg-white text-teal-700 hover:bg-teal-50"
              aria-label="Previous track"
            >
              {"\u23EE"}
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-md transition hover:scale-105"
              aria-label={isPlaying ? "Pause music" : "Play music"}
            >
              {isPlaying ? "\u23F8" : "\u25B6"}
            </button>

            <button
              type="button"
              onClick={nextTrack}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-100 bg-white text-teal-700 hover:bg-teal-50"
              aria-label="Next track"
            >
              {"\u23ED"}
            </button>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">{trackIndex + 1}/{tracks.length}</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-16 accent-teal-600 sm:w-20"
                aria-label="Music volume"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}