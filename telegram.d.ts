// Местоположение: telegram.d.ts

// --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем полное описание кнопки "Назад" ---
interface BackButton {
  show: () => void;
  hide: () => void;
  onClick: (callback: () => void) => void;
}

interface WebApp {
  expand: () => void;
  ready: () => void;
  setHeaderColor: (color_key: 'bg_color' | 'secondary_bg_color') => void;
  close: () => void;
  BackButton: BackButton;
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

interface Window {
  Telegram?: {
    WebApp: WebApp;
  };
}
