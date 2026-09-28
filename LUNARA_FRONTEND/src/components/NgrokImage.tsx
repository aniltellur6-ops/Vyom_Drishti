import React, { useState, useEffect } from 'react';

// Helper component to bypass ngrok/cloudflared warning pages for images
export const NgrokImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (!src) return;
    setHasError(false);
    fetch(src, { headers: { 'ngrok-skip-browser-warning': 'true' } })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => setImgSrc(URL.createObjectURL(blob)))
      .catch((err) => {
        console.warn('NgrokImage load warning:', err);
        setHasError(true);
      });
  }, [src]);

  if (hasError) {
    return (
      <div className={`bg-slate-900/60 flex items-center justify-center text-[10px] text-slate-500 font-mono ${className}`}>
        IMAGE UNAVAILABLE
      </div>
    );
  }

  if (!imgSrc) {
    return (
      <div className={`animate-pulse bg-slate-900/50 flex items-center justify-center text-xs text-slate-500 font-mono ${className}`}>
        LOADING IMAGE...
      </div>
    );
  }

  return <img src={imgSrc} alt={alt} className={className} />;
};
