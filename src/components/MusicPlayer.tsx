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
  // Store position as pixel values for dragging
  const [position, setPosition] = useState({ left: "auto", right: "auto", bottom: "auto" });
  // Store raw pixel values for calculations
  const positionRef = useRef({ left: 16, right: 20, bottom: 20 });
  // Refs for tracking actual rendered dimensions
  // We track the expanded player div specifically since it's wider
  const playerRef = useRef<HTMLDivElement | null>(null);
  const playerDimensionsRef = useRef({ width: 0, height: 0 });
  const dragStartRef = useRef({ x: 0, y: 0, left: 0, bottom: 0, pointerId: -1 });
  // Threshold in pixels to distinguish tap from drag
  const DRAG_THRESHOLD = 8;
  const dragDistanceRef = useRef(0);
  const isExpandedRef = useRef(false);

  // Load saved position on mount (desktop: right, mobile: left)
  useEffect(() => {
    const savedPosition = localStorage.getItem(POSITION_KEY);
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        setPosition(pos);
        // Restore raw values for dragging calculations
        if (pos.left !== "auto") {
          positionRef.current.left = parseFloat(pos.left);
        }
        if (pos.bottom !== "auto") {
          positionRef.current.bottom = parseFloat(pos.bottom);
        }
        // Store dimensions from saved position if available
        if (pos.left !== "auto" && pos.right === "auto") {
          // Left positioning was used - expand player to measure
          setTimeout(() => {
            if (playerRef.current) {
              const rect = playerRef.current.getBoundingClientRect();
              playerDimensionsRef.current = { width: rect.width, height: rect.height };
            }
          }, 0);
        }
      } catch {
        // Invalid position data, use defaults
      }
    }
    // Set initial defaults
  }, []);

  // Measure player dimensions when toggling minimized state or after mount
  useEffect(() => {
    if (!playerRef.current) return;

    const rect = playerRef.current.getBoundingClientRect();
    playerDimensionsRef.current = { width: rect.width, height: rect.height };
    isExpandedRef.current = !minimized;

    // Re-clamp position based on new dimensions
    reClampPosition(rect.width, rect.height);
  }, [minimized]);

  // Save position on change (debounced slightly via effect dependency)
  useEffect(() => {
    if (isDragging) return; // Don't save while dragging
    localStorage.setItem(POSITION_KEY, JSON.stringify(position));
    // Sync raw values from position state
    if (position.left !== "auto") {
      positionRef.current.left = parseFloat(position.left);
    }
    if (position.bottom !== "auto") {
      positionRef.current.bottom = parseFloat(position.bottom);
    }
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

  // Re-clamp position when dimensions change to prevent going off-screen
  const reClampPosition = useCallback((playerWidth: number, playerHeight: number) => {
    if (position.left === "auto" && position.right === "auto") return;

    const padding = 16;
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;

    // Safe clamping - bounds should never be invalid
    const safeX = position.left !== "auto" 
      ? Math.max(padding, Math.min(parseFloat(position.left), containerWidth - playerWidth - padding))
      : parseFloat(position.right);

    const safeY = position.bottom !== "auto"
      ? Math.max(padding, Math.min(parseFloat(position.bottom), containerHeight - playerHeight - padding))
      : 0;

    if (position.left !== "auto") {
      setPosition(prev => ({
        ...prev,
        left: `${Math.max(padding, Math.min(parseFloat(prev.left), containerWidth - playerWidth - padding))}px`,
      }));
    }
    if (position.bottom !== "auto") {
      setPosition(prev => ({
        ...prev,
        bottom: `${Math.max(padding, Math.min(parseFloat(prev.bottom), containerHeight - playerHeight - padding))}px`,
      }));
    }
  }, [position.left, position.bottom]);

  function toggleMinimized() {
    setMinimized((current) => {
      const next = !current;
      localStorage.setItem(MINIMIZED_KEY, String(next));
      return next;
    });
    // Note: useEffect will re-clamp after render
  }

  // Drag handling with pointer events - uses actual player dimensions
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only drag with left mouse button or touch
    if (e.button !== 0 && e.pointerType !== "touch") return;

    // Capture pointer to ensure we receive all move/up events
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    // Store pointer ID
    dragStartRef.current.pointerId = e.pointerId;

    // Get actual rendered dimensions
    const rect = playerRef.current?.getBoundingClientRect() || target.getBoundingClientRect();
    const playerWidth = rect.width;
    const playerHeight = rect.height;

    // Store initial pointer position and current element position
    const currentLeft = positionRef.current.left;
    const currentBottom = positionRef.current.bottom;

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: currentLeft,
      bottom: currentBottom,
      pointerId: e.pointerId,
    };

    // Store actual dimensions for this drag session
    playerDimensionsRef.current = { width: playerWidth, height: playerHeight };

    // Reset drag distance counter - only count as drag after threshold
    dragDistanceRef.current = 0;

    // Don't set dragging=true yet - we need to check if it's a drag or tap
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Only track movement if we have a pointer ID from pointerdown
    if (dragStartRef.current.pointerId !== e.pointerId) return;

    // Calculate distance moved
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if we've moved beyond threshold to start dragging
    if (!isDragging && distance > DRAG_THRESHOLD) {
      setIsDragging(true);
      // Now that we're dragging, prevent further page scroll
      e.preventDefault();
    }

    if (isDragging) {
      const newLeft = dragStartRef.current.left + dx;
      const newBottom = dragStartRef.current.bottom - dy; // Inverted Y for bottom positioning

      // Get actual player dimensions
      const playerWidth = playerDimensionsRef.current.width || playerRef.current?.getBoundingClientRect().width || 330;
      const playerHeight = playerDimensionsRef.current.height || playerRef.current?.getBoundingClientRect().height || 60;

      // Constrain to viewport with safe clamping
      const padding = 16;
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;

      // Safe bounds - never become invalid
      const minX = padding;
      const maxX = Math.max(padding, containerWidth - playerWidth - padding);
      const minY = padding;
      const maxY = Math.max(padding, containerHeight - playerHeight - padding);

      const constrainedLeft = Math.min(Math.max(newLeft, minX), maxX);
      const constrainedBottom = Math.min(Math.max(newBottom, minY), maxY);

      setPosition({
        left: `${constrainedLeft}px`,
        right: "auto",
        bottom: `${constrainedBottom}px`,
      });
    } else {
      // Track distance even before drag starts
      dragDistanceRef.current = distance;
    }
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    // Only handle if this is our captured pointer
    if (dragStartRef.current.pointerId !== e.pointerId) return;

    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);

    // Reset pointer ID
    dragStartRef.current.pointerId = -1;

    // If we didn't drag beyond threshold, it was a tap - allow click behavior
    if (!isDragging && dragDistanceRef.current <= DRAG_THRESHOLD) {
      // This was a tap, not a drag - let click handler operate
      // Don't stop propagation here, let the click propagate
    }

    setIsDragging(false);
    dragDistanceRef.current = 0;
  }, [isDragging]);

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    // Handle cancellation (e.g., touch cancel)
    if (dragStartRef.current.pointerId !== e.pointerId) return;

    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);

    dragStartRef.current.pointerId = -1;
    setIsDragging(false);
    dragDistanceRef.current = 0;
  }, []);

  // Global pointer move/up/cancel handlers - these handle the drag outside the element
  useEffect(() => {
    if (!isDragging) return;

    // Get actual player dimensions
    const playerWidth = playerDimensionsRef.current.width || playerRef.current?.getBoundingClientRect().width || 330;
    const playerHeight = playerDimensionsRef.current.height || playerRef.current?.getBoundingClientRect().height || 60;

    // Window-level handlers to catch movements even outside the element
    function onWindowPointerMove(e: PointerEvent) {
      if (dragStartRef.current.pointerId !== e.pointerId) return;
      if (e.buttons === 0 && e.type !== "pointermove") return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const newLeft = dragStartRef.current.left + dx;
      const newBottom = dragStartRef.current.bottom - dy;

      // Constrain to viewport with safe bounds
      const padding = 16;
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;

      // Safe clamping - bounds should never be invalid
      const minX = padding;
      const maxX = Math.max(padding, containerWidth - playerWidth - padding);
      const minY = padding;
      const maxY = Math.max(padding, containerHeight - playerHeight - padding);

      const constrainedLeft = Math.min(Math.max(newLeft, minX), maxX);
      const constrainedBottom = Math.min(Math.max(newBottom, minY), maxY);

      setPosition({
        left: `${constrainedLeft}px`,
        right: "auto",
        bottom: `${constrainedBottom}px`,
      });
    }

    function onWindowPointerUp(e: PointerEvent) {
      if (dragStartRef.current.pointerId !== e.pointerId) return;

      const target = playerRef.current;
      if (target) target.releasePointerCapture(e.pointerId);

      dragStartRef.current.pointerId = -1;
      setIsDragging(false);
      dragDistanceRef.current = 0;
    }

    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerUp);
    };
  }, [isDragging, playerRef, playerDimensionsRef]);

  // Synce positionRef with position state when not dragging
  useEffect(() => {
    if (isDragging) return;
    if (position.left !== "auto") {
      positionRef.current.left = parseFloat(position.left);
    }
    if (position.bottom !== "auto") {
      positionRef.current.bottom = parseFloat(position.bottom);
    }
  }, [position.left, position.bottom, isDragging]);

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
          style={{ touchAction: "none" }}
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
          ref={playerRef}
          className="pointer-events-auto w-full rounded-3xl border border-teal-100/80 bg-white/95 px-3 py-3 shadow-2xl backdrop-blur-xl sm:w-auto sm:min-w-[330px] sm:px-4 cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
        >
          {/* Drag handle - only this section drags the player */}
          <div 
            className="mb-3 flex items-start justify-between gap-4 cursor-grab active:cursor-grabbing"
            style={{ touchAction: "none" }}
            onPointerDown={handlePointerDown}
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
