// Местоположение: src/components/icons/CloseIcon.tsx

// Простой компонент, который просто рисует SVG-иконку крестика.
// Он принимает стандартные свойства SVG, чтобы мы могли менять его размер и цвет.
export default function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        className='h-7 w-7' // Задаем размер по умолчанию
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor' // Цвет линии будет наследоваться от родительского элемента
        strokeWidth={1}
        {...props}
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M6 18L18 6M6 6l12 12' // Это две линии, которые образуют крестик
        />
      </svg>
    );
  }