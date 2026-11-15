import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'section' | 'div';
}

/** Tarjeta de ladrillo (D68): vino, borde y sombra dura sin desenfoque. */
export function Card({ as: Tag = 'article', className = '', children, ...rest }: CardProps) {
  return (
    <Tag {...rest} className={`brick-card p-6 ${className}`}>
      {children}
    </Tag>
  );
}
