import { useEffect, useRef, useState, useCallback } from 'react';
import { Play } from 'lucide-react';

/* ── YouTube IFrame API types ── */

interface YTPlayerEvent {
  data: number;
  target: YTPlayerInstance;
}

interface YTPlayerInstance {
  destroy: () => void;
  getIframe: () => HTMLIFrameElement;
}

interface YTPlayerConstructor {
  new (
    elementId: string | HTMLElement,
    config: {
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: YTPlayerEvent) => void;
        onError?: (event: YTPlayerEvent) => void;
        onStateChange?: (event: YTPlayerEvent) => void;
      };
    }
  ): YTPlayerInstance;
}

interface YTNamespace {
  Player: YTPlayerConstructor;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/* ── URL detection ── */

type VideoSource =
  | { type: 'youtube'; videoId: string }
  | { type: 'bunny'; embedUrl: string }
  | { type: 'unknown'; url: string };

function detectSource(src: string): VideoSource {
  // YouTube
  const ytMatch = src.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return { type: 'youtube', videoId: ytMatch[1] };

  // Bunny.net
  if (src.includes('iframe.mediadelivery.net') || src.includes('video.bunnycdn.com')) {
    return { type: 'bunny', embedUrl: src };
  }

  return { type: 'unknown', url: src };
}

/* ── YouTube IFrame API loader ── */

let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();

  if (!apiLoadPromise) {
    apiLoadPromise = new Promise<void>((resolve, reject) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };

      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => reject(new Error('Failed to load YouTube IFrame API'));
      document.head.appendChild(script);

      // Timeout fallback
      setTimeout(() => reject(new Error('YouTube API load timeout')), 8000);
    });
  }

  return apiLoadPromise;
}

/* ── Props ── */

interface VideoPlayerProps {
  src: string;
}

/* ── Component ── */

export default function VideoPlayer({ src }: VideoPlayerProps) {
  const source = detectSource(src);

  if (source.type === 'bunny') {
    return <BunnyEmbed url={source.embedUrl} />;
  }

  if (source.type === 'youtube') {
    return <YouTubePlayer videoId={source.videoId} />;
  }

  // Unknown: native video tag
  return (
    <div className="aspect-video bg-black overflow-hidden border border-line shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)]">
      <video src={source.url} controls className="w-full h-full" />
    </div>
  );
}

/* ── Bunny.net embed ── */

function BunnyEmbed({ url }: { url: string }) {
  return (
    <div className="aspect-video bg-black overflow-hidden border border-line shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)]">
      <iframe
        src={url}
        className="w-full h-full"
        title="Video"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

/* ── YouTube player with IFrame API + fallback ── */

function YouTubePlayer({ videoId }: { videoId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const [status, setStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const mountedRef = useRef(true);

  const handleError = useCallback(() => {
    if (mountedRef.current) setStatus('error');
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let destroyed = false;

    async function init() {
      try {
        await loadYouTubeAPI();
        if (destroyed || !containerRef.current || !window.YT) return;

        // Create a target div for YT.Player (it replaces the element)
        const target = document.createElement('div');
        target.id = `yt-player-${videoId}-${Date.now()}`;
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(target);

        playerRef.current = new window.YT.Player(target, {
          videoId,
          playerVars: {
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
          },
          events: {
            onReady: () => {
              if (!destroyed && mountedRef.current) setStatus('playing');
            },
            onError: () => {
              if (!destroyed && mountedRef.current) setStatus('error');
            },
          },
        });
      } catch {
        if (!destroyed && mountedRef.current) setStatus('error');
      }
    }

    init();

    return () => {
      destroyed = true;
      mountedRef.current = false;
      try { playerRef.current?.destroy(); } catch { /* noop */ }
      playerRef.current = null;
    };
  }, [videoId, handleError]);

  // Error state: thumbnail fallback
  if (status === 'error') {
    return <YouTubeFallback videoId={videoId} />;
  }

  return (
    <div className="aspect-video bg-black overflow-hidden border border-line shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)] relative">
      <div ref={containerRef} className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

/* ── YouTube fallback: thumbnail + open in new tab ── */

function YouTubeFallback({ videoId }: { videoId: string }) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block aspect-video bg-black overflow-hidden border border-line shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)] relative group"
    >
      <img
        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
        alt="Video thumbnail"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center transition-colors shadow-lg">
          <Play size={32} className="text-ink ml-1" fill="currentColor" />
        </div>
      </div>
      <span className="absolute bottom-3 right-3 text-[10px] font-bold uppercase tracking-widest text-white/60 bg-black/50 px-2 py-1">
        Abrir no YouTube
      </span>
    </a>
  );
}
