"use client";

import Image from "next/image";
import { useState } from "react";

type ImageWithFallbackProps = {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

export function ImageWithFallback({ src, alt, ...props }: ImageWithFallbackProps) {
  const [imageSrc, setImageSrc] = useState(src);

  return (
    <Image
      {...props}
      src={imageSrc}
      alt={alt}
      onError={() => setImageSrc("/brand-textile.svg")}
    />
  );
}
