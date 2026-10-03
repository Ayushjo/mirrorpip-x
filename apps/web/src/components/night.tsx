import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from './ui';

/**
 * A "night island": forces the dark palette for its subtree, whatever the page
 * theme. Every image we ship is a dark render, so imagery, device mockups and
 * media frames sit in one of these and look identical in light and dark mode.
 */
export function Night({ as: Tag = 'div', className, children, ...rest }: { as?: ElementType; className?: string; children?: ReactNode } & HTMLAttributes<HTMLElement>) {
  return (
    <Tag data-theme="dark" className={cx('isolate bg-bg text-fg', className)} {...rest}>
      {children}
    </Tag>
  );
}
