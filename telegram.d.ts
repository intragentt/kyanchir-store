// Местоположение: telegram.d.ts

// --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем описание всех новых "рычагов" ---
interface BackButton {
  hide: () => void;
}

interface WebApp {
  expand: () => void;
  ready: () => void;
  // Официально "узакониваем" новые методы
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
