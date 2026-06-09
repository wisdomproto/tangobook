import * as React from 'react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

interface AvatarProps extends React.ComponentProps<'div'> {
  size?: 'default' | 'sm' | 'lg';
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="avatar"
        data-size={size}
        className={cn(
          'group/avatar relative flex shrink-0 rounded-full select-none',
          'after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken',
          size === 'default' && 'size-8',
          size === 'sm' && 'size-6',
          size === 'lg' && 'size-10',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

// ---------------------------------------------------------------------------
// AvatarImage
// ---------------------------------------------------------------------------

type AvatarImageProps = React.ComponentProps<'img'>;

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, src, alt = '', onError, ...props }, ref) => {
    const [broken, setBroken] = React.useState(false);

    // Reset broken state when src changes
    React.useEffect(() => {
      setBroken(false);
    }, [src]);

    if (!src || broken) return null;

    return (
      <img
        ref={ref}
        data-slot="avatar-image"
        src={src}
        alt={alt}
        className={cn('aspect-square size-full rounded-full object-cover', className)}
        onError={(e) => {
          setBroken(true);
          onError?.(e);
        }}
        {...props}
      />
    );
  }
);
AvatarImage.displayName = 'AvatarImage';

// ---------------------------------------------------------------------------
// AvatarFallback
// ---------------------------------------------------------------------------

type AvatarFallbackProps = React.ComponentProps<'span'>;

const AvatarFallback = React.forwardRef<HTMLSpanElement, AvatarFallbackProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-slot="avatar-fallback"
        className={cn(
          'flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground',
          'group-data-[size=sm]/avatar:text-xs',
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
AvatarFallback.displayName = 'AvatarFallback';

// ---------------------------------------------------------------------------
// AvatarBadge
// ---------------------------------------------------------------------------

const AvatarBadge = React.forwardRef<HTMLSpanElement, React.ComponentProps<'span'>>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-slot="avatar-badge"
        className={cn(
          'absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background select-none',
          'group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden',
          'group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2',
          'group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2',
          className
        )}
        {...props}
      />
    );
  }
);
AvatarBadge.displayName = 'AvatarBadge';

// ---------------------------------------------------------------------------
// AvatarGroup
// ---------------------------------------------------------------------------

const AvatarGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="avatar-group"
        className={cn(
          'group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background',
          className
        )}
        {...props}
      />
    );
  }
);
AvatarGroup.displayName = 'AvatarGroup';

// ---------------------------------------------------------------------------
// AvatarGroupCount
// ---------------------------------------------------------------------------

const AvatarGroupCount = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="avatar-group-count"
        className={cn(
          'relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background',
          'group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6',
          '[&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3',
          className
        )}
        {...props}
      />
    );
  }
);
AvatarGroupCount.displayName = 'AvatarGroupCount';

export { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount };
