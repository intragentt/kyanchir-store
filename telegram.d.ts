// Местоположение: telegram.d.ts

// --- НАЧАЛО ИЗМЕНЕНИЙ ---
interface BackButton {
  hide: () => void;
}

interface WebApp {
  expand: () => void;
  ready: () => void;

  // Новые/используемые методы
  setHeaderColor: (color_key: 'bg_color' | 'secondary_bg_color') => void;
  close: () => void;
  BackButton: BackButton;

  // ✅ Полноэкранный режим (доступен в новых клиентах Telegram)
  requestFullscreen?: () => Promise<void> | void;
  exitFullscreen?: () => Promise<void> | void;
  isFullscreen?: boolean;
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

interface Window {
  Telegram?: {
    WebApp: WebApp;
  };
}
