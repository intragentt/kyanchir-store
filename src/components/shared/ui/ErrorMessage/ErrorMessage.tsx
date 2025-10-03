// Местоположение: src/components/shared/ui/ErrorMessage/ErrorMessage.tsx

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage = ({ 
  message, 
  onRetry,
  className = '' 
}: ErrorMessageProps) => {
  return (
    <div className={`rounded-md bg-red-50 border border-red-200 p-4 ${className}`}>
      <div className="text-sm text-red-800">
        {message}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Попробовать снова
        </button>
      )}
    </div>
  );
};

export type { ErrorMessageProps };
