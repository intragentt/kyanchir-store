// Местоположение: src/components/icons/DiscountBadgeIcon.tsx
// SVG-фигура для нашего бейджа со скидкой
export default function DiscountBadgeIcon(
    props: React.SVGProps<SVGSVGElement>,
  ) {
    return (
      <svg
        width="54"
        height="26"
        viewBox="0 0 54 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M53.1679 13C53.1679 12.16 52.8879 11.38 52.3779 10.77L44.5979 1.15C43.5279 -0.16 41.7779 -0.38 40.4579 0.69L1.87793 21.03C0.81793 21.9 0.58793 23.28 1.15793 24.5C1.72793 25.72 2.95793 26.5 4.33793 26.5H48.1679C51.0779 26.5 53.1679 24.19 53.1679 21.5V13Z"
          fill="#E06F6F" // Цвет фона бейджа - наш feedback.error
        />
      </svg>
    );
  }