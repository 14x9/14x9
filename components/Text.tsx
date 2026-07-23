import type { CSSProperties, ElementType, ReactNode } from "react";
import styles from "./Text.module.css";

type TextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "body-xl"
  | "body-l"
  | "body-m"
  | "body-s"
  | "body-xs"
  | "nav-link"
  | "text-link"
  | "small"
  | "eyebrow";

const defaultTag: Record<TextVariant, ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  "body-xl": "p",
  "body-l": "p",
  "body-m": "p",
  "body-s": "p",
  "body-xs": "p",
  "nav-link": "span",
  "text-link": "span",
  small: "p",
  eyebrow: "span",
};

type TextProps = {
  variant?: TextVariant;
  as?: ElementType;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * Typographic primitive. Every text style on the site maps to one of these
 * variants — the Figma type ramp (H1–H6, Body XL–XS, Nav/Text Link) plus two
 * utilities (small, eyebrow). Serif (PPE) is H1/H2/H4; the rest use PPM sans.
 * Tuned on /systems.
 */
export default function Text({
  variant = "body-m",
  as,
  children,
  className = "",
  style,
}: TextProps) {
  const Tag = as ?? defaultTag[variant];
  const cls = `${styles[variantKey(variant)]} ${className}`.trim();
  return (
    <Tag className={cls} style={style}>
      {children}
    </Tag>
  );
}

function variantKey(v: TextVariant): keyof typeof styles {
  return v.replaceAll("-", "_") as keyof typeof styles;
}

// Convenience alias for headline usage.
export function Heading(props: Omit<TextProps, "variant"> & { variant?: TextVariant }) {
  return <Text variant="h2" {...props} />;
}
