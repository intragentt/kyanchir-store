// Местоположение: src/components/SaleBadge.tsx
interface SaleBadgeProps {
  text: string;
  className?: string;
}

const BadgeShape = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="61"
    height="17"
    viewBox="0 0 61 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M0 3C0 1.34315 1.34315 0 3 0H61V17H3C1.34315 17 0 15.6569 0 14V3Z"
      fill="currentColor"
    />
  </svg>
);

export default function SaleBadge({ text, className = '' }: SaleBadgeProps) {
  return (
    <div
      className={`relative flex h-[17px] w-[61px] items-center justify-center ${className}`}
    >
      <BadgeShape className="text-feedback-error absolute inset-0 h-full w-full" />
      <span className="relative z-10 text-[10px] font-bold text-white">
        {text}
      </span>
    </div>
  );
}
