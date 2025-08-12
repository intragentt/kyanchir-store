import ShortLogo from './icons/ShortLogo';

interface PreloaderProps {
  top: number;
}

export default function Preloader({ top }: PreloaderProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 200,
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
    >
      <ShortLogo className="animate-fade-pulse h-12 w-auto text-gray-300" />
    </div>
  );
}
