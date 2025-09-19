// Местоположение: /src/components/icons/ReceiptIcon.tsx
export default function ReceiptIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path>
      <path d="M16 8h-6a2 2 0 1 0 0 4h6"></path>
      <path d="M12 18.5a2.5 2.5 0 0 0 0-5"></path>
    </svg>
  );
}
