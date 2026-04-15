import { useState, ImgHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  disableLazy?: boolean;
  aspectRatio?: string;
  imageClassName?: string;
}

export const Image = forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      alt,
      className,
      fallbackSrc = 'https://picsum.photos/seed/fallback/800/600',
      disableLazy = false,
      aspectRatio,
      imageClassName,
      ...props
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const imgSrc = hasError ? fallbackSrc : src;

    return (
      <div 
        className={cn('relative overflow-hidden bg-white/5', className)} 
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <img
          ref={ref}
          src={imgSrc}
          alt={alt}
          loading={disableLazy ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-300 ease-in-out',
            imageClassName,
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 animate-pulse bg-white/10" />
        )}
      </div>
    );
  }
);

Image.displayName = 'Image';
