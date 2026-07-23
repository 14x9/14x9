import Link from "next/link";
import type { ComponentProps } from "react";
import styles from "./Button.module.css";

type Variant = "solid" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
};

/**
 * Button primitive. Renders an <a>/<Link> when `href` is supplied, otherwise a
 * <button>. All visual styling is driven by design tokens (see tokens.css), so
 * this is one of the primitives showcased and tuned on /systems.
 */
type ButtonProps =
  | (BaseProps & { href: string } & Omit<ComponentProps<typeof Link>, "className">)
  | (BaseProps & { href?: undefined } & ComponentProps<"button">);

export default function Button({
  variant = "solid",
  size = "md",
  className = "",
  ...rest
}: ButtonProps) {
  const cls = `${styles.btn} ${styles[variant]} ${styles[size]} ${className}`.trim();

  if ("href" in rest && rest.href) {
    const { href, ...linkRest } = rest;
    return (
      <Link href={href} className={cls} {...linkRest} />
    );
  }

  return <button className={cls} {...(rest as ComponentProps<"button">)} />;
}
