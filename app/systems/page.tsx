import type { Metadata } from "next";
import Text from "@/components/Text";
import Button from "@/components/Button";
import Logo from "@/components/Logo";
import TypeSpecimen from "@/components/systems/TypeSpecimen";
import Reveal from "@/components/Reveal";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Systems",
  description:
    "The 14x9 design system — tokens, typography, color, spacing, and components in one place.",
};

// Keep these arrays in sync with styles/tokens.css. This page is the living
// reference for the system: edit a token in tokens.css and it updates here and
// everywhere the primitives are used.

// The brand palette — the only raw hex values in the system.
const palette = [
  { name: "White", hex: "#FFFFFF", token: "--color-white" },
  { name: "Paper", hex: "#EEEEF3", token: "--color-paper" },
  { name: "Concrete", hex: "#8E8F93", token: "--color-concrete" },
  { name: "Ink", hex: "#222222", token: "--color-ink" },
  { name: "Black", hex: "#000000", token: "--color-black" },
  { name: "Magma", hex: "#FF4400", token: "--color-magma" },
];

// Semantic roles: what components actually reference, and the palette color each
// resolves to. Change a mapping in tokens.css and the whole site follows.
const roles = [
  { token: "--color-bg", role: "Page background", maps: "White" },
  { token: "--color-fg", role: "Body text", maps: "Ink" },
  { token: "--color-fg-muted", role: "Secondary text", maps: "Concrete" },
  { token: "--color-fg-subtle", role: "De-emphasized text", maps: "Concrete" },
  { token: "--color-line", role: "Dividers & borders", maps: "Paper" },
  { token: "--color-accent", role: "Accent", maps: "Magma" },
  { token: "--color-bg-inverse", role: "Inverse background", maps: "Black" },
  { token: "--color-fg-inverse", role: "Inverse text", maps: "White" },
];

const typeScale = [
  { variant: "h1", token: "--text-h1", label: "Header 1" },
  { variant: "h2", token: "--text-h2", label: "Header 2" },
  { variant: "h3", token: "--text-h3", label: "Header 3" },
  { variant: "h4", token: "--text-h4", label: "Header 4" },
  { variant: "h5", token: "--text-h5", label: "Header 5" },
  { variant: "h6", token: "--text-h6", label: "Header 6" },
  { variant: "body-xl", token: "--text-body-xl", label: "Paragraph XL" },
  { variant: "body-l", token: "--text-body-l", label: "Paragraph L" },
  { variant: "body-m", token: "--text-body-m", label: "Paragraph M" },
  { variant: "body-s", token: "--text-body-s", label: "Paragraph S" },
  { variant: "body-xs", token: "--text-body-xs", label: "Paragraph XS" },
  { variant: "nav-link", token: "--text-nav-link", label: "Nav Link" },
  { variant: "text-link", token: "--text-text-link", label: "Text Link" },
] as const;

/** #RRGGBB -> "rgba(r, g, b, 1)" */
function hexToRgba(hex: string, alpha = 1) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const spacing = [
  "--space-1", "--space-2", "--space-3", "--space-4", "--space-6",
  "--space-8", "--space-12", "--space-16", "--space-24", "--space-32",
];

export default function SystemsPage() {
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.head}>
        <Text variant="eyebrow">Design System</Text>
        <Text as="h1" variant="h1">
          Systems
        </Text>
        <Text variant="body-m" className={styles.intro}>
          The single reference for site-wide primitives. Everything here is
          driven by the tokens in <code>styles/tokens.css</code> — change a value
          there and it updates across this page and the whole site.
        </Text>
      </header>

      {/* Typography */}
      <Section id="type" title="Typography">
        <div className={styles.typeList}>
          {typeScale.map((t) => (
            <TypeSpecimen
              key={t.variant}
              variant={t.variant}
              label={t.label}
              token={t.token}
            />
          ))}
        </div>
      </Section>

      {/* Color */}
      <Section id="color" title="Color">
        <Text variant="small" className={styles.note}>
          The palette below holds the only raw hex values in the system.
          Components never use them directly — they use the roles underneath,
          which map onto these colors.
        </Text>

        <div className={styles.swatches}>
          {palette.map((c) => (
            <div key={c.token} className={styles.swatch}>
              <div
                className={styles.chip}
                style={{ background: `var(${c.token})` }}
              />
              <div className={styles.swatchMeta}>
                <span className={styles.swatchName}>{c.name}</span>
                <span className={styles.swatchValue}>{c.hex}</span>
                <span className={styles.swatchValue}>{hexToRgba(c.hex)}</span>
                <code className={styles.swatchToken}>{c.token}</code>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.roles}>
          <Text variant="eyebrow" as="h3" className={styles.rolesHead}>
            Roles
          </Text>
          <ul className={styles.roleList}>
            {roles.map((r) => (
              <li key={r.token} className={styles.roleRow}>
                <span
                  className={styles.roleChip}
                  style={{ background: `var(${r.token})` }}
                />
                <code className={styles.roleToken}>{r.token}</code>
                <span className={styles.roleName}>{r.role}</span>
                <span className={styles.roleMaps}>{r.maps}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Buttons */}
      <Section id="buttons" title="Buttons">
        <div className={styles.group}>
          <div className={styles.variantRow}>
            <Button variant="solid">Solid</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className={styles.variantRow}>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className={styles.variantRow}>
            <Button href="/" variant="outline">
              As a link ↗
            </Button>
          </div>
        </div>
      </Section>

      {/* Spacing */}
      <Section id="spacing" title="Spacing scale">
        <div className={styles.spacingList}>
          {spacing.map((s) => (
            <div key={s} className={styles.spacingRow}>
              <div
                className={styles.spacingBar}
                style={{ width: `var(${s})` }}
              />
              <code>{s}</code>
            </div>
          ))}
        </div>
      </Section>

      {/* Navigation */}
      <Section id="nav" title="Navigation">
        <Text variant="small" className={styles.note}>
          The global nav (top of every page) and footer read from{" "}
          <code>lib/site.ts</code>. Edit links, brand, and contact there. Nav
          items sit left, the logo right. Height is <code>--nav-height</code>{" "}
          (96px); side margins come from <code>--page-gutter</code> (24px mobile,
          64px from 768px up), shared with page content so the two stay aligned.
        </Text>
        <div className={styles.navPreview}>
          <span className={styles.navLinks}>
            <span>Work</span>
            <span>About</span>
          </span>
          <Logo className={styles.navLogo} />
        </div>
      </Section>

      {/* Footer */}
      <Section id="footer" title="Footer">
        <Text variant="small" className={styles.note}>
          Global — mounted in <code>components/Chrome.tsx</code> so it closes
          every page, and visible live at the bottom of this one. A full-bleed{" "}
          <code>--color-magma</code> block with ink text, kept deliberately tall:
          the top padding is most of what gives it presence. Contact and social
          links are centred and read from <code>lib/site.ts</code>, stacking
          below 768px.
        </Text>
        <Text variant="small" className={styles.note}>
          The studio line is built from the same source and set with{" "}
          <code>FluidHeadline</code>, which measures the string offscreen and
          solves for the font-size that spans the container exactly — so it
          stays on one line and scales with the viewport at every width rather
          than stepping between breakpoints. Because it is measured, the em
          spaces around the bullet and the uppercasing both have to apply to the
          measurer as well as the visible text.
        </Text>
      </Section>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal as="section" id={id} className={styles.section}>
      <div className={styles.sectionHead}>
        <Text variant="eyebrow">{title}</Text>
      </div>
      {children}
    </Reveal>
  );
}
