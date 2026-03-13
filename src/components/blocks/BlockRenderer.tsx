import { Lightbulb, AlertTriangle, Info, FileDown, ExternalLink } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { LessonBlock } from '@/src/types';

interface BlockRendererProps {
  block: LessonBlock;
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}?modestbranding=1&rel=0` : null;
}

function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
}

function VideoBlock({ content }: { content: Record<string, any> }) {
  const url = content.url || '';
  if (!url) {
    return (
      <div className="aspect-video bg-surface border border-line flex items-center justify-center text-warm-gray/40 font-serif italic">
        Nenhum video configurado
      </div>
    );
  }

  const ytUrl = getYouTubeEmbedUrl(url);
  const vimeoUrl = getVimeoEmbedUrl(url);
  const embedUrl = ytUrl || vimeoUrl;

  if (embedUrl) {
    return (
      <div className="aspect-video bg-black overflow-hidden border border-line shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)]">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          title="Video"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black overflow-hidden border border-line shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)]">
      <video src={url} controls className="w-full h-full" />
    </div>
  );
}

const TEXT_BLOCK_CLASSES = [
  'max-w-none font-serif text-text/80 leading-relaxed',
  // Headings
  '[&_h1]:text-4xl [&_h1]:font-bold [&_h1]:font-serif [&_h1]:text-text [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:tracking-tight [&_h1]:leading-tight',
  '[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:font-serif [&_h2]:text-text/90 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:tracking-tight [&_h2]:leading-tight [&_h2]:border-b [&_h2]:border-line/30 [&_h2]:pb-2',
  '[&_h3]:text-lg [&_h3]:font-bold [&_h3]:font-serif [&_h3]:text-text/80 [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:uppercase [&_h3]:tracking-wide',
  // Paragraph
  '[&_p]:text-lg [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:last:mb-0',
  // Bold / Italic / Underline / Strike
  '[&_strong]:text-text [&_strong]:font-bold',
  '[&_em]:italic',
  '[&_u]:underline [&_u]:decoration-gold/40 [&_u]:underline-offset-2',
  '[&_s]:line-through [&_s]:text-warm-gray/50',
  // Links
  '[&_a]:text-gold [&_a]:no-underline hover:[&_a]:underline [&_a]:transition-colors',
  // Lists
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2',
  '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-2',
  '[&_li]:text-text/80 [&_li]:text-lg [&_li]:leading-relaxed',
  '[&_li_p]:mb-0',
  // Blockquote
  '[&_blockquote]:border-l-2 [&_blockquote]:border-gold/30 [&_blockquote]:pl-6 [&_blockquote]:py-2 [&_blockquote]:my-6 [&_blockquote]:italic [&_blockquote]:text-text/60',
  // Inline code
  '[&_code]:text-gold/80 [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono',
  // Code block
  '[&_pre]:bg-surface [&_pre]:border [&_pre]:border-line [&_pre]:rounded-sm [&_pre]:px-5 [&_pre]:py-4 [&_pre]:my-6 [&_pre]:max-w-full [&_pre]:overflow-x-auto',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-text/70 [&_pre_code]:text-sm [&_pre_code]:font-mono [&_pre_code]:leading-relaxed',
  // Horizontal rule
  '[&_hr]:border-line [&_hr]:my-8',
].join(' ');

function TextBlock({ content }: { content: Record<string, any> }) {
  const html = content.html || '';
  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      className={TEXT_BLOCK_CLASSES}
    />
  );
}

function ImageBlock({ content }: { content: Record<string, any> }) {
  const url = content.url || '';
  const caption = content.caption || '';

  if (!url) {
    return (
      <div className="aspect-video bg-surface border border-line flex items-center justify-center text-warm-gray/40 font-serif italic">
        Nenhuma imagem configurada
      </div>
    );
  }

  return (
    <figure className="space-y-4">
      <div className="overflow-hidden border border-line rounded-sm">
        <img
          src={url}
          alt={caption || 'Imagem da aula'}
          className="w-full h-auto object-cover"
        />
      </div>
      {caption && (
        <figcaption className="text-center text-sm text-warm-gray/60 font-serif italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function FileBlock({ content }: { content: Record<string, any> }) {
  const url = content.url || '';
  const filename = content.filename || 'Arquivo';
  const size = content.size || '';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-6 p-6 border border-line bg-surface/50 hover:bg-surface hover:border-gold/20 transition-all group"
    >
      <div className="w-12 h-12 rounded-sm bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold/20 transition-colors">
        <FileDown size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text truncate">{filename}</p>
        {size && <p className="text-xs text-warm-gray/50 mt-1">{size}</p>}
      </div>
      <ExternalLink size={16} className="text-warm-gray/30 group-hover:text-gold transition-colors" />
    </a>
  );
}

function ButtonBlock({ content }: { content: Record<string, any> }) {
  const label = content.label || 'Botao';
  const url = content.url || '#';
  const style = content.style || 'primary';

  return (
    <div className="flex justify-center">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center gap-3 px-8 py-4 text-sm font-bold tracking-wide transition-all',
          style === 'primary'
            ? 'bg-gold text-paper hover:brightness-110 shadow-lg shadow-gold/20'
            : 'border border-line text-text hover:border-gold hover:text-gold'
        )}
      >
        {label}
        <ExternalLink size={14} />
      </a>
    </div>
  );
}

function DividerBlock() {
  return <hr className="border-line my-8" />;
}

function CalloutBlock({ content }: { content: Record<string, any> }) {
  const text = content.text || '';
  const type = content.type || 'info';

  const styles = {
    tip: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', icon: <Lightbulb size={20} />, iconColor: 'text-emerald-500', label: 'Dica' },
    warning: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', icon: <AlertTriangle size={20} />, iconColor: 'text-amber-500', label: 'Atenção' },
    info: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', icon: <Info size={20} />, iconColor: 'text-blue-500', label: 'Informação' },
  };

  const s = styles[type as keyof typeof styles] || styles.info;

  return (
    <div className={cn('p-8 border', s.bg, s.border)}>
      <div className="flex items-start gap-5">
        <div className={cn('mt-0.5 flex-shrink-0', s.iconColor)}>{s.icon}</div>
        <div className="flex-1 space-y-2">
          <p className={cn('text-xs font-bold uppercase tracking-widest', s.iconColor)}>{s.label}</p>
          <p className="text-sm text-text/80 leading-relaxed font-serif">{text}</p>
        </div>
      </div>
    </div>
  );
}

export default function BlockRenderer({ block }: BlockRendererProps) {
  switch (block.block_type) {
    case 'video':
      return <VideoBlock content={block.content} />;
    case 'text':
      return <TextBlock content={block.content} />;
    case 'image':
      return <ImageBlock content={block.content} />;
    case 'file':
      return <FileBlock content={block.content} />;
    case 'button':
      return <ButtonBlock content={block.content} />;
    case 'divider':
      return <DividerBlock />;
    case 'callout':
      return <CalloutBlock content={block.content} />;
    default:
      return null;
  }
}
