// Iconos SVG de la navegación (trazo 1.5, 20 px, currentColor). Sin emojis:
// los emojis quedan para las 14 categorías (§11.3.3).
const PATHS = {
  home: 'M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm0 14a2 2 0 0 1 2-2h13',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-2.5-11a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V15m0 2.5h.01',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  lifebuoy:
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6.4 2.4 3.6-3.6m5.6-5.6 3.6-3.6m0 12.8-3.6-3.6M9.2 9.2 5.6 5.6',
  login: 'M14 4h5v16h-5M10 8l4 4-4 4m4-4H3',
  menu: 'M4 7h16M4 12h16M4 17h16',
  chevron: 'm6 9 6 6 6-6',
  collapse: 'm15 6-6 6 6 6',
} as const;

export type IconName = keyof typeof PATHS;

interface NavIconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function NavIcon({ name, size = 20, className = '' }: NavIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
