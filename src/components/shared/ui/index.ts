// Местоположение: src/components/shared/ui/index.ts

// UI Components - исправленные пути
import Button from './Button';
import BottomSheet from './BottomSheet';

export { Button, BottomSheet };

// Наши новые shared компоненты
export { LoadingSpinner } from './LoadingSpinner/LoadingSpinner';
export { ErrorMessage } from './ErrorMessage/ErrorMessage';

// Re-export types
export type { LoadingSpinnerProps } from './LoadingSpinner/LoadingSpinner';
export type { ErrorMessageProps } from './ErrorMessage/ErrorMessage';
