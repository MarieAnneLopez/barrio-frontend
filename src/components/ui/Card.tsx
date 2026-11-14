import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'section' | 'div';
}

/** Superficie de vidrio oscuro (§10): fondo translúcido, blur y borde tenue. */
export function Card({ as: Tag = 'article', className = '', children, ...rest }: CardProps) {
  return (
    <Tag {...rest} className={`glass rounded-lg p-6 shadow-[var(--shadow-deep)] ${className}`}>
      {children}
    </Tag>
  );
}
