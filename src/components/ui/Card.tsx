import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'section' | 'div';
}

/** Tarjeta (D84): noche con una línea de 1 px, sin sombra. */
export function Card({ as: Tag = 'article', className = '', children, ...rest }: CardProps) {
  return (
    <Tag {...rest} className={`ui-card p-6 ${className}`}>
      {children}
    </Tag>
  );
}
