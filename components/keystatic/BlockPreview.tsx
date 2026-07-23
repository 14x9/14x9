"use client";

import { useEffect, useState } from "react";

/**
 * Previews rendered inside the Keystatic block editor, so an image block shows
 * what's actually in it instead of an empty box.
 *
 * Keystatic hands content-component fields their *parsed* value: an uploaded
 * image is `{ data, extension, filename }`, or null when empty. We turn the
 * bytes into an object URL for the thumbnail.
 *
 * An empty thumbnail is meaningful: it means Keystatic has no bytes for that
 * reference (the file didn't load), so saving would drop the reference.
 */

export type KeystaticAsset = {
  data: Uint8Array;
  extension: string;
  filename: string;
} | null;

function useObjectUrl(data: Uint8Array | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!data || data.length === 0) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(new Blob([data as BlobPart]));
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [data]);
  return url;
}

const wrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "8px 0",
};

const thumbStyle: React.CSSProperties = {
  height: 96,
  width: 96,
  objectFit: "cover",
  borderRadius: 6,
  flex: "none",
  background: "rgba(125,125,125,.15)",
};

const metaStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.4,
  opacity: 0.75,
  minWidth: 0,
  overflowWrap: "anywhere",
};

const emptyStyle: React.CSSProperties = {
  ...metaStyle,
  opacity: 0.6,
  fontStyle: "italic",
  padding: "8px 0",
};

/** Thumbnail + filename for an image block (1-up, slide). */
export function ImagePreview({
  image,
  alt,
  caption,
  emptyLabel = "No image selected",
}: {
  image: KeystaticAsset;
  alt?: string;
  caption?: string;
  emptyLabel?: string;
}) {
  const url = useObjectUrl(image?.data);

  if (!url) return <div style={emptyStyle}>{emptyLabel}</div>;

  return (
    <div style={wrapStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt || ""} style={thumbStyle} />
      <div style={metaStyle}>
        {image?.filename ? <div>{image.filename}</div> : null}
        {alt ? <div>{alt}</div> : <div style={{ opacity: 0.7 }}>No alt text</div>}
        {caption ? <div>“{caption}”</div> : null}
      </div>
    </div>
  );
}

/** Poster thumbnail + source summary for a video block. */
export function VideoPreview({
  poster,
  vimeo,
  file,
  caption,
}: {
  poster: KeystaticAsset;
  vimeo?: string;
  file?: { filename: string } | null;
  caption?: string;
}) {
  const url = useObjectUrl(poster?.data);
  const source = vimeo
    ? `Vimeo ${vimeo}`
    : file?.filename
      ? file.filename
      : "No video source set";

  return (
    <div style={wrapStyle}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" style={thumbStyle} />
      ) : (
        <div style={{ ...thumbStyle, display: "grid", placeItems: "center", fontSize: 11 }}>
          no poster
        </div>
      )}
      <div style={metaStyle}>
        <div>{source}</div>
        {caption ? <div>“{caption}”</div> : null}
      </div>
    </div>
  );
}
