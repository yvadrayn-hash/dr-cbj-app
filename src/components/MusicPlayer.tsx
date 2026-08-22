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

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.25);
  const [ready, setReady] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ left: "auto", right: "auto", bottom: "auto" });
  const dragStartRef = useRef({ x: 0, y: 0, left: 0, right: 0 });

  // Load saved position on mount (desktop: right, mobile: left)
  useEffect(() => {
    const savedPosition = localStorage.getItem(POSITION_KEY);
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        setPosition(pos);
      } catch {
        // Invalid position data, use defaults
      }
    }
  }, []);

  // Save position on change (debounced slightly via effect dependency)
  useEffect(() => {
    if (isDragging) return; // Don't save while dragging
    localStorage.setItem(POSITION_KEY, JSON.stringify(position));
  }, [position, isDragging]);

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

    setIsPlaying(
      savedPlayState === null ? true : savedPlayState === "true"
    );

    setMinimized(
      savedMinimizedState === null
        ? window.innerWidth < 640
        : savedMinimizedState === "true"
    );
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
      const playCurrentTrack = () => {
        audio.play().catch(() => {});
      };

      if (audio.readyState >= 2) {
        playCurrentTrack();
      } else {
        audio.addEventListener("canplay", playCurrentTrack, {
          once: true,
        });
      }
    }
  }, [trackIndex, ready]);

  useEffect(() => {
    if (!ready) return;

    const audio = audioRef.current;
    if (!audio) return;

    localStorage.setItem(PLAY_KEY, String(isPlaying));

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, ready]);

  useEffect(() => {
    function startOnFirstInteraction() {
      const audio = audioRef.current;
      if (!audio) return;

      if (localStorage.getItem(PLAY_KEY) === "false") {
        window.removeEventListener("pointerdown", startOnFirstInteraction);
        window.removeEventListener("keydown", startOnFirstInteraction);
        return;
      }

      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          localStorage.setItem(PLAY_KEY, "true");

          window.removeEventListener("pointerdown", startOnFirstInteraction);
          window.removeEventListener("keydown", startOnFirstInteraction);
        })
        .catch(() => {});
    }

    window.addEventListener("pointerdown", startOnFirstInteraction);
    window.addEventListener("keydown", startOnFirstInteraction);

    return () => {
      window.removeEventListener("pointerdown", startOnFirstInteraction);
      window.removeEventListener("keydown", startOnFirstInteraction);
    };
  }, []);

  function togglePlay() {
    setIsPlaying((current) => !current);
  }

  function nextTrack() {
    setTrackIndex((current) => (current + 1) % tracks.length);
  }

  function previousTrack() {
    setTrackIndex((current) =>
      current === 0 ? tracks.length - 1 : current - 1
    );
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

  // Drag handling with pointer events
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only drag with left mouse button or touch
    if (e.button !== 0 && e.pointerType !== "touch") return;
    if (minimized) return; // Can't drag when minimized

    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);

    // Store initial pointer position and current element position
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: rect.left,
      right: rect.right,
    };
  }, [minimized]);

  useEffect(() => {
    if (!isDragging) return;

    function handlePointerMove(e: PointerEvent) {
      const dx = e.clientX - dragStartRef.current.x;
      const newLeft = dragStartRef.current.left + dx;

      // Constrain to viewport with padding
      const padding = 16;
      const containerWidth = window.innerWidth;
      const playerWidth = 100; // Approximate player width in px

      const constrainedLeft = Math.max(padding, Math.min(newLeft, containerWidth - playerWidth - padding));

      setPosition({
        left: `${constrainedLeft}px`,
        right: "auto",
        bottom: "auto",
      });
    }

    function handlePointerUp() {
      setIsDragging(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  // Set initial position based on screen size if not manually positioned
  useEffect(() => {
    if (position.left === "auto" && position.right === "auto") {
      if (window.innerWidth < 640) {
        setPosition({ left: "16px", right: "auto", bottom: "auto" });
      } else {
        setPosition({ right: "20px", bottom: "20px", left: "auto" });
      }
    }
  }, [position.left, position.right]);

  if (!ready) {
    return null;
  }

  // Get the active position style
  const positionStyle: React.CSSProperties = {};
  if (position.left !== "auto") {
    positionStyle.left = position.left;
  }
  if (position.right !== "auto") {
    positionStyle.right = position.right;
  }
  if (position.bottom !== "auto") {
    positionStyle.bottom = position.bottom;
  }

  return (
    <div className="pointer-events-none fixed z-50" style={positionStyle}>
      <audio
        ref={audioRef}
        preload="metadata"
        onEnded={handleEnded}
      />

      {minimized ? (
        <button
          type="button"
          onPointerDown={(e) => handlePointerDown(e as React.PointerEvent)}
          onClick={(e) => {
            // Prevent drag when clicking quickly to open
            if (!isDragging) {
              e.stopPropagation();
              toggleMinimized();
            }
          }}
          className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full border border-teal-100 bg-white/95 text-2xl shadow-2xl backdrop-blur-xl transition hover:scale-105 hover:bg-teal-50 cursor-grab active:cursor-grabbing"
          aria-label={isDragging ? "Drag music player" : "Open music player"}
          title={`Now Playing: ${tracks[trackIndex].title}`}
        >
          {"\u{1F3B5}"}

          {isPlaying && (
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-teal-500" />
          )}
        </button>
      ) : (
        <div 
          className="pointer-events-auto w-full rounded-3xl border border-teal-100/80 bg-white/95 px-3 py-3 shadow-2xl backdrop-blur-xl sm:w-auto sm:min-w-[330px] sm:px-4 cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
        >
          <div className="mb-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-600">
                Now Playing
              </p>

              <p className="truncate text-sm font-semibold text-teal-900">
                {tracks[trackIndex].title}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 items-end gap-1">
                {[0, 1, 2, 3].map((bar) => (
                  <span
                    key={bar}
                    className={`w-1 rounded-full bg-teal-500 ${
                      isPlaying ? "animate-music-bar" : ""
                    }`}
                    style={{
                      height: `${10 + bar * 4}px`,
                      animationDelay: `${bar * 120}ms`,
                    }}
                  />
                ))}
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
              <span className="text-xs font-medium text-gray-500">
                {trackIndex + 1}/{tracks.length}
              </span>

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
