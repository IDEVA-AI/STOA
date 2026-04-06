import { useEffect, useRef, useState } from 'react';
import { Play, Loader2 } from 'lucide-react';

/* ── Types ── */

interface VideoPlayerProps {
  src: string;
  blockId?: number;
  importStatus?: 'importing' | 'completed' | 'error';
  importProgress?: number;
  importError?: string;
}

type ImportState = {
  status: 'idle' | 'downloading' | 'uploading' | 'completed' | 'error';
  progress: number;
  bunnyUrl?: string;
  error?: string;
};

type VideoSource =
  | { type: 'youtube'; videoId: string }
  | { type: 'bunny'; embedUrl: string }
  | { type: 'unknown'; url: string };

/* ── URL detection ── */

function detectSource(src: string): VideoSource {
  const ytMatch = src.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return { type: 'youtube', videoId: ytMatch[1] };

  // Bunny: iframe embed, player page, or CDN play URL — normalise to embed
  const bunnyMatch = src.match(
    /(?:iframe\.mediadelivery\.net\/embed|player\.mediadelivery\.net\/play|video\.bunnycdn\.com\/play)\/(\d+)\/([a-f0-9-]+)/
  );
  if (bunnyMatch) {
    const embedUrl = `https://iframe.mediadelivery.net/embed/${bunnyMatch[1]}/${bunnyMatch[2]}`;
    return { type: 'bunny', embedUrl };
  }

  return { type: 'unknown', url: src };
}

/* ── WebSocket hook for import progress ── */

function useImportProgress(blockId: number | undefined, initialStatus?: string): ImportState {
  const [state, setState] = useState<ImportState>({
    status: initialStatus === 'importing' ? 'downloading' : initialStatus === 'error' ? 'error' : 'idle',
    progress: 0,
  });

  useEffect(() => {
    if (!blockId) return;

    function handleMessage(event: MessageEvent) {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'video_import' && msg.blockId === blockId) {
          setState({
            status: msg.status,
            progress: msg.progress ?? 0,
            bunnyUrl: msg.bunnyUrl,
            error: msg.error,
          });
        }
      } catch { /* ignore non-JSON */ }
    }

    const checkWs = () => {
      const ws = (window as any).__stoaWs as WebSocket | undefined;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.addEventListener('message', handleMessage);
        return () => ws.removeEventListener('message', handleMessage);
      }
      return undefined;
    };

    let cleanup = checkWs();
    if (!cleanup) {
      const interval = setInterval(() => {
        cleanup = checkWs();
        if (cleanup) clearInterval(interval);
      }, 500);
      const timeout = setTimeout(() => clearInterval(interval), 5000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
        cleanup?.();
      };
    }

    return cleanup;
  }, [blockId]);

  return state;
}

/* ── Component ── */

export default function VideoPlayer({ src, blockId, importStatus, importProgress, importError }: VideoPlayerProps) {
  const importState = useImportProgress(blockId, importStatus);

  // If import completed via WS, use the new Bunny URL
  const effectiveSrc = importState.bunnyUrl || src;
  const source = detectSource(effectiveSrc);

  // Show import progress overlay
  if (importState.status === 'downloading' || importState.status === 'uploading') {
    const ytMatch = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const ytId = ytMatch?.[1];

    return (
      <div className="aspect-video bg-black overflow-hidden border border-line shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)] relative">
        {ytId && (
          <img
            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
            alt="Video thumbnail"
            className="w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <Loader2 size={32} className="text-white animate-spin" />
          <div className="w-48 sm:w-64">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full transition-all duration-500"
                style={{ width: `${importState.progress}%` }}
              />
            </div>
          </div>
          <span className="text-white/80 text-xs font-bold uppercase tracking-widest">
            {importState.status === 'downloading' ? 'Baixando video...' : 'Enviando para CDN...'}
          </span>
          <span className="text-white/50 text-xs">
            {importState.progress}%
          </span>
        </div>
      </div>
    );
  }

  // Import error: show fallback
  if (importState.status === 'error' || importStatus === 'error') {
    const ytMatch = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const ytId = ytMatch?.[1];
    const errorMsg = importState.error || importError || 'Falha no import';

    return (
      <div className="aspect-video bg-black overflow-hidden border border-line shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)] relative">
        {ytId && (
          <img
            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
            alt="Video thumbnail"
            className="w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <p className="text-white/80 text-sm font-bold">Falha no import</p>
          <p className="text-white/40 text-xs max-w-xs text-center">{errorMsg}</p>
          <a
            href={ytId ? `https://www.youtube.com/watch?v=${ytId}` : src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white/70 border border-white/20 hover:border-white/40 transition-colors mt-2"
          >
            <Play size={14} fill="currentColor" />
            Assistir no YouTube
          </a>
        </div>
      </div>
    );
  }

  // Bunny embed
  if (source.type === 'bunny') {
    return (
      <div className="aspect-video bg-black overflow-hidden border border-line shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)]">
        <iframe
          src={source.embedUrl}
          className="w-full h-full"
          title="Video"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // YouTube (not yet imported): thumbnail + open
  if (source.type === 'youtube') {
    return (
      <a
        href={`https://www.youtube.com/watch?v=${source.videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-video bg-black overflow-hidden border border-line shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)] relative group"
      >
        <img
          src={`https://img.youtube.com/vi/${source.videoId}/hqdefault.jpg`}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center transition-colors shadow-lg">
            <Play size={32} className="text-ink ml-1" fill="currentColor" />
          </div>
        </div>
      </a>
    );
  }

  // Unknown: native video
  return (
    <div className="aspect-video bg-black overflow-hidden border border-line shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)]">
      <video src={source.url} controls className="w-full h-full" />
    </div>
  );
}
