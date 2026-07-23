"use client";

import { useState } from "react";
import {
  SUN_DEFAULTS,
  SUN_GROUPS,
  type SunSettings,
} from "./sunSettings";
import styles from "./SunControls.module.css";

export type SunStats = {
  fps: number;
  ms: number;
  particles: number;
  idle: boolean;
};

/**
 * Dev-only console for tuning the sun, mounted at /about?sun. Not reachable
 * without the query param, so it never renders for a visitor.
 *
 * Frame time is the number to watch: it only reads while the field is moving,
 * so hover the sun to load it up. Particle count scales with 1/dotSize², which
 * is the main thing trading crispness against cost.
 */
export default function SunControls({
  settings,
  stats,
  onChange,
  onClose,
}: {
  settings: SunSettings;
  stats: SunStats;
  onChange: (next: SunSettings) => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const set = (key: keyof SunSettings, value: number) =>
    onChange({ ...settings, [key]: value });

  const copy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <aside className={styles.panel}>
      <header className={styles.head}>
        <strong className={styles.title}>Sun</strong>
        <button className={styles.close} onClick={onClose} type="button">
          hide
        </button>
      </header>

      <dl className={styles.stats}>
        <div>
          <dt>dots</dt>
          <dd>{stats.particles.toLocaleString()}</dd>
        </div>
        <div>
          <dt>fps</dt>
          <dd>{stats.idle ? "idle" : stats.fps}</dd>
        </div>
        <div>
          <dt>ms/frame</dt>
          <dd data-warn={stats.ms > 10 || undefined}>
            {stats.idle ? "—" : stats.ms.toFixed(2)}
          </dd>
        </div>
      </dl>
      <p className={styles.hint}>Hover the sun to measure.</p>

      {SUN_GROUPS.map((group) => (
        <section key={group.title} className={styles.group}>
          <h3 className={styles.groupTitle}>{group.title}</h3>
          {group.fields.map((field) => (
            <label key={field.key} className={styles.row}>
              <span className={styles.label}>{field.label}</span>
              <span className={styles.value}>{settings[field.key]}</span>
              <input
                className={styles.slider}
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={settings[field.key]}
                onChange={(e) => set(field.key, Number(e.target.value))}
              />
            </label>
          ))}
        </section>
      ))}

      <footer className={styles.foot}>
        <button type="button" onClick={() => onChange(SUN_DEFAULTS)}>
          Reset
        </button>
        <button type="button" onClick={copy}>
          {copied ? "Copied" : "Copy JSON"}
        </button>
      </footer>
    </aside>
  );
}
