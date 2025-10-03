// Местоположение: src/components/shared/ui/index.ts

// UI Components - универсальный подход
import Button from '../../ui/Button';
import BottomSheet from '../../ui/BottomSheet';

// Re-export
export { Button, BottomSheet };

// Наши новые shared компоненты
export { LoadingSpinner } from './LoadingSpinner/LoadingSpinner';
export { ErrorMessage } from './ErrorMessage/ErrorMessage';

// Re-export types
export type { LoadingSpinnerProps } from './LoadingSpinner/LoadingSpinner';
export type { ErrorMessageProps } from './ErrorMessage/ErrorMessage';
