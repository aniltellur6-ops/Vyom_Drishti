import React, { useState, useEffect } from 'react';

// Helper component to bypass ngrok/cloudflared warning pages for images
export const NgrokImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (!src) return;
    setHasError(false);
    let objectUrl = '';
    let isCancelled = false;

    fetch(src, { headers: { 'ngrok-skip-browser-warning': 'true' } })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (!isCancelled) {
          objectUrl = URL.createObjectURL(blob);
          setImgSrc(objectUrl);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('NgrokImage load warning:', err);
          setHasError(true);
        }
      });

    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (hasError) {
    return (
      <div className={`bg-cyan-100/60 border border-cyan-200/80 rounded flex items-center justify-center text-[10px] text-cyan-800 font-mono ${className}`}>
        IMAGE UNAVAILABLE
      </div>
    );
  }

  if (!imgSrc) {
    return (
      <div className={`animate-pulse bg-cyan-100/40 border border-cyan-200/60 rounded flex items-center justify-center text-xs text-cyan-800 font-mono ${className}`}>
        LOADING IMAGE...
      </div>
    );
  }

  return <img src={imgSrc} alt={alt} className={className} />;
};
