interface ErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorFallback({
  message = 'Ocorreu um erro inesperado.',
  onRetry,
}: ErrorFallbackProps) {
  return (
    <div className="card-editorial p-6 text-center">
      <div className="text-danger text-2xl mb-3" aria-hidden="true">
        !
      </div>
      <p className="text-warm-gray text-sm font-sans leading-relaxed mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mono-label px-4 py-2 border border-gold text-gold hover:bg-gold hover:text-bg transition-colors duration-300"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
