import type { ImgHTMLAttributes, SyntheticEvent } from "react";

type ProtectedPosterImageProps = ImgHTMLAttributes<HTMLImageElement>;

const preventPosterImageSave = (event: SyntheticEvent<HTMLImageElement>) => {
  event.preventDefault();
};

export default function ProtectedPosterImage({
  className = "",
  ...props
}: ProtectedPosterImageProps) {
  return (
    <img
      {...props}
      draggable={false}
      onContextMenu={preventPosterImageSave}
      onDragStart={preventPosterImageSave}
      className={`protected-poster-image ${className}`.trim()}
    />
  );
}
