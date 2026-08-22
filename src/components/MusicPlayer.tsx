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

  // Canonical position using left/top (x, y in pixels from top-left)
  const [position, setPosition] = useState({ left: 16, top: 16 });

  // Refs for drag state and measurements - use any to handle both div and button
  const playerRef = useRef<any | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0, left: 0, top: 0, pointerId: -1 });
  const isDraggingRef = useRef(false);
  const dragThreshold = 8;
  const dragDistanceRef = useRef(0);

  // Load position on mount
  useEffect(() => {
    const savedX = localStorage.getItem(POSITION_X_KEY);
    const savedY = localStorage.getItem(POSITION_Y_KEY);
    const savedPos = localStorage.getItem(POSITION_KEY);

    let defaultLeft = 16;
    let defaultTop = 16;

    // Desktop default (bottom-right)
    if (window.innerWidth >= 640) {
      defaultLeft = window.innerWidth - 100 - 20; // width + padding
      defaultTop = window.innerHeight - 60 - 20; // height + padding
    } else {
      // Mobile default (bottom-left)
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
    } else if (savedPos) {
      try {
        const pos = JSON.parse(savedPos);
        // Convert left/bottom positioning to x/y
        if (pos.left !== "auto") {
          defaultLeft = parseFloat(pos.left);
        }
        if (pos.bottom !== "auto") {
          // bottom = distance from bottom, convert to top = viewportHeight - bottom - playerHeight
          const playerHeight = 60;
          defaultTop = window.innerHeight - playerHeight - parseFloat(pos.bottom);
        }
      } catch {
        // Invalid position data
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

  // Re-clamp position on viewport resize (rotation, etc.)
  useEffect(() => {
    function handleResize() {
      const padding = 16;
      const playerWidth = playerRef.current
        ? playerRef.current.getBoundingClientRect().width
        : minimized
        ? 56
        : 330;
      const playerHeight = playerRef.current
        ? playerRef.current.getBoundingClientRect().height
        : minimized
        ? 56
        : 60;

      const viewportWidth = window.visualViewport?.width || window.innerWidth;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;

      const maxX = Math.max(padding, viewportWidth - playerWidth - padding);
      const maxY = Math.max(padding, viewportHeight - playerHeight - padding);

      setPosition((prev) => ({
        left: Math.min(Math.max(prev.left, padding), maxX),
        top: Math.min(Math.max(prev.top, padding), maxY),
      }));
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    // Initial clamping on mount
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

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only drag with left mouse button or touch
    if (e.button !== 0 && e.pointerType !== "touch") return;

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    // Record pointer ID
    dragStartRef.current.pointerId = e.pointerId;

    // Record start position
    dragStartRef.current.x = e.clientX;
    dragStartRef.current.y = e.clientY;

    // Record current player position
    dragStartRef.current.left = position.left;
    dragStartRef.current.top = position.top;

    // Reset drag distance
    dragDistanceRef.current = 0;
    isDraggingRef.current = false;

    e.preventDefault();
    e.stopPropagation();
  }, [position.left, position.top]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Only track our pointer
    if (dragStartRef.current.pointerId !== e.pointerId) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Start drag only after threshold
    if (!isDraggingRef.current && distance > dragThreshold) {
      isDraggingRef.current = true;
      e.preventDefault();
    }

    if (isDraggingRef.current) {
      // Calculate new position
      const newLeft = dragStartRef.current.left + dx;
      const newTop = dragStartRef.current.top + dy;

      // Get actual dimensions
      const padding = 16;
      const playerWidth = playerRef.current
        ? playerRef.current.getBoundingClientRect().width
        : 330;
      const playerHeight = playerRef.current
        ? playerRef.current.getBoundingClientRect().height
        : 60;

      const viewportWidth = window.visualViewport?.width || window.innerWidth;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;

      // Safe clamping
      const minX = padding;
      const maxX = Math.max(padding, viewportWidth - playerWidth - padding);
      const minY = padding;
      const maxY = Math.max(padding, viewportHeight - playerHeight - padding);

      setPosition({
        left: Math.min(Math.max(newLeft, minX), maxX),
        top: Math.min(Math.max(newTop, minY), maxY),
      });

      e.preventDefault();
    } else {
      dragDistanceRef.current = distance;
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (dragStartRef.current.pointerId !== e.pointerId) return;

    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);

    dragStartRef.current.pointerId = -1;
    isDraggingRef.current = false;
    dragDistanceRef.current = 0;
  }, []);

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    if (dragStartRef.current.pointerId !== e.pointerId) return;

    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);

    dragStartRef.current.pointerId = -1;
    isDraggingRef.current = false;
    dragDistanceRef.current = 0;
  }, []);

  if (!ready) {
    return null;
  }

  const playerWidth = minimized ? 56 : 330;
  const playerHeight = minimized ? 56 : 60;

  return (
    <div className="pointer-events-none fixed z-50" style={{ left: position.left, top: position.top }}>
      <audio
        ref={audioRef}
        preload="metadata"
        onEnded={handleEnded}
      />

      {minimized ? (
        <button
          ref={playerRef as React.RefObject<HTMLButtonElement>}
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onClick={(e) => {
            if (!isDraggingRef.current) {
              e.stopPropagation();
              toggleMinimized();
            }
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-teal-100 bg-white/95 text-2xl shadow-2xl backdrop-blur-xl transition hover:scale-105 hover:bg-teal-50 cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none", WebkitUserSelect: "none" }}
          aria-label={isDraggingRef.current ? "Drag music player" : "Open music player"}
          title={`Now Playing: ${tracks[trackIndex].title}`}
        >
          {"\u{1F3B5}"}

          {isPlaying && (
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-teal-500" />
          )}
        </button>
      ) : (
        <div
          ref={playerRef}
          className="rounded-3xl border border-teal-100/80 bg-white/95 px-3 py-3 shadow-2xl backdrop-blur-xl sm:w-auto sm:min-w-[330px] sm:px-4"
          style={{
            touchAction: "none",
            WebkitUserSelect: "none",
            maxWidth: "calc(100vw - 32px)",
          }}
        >
          {/* Drag handle - only this section drags the player */}
          <div
            className="mb-3 flex items-start justify-between gap-4 cursor-grab active:cursor-grabbing"
            style={{ touchAction: "none", WebkitUserSelect: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
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
                style={{ touchAction: "auto", WebkitUserSelect: "auto" }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
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
              style={{ touchAction: "auto", WebkitUserSelect: "auto" }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              {"\u23EE"}
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-md transition hover:scale-105"
              aria-label={isPlaying ? "Pause music" : "Play music"}
              style={{ touchAction: "auto", WebkitUserSelect: "auto" }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              {isPlaying ? "\u23F8" : "\u25B6"}
            </button>

            <button
              type="button"
              onClick={nextTrack}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-100 bg-white text-teal-700 hover:bg-teal-50"
              aria-label="Next track"
              style={{ touchAction: "auto", WebkitUserSelect: "auto" }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
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
                style={{ touchAction: "auto", WebkitUserSelect: "auto" }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}