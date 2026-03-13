import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Megaphone, Image as ImageIcon, Play } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import type { Announcement, AnnouncementBlock } from '../services/api';

// ── Block Renderers ────────────────────────────────────────────────────

function TextBlock({ content }: { content: string }) {
  let parsed: { variant?: string; text?: string; items?: string[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { text: content };
  }

  if (parsed.variant === 'heading') {
    return (
      <h3 className="serif-display text-2xl text-text mb-3">
        {parsed.text}
      </h3>
    );
  }

  if (parsed.variant === 'list' && parsed.items) {
    return (
      <ul className="space-y-2 mb-4">
        {parsed.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-text/80">
            <span className="text-gold mt-1 shrink-0">&#8226;</span>
            <span className="font-light leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="text-text/80 font-light leading-relaxed mb-4">
      {parsed.text || content}
    </p>
  );
}

function ImageBlock({ content }: { content: string }) {
  let parsed: { src?: string; alt?: string; caption?: string };
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { src: content };
  }

  return (
    <figure className="mb-4">
      {parsed.src ? (
        <img
          src={parsed.src}
          alt={parsed.alt || ''}
          className="w-full rounded-lg border border-line object-cover max-h-80"
        />
      ) : (
        <div className="w-full h-48 rounded-lg border border-line bg-surface flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-warm-gray" />
        </div>
      )}
      {parsed.caption && (
        <figcaption className="mt-2 text-sm text-warm-gray text-center font-light">
          {parsed.caption}
        </figcaption>
      )}
    </figure>
  );
}

function VideoBlock({ content }: { content: string }) {
  let parsed: { url?: string; provider?: string };
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { url: content };
  }

  const getEmbedUrl = (url: string, provider?: string) => {
    if (provider === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
      return match ? `https://www.youtube.com/embed/${match[1]}` : url;
    }
    if (provider === 'vimeo' || url.includes('vimeo.com')) {
      const match = url.match(/vimeo\.com\/(\d+)/);
      return match ? `https://player.vimeo.com/video/${match[1]}` : url;
    }
    return url;
  };

  if (!parsed.url) {
    return (
      <div className="w-full h-48 rounded-lg border border-line bg-surface flex items-center justify-center mb-4">
        <Play className="w-8 h-8 text-warm-gray" />
      </div>
    );
  }

  return (
    <div className="relative w-full pb-[56.25%] mb-4 rounded-lg overflow-hidden border border-line">
      <iframe
        src={getEmbedUrl(parsed.url, parsed.provider)}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function BlockRenderer({ block }: { block: AnnouncementBlock }) {
  switch (block.block_type) {
    case 'text':
      return <TextBlock content={block.content} />;
    case 'image':
      return <ImageBlock content={block.content} />;
    case 'video':
      return <VideoBlock content={block.content} />;
    default:
      return null;
  }
}

// ── Announcement Card ──────────────────────────────────────────────────

function AnnouncementCard({
  announcement,
  onConfirm,
  isConfirming,
  index,
  total,
}: {
  announcement: Announcement;
  onConfirm: () => void;
  isConfirming: boolean;
  index: number;
  total: number;
}) {
  return (
    <motion.div
      key={announcement.id}
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.97 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="card-editorial rounded-xl overflow-hidden shadow-elevated">
        {/* Header */}
        <div className="px-4 sm:px-8 pt-4 sm:pt-8 pb-4">
          {total > 1 && (
            <div className="flex items-center justify-between mb-6">
              <span className="mono-label text-warm-gray">
                {index + 1} de {total}
              </span>
              <div className="flex gap-1.5">
                {Array.from({ length: total }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i <= index ? 'w-6 bg-gold' : 'w-3 bg-line'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="serif-display text-3xl text-text leading-tight">
                {announcement.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Blocks */}
        {announcement.blocks.length > 0 && (
          <div className="px-4 sm:px-8 pb-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
            {announcement.blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="mx-4 sm:mx-8 border-t border-line" />

        {/* Footer */}
        <div className="px-4 sm:px-8 py-6">
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg
              bg-gold text-white font-medium text-sm tracking-wide
              hover:bg-gold-light hover:text-ink
              active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200"
          >
            <CheckCircle className="w-4 h-4" />
            {isConfirming ? 'Confirmando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Gate Component ────────────────────────────────────────────────

export default function AnnouncementGate() {
  const { isAuthenticated } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPending = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const pending = await api.getPendingAnnouncements();
      setAnnouncements(pending);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleConfirm = useCallback(async () => {
    const current = announcements[currentIndex];
    if (!current || isConfirming) return;

    setIsConfirming(true);
    try {
      await api.confirmAnnouncement(current.id);

      if (currentIndex < announcements.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.error('Failed to confirm announcement:', err);
    } finally {
      setIsConfirming(false);
    }
  }, [announcements, currentIndex, isConfirming]);

  // Don't render gate if not authenticated, loading, or no pending announcements
  if (!isAuthenticated || isLoading || announcements.length === 0) {
    return null;
  }

  const current = announcements[currentIndex];

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
          style={{ backgroundColor: 'var(--theme-overlay)' }}
        >
          {/* Backdrop blur */}
          <div className="absolute inset-0 backdrop-blur-sm" />

          {/* Content */}
          <div className="relative z-10 w-full">
            <AnimatePresence mode="wait">
              <AnnouncementCard
                key={current.id}
                announcement={current}
                onConfirm={handleConfirm}
                isConfirming={isConfirming}
                index={currentIndex}
                total={announcements.length}
              />
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
