"use client";

import { useEffect, useRef } from "react";
import styles from "./Mercury.module.css";

/**
 * Liquid-mercury experiment (14x9.com/ai/01).
 *
 * A cohesive blob of metaballs is simulated on the CPU (a dozen soft bodies
 * held together by cohesion + mutual repulsion) and rendered on the GPU as a
 * single chrome surface: the metaball field is thresholded into a surface, a
 * pseudo-3D normal is reconstructed from the field gradient, and that normal
 * reflects a procedural studio environment — the bright soft highlights and
 * silvery falloff that read as liquid metal.
 *
 * Interaction:
 *  - Desktop: the cursor is an attractor; the mercury chases and sloshes.
 *  - Mobile: device tilt sets the gravity vector (mercury rolls downhill) and
 *    a tap sends a splash impulse. First tap also asks for motion permission.
 * The mass is clamped by its radius on every wall, so it collides with the
 * browser edges like a hard box and never leaves the page.
 */

const COUNT = 12; // metaball slots sent to the shader (must match the GLSL loop)

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  u_res;      // device px
uniform float u_time;
uniform vec3  u_blobs[${COUNT}]; // xy = center (device px), z = radius (device px)

const float THRESH  = 0.35;  // surface iso-level of the merged weight field
const float SUPPORT = 1.7;    // weight reach as a multiple of blob radius (controls necking)

// Procedural studio environment sampled by a reflection direction.
// Built to read as polished liquid metal: a high-contrast silver gradient with
// a dark reflection band and two crisp key lights, so the surface shows bright
// hotspots rolling over deep grey rather than a flat matte fill.
vec3 envColor(vec3 r) {
  float y = clamp(r.y * 0.5 + 0.5, 0.0, 1.0);

  // Vertical studio gradient — luminous top, deep charcoal floor.
  vec3 floorC = vec3(0.015, 0.018, 0.022);
  vec3 lowC   = vec3(0.13, 0.14, 0.16);
  vec3 midC   = vec3(0.34, 0.36, 0.40);
  vec3 highC  = vec3(0.86, 0.88, 0.93);
  vec3 base = mix(floorC, lowC, smoothstep(0.0, 0.25, y));
  base = mix(base, midC, smoothstep(0.22, 0.6, y));
  base = mix(base, highC, smoothstep(0.62, 0.96, y));

  // Dark reflection band sweeping across the body — the arc that makes chrome
  // read as chrome. Carved below the horizon (kept clear of the crown so the
  // dead-center of the dome doesn't collapse to a dark pinch).
  float band = smoothstep(0.12, 0.0, abs(y - 0.30));
  base *= 1.0 - band * 0.45;

  // Broad soft key light, high and to the right.
  vec3 key = normalize(vec3(0.42, 0.80, 0.45));
  float k = pow(max(dot(r, key), 0.0), 20.0);
  base += vec3(1.0, 0.99, 0.96) * k * 1.4;

  // Cool fill light, lower left — keeps the shadow side from going dead.
  vec3 fill = normalize(vec3(-0.6, -0.05, 0.55));
  float f = pow(max(dot(r, fill), 0.0), 8.0);
  base += vec3(0.5, 0.56, 0.7) * f * 0.5;

  // Thin bright horizon line — the classic chrome "waistline".
  base += vec3(0.95) * smoothstep(0.05, 0.0, abs(r.y)) * 0.5;

  return base;
}

void main() {
  vec2 p = gl_FragCoord.xy;

  // Each blob contributes (a) a smooth weight for the merged silhouette and for
  // blending, and (b) its own analytic hemisphere normal. Blending clean sphere
  // domes by weight melts overlapping blobs into one liquid surface with no
  // field-gradient artifacts (no gear teeth, no per-center dots) — the mercury
  // stays smooth wherever beads meet.
  float field = 0.0;
  vec3  nAccum = vec3(0.0);

  for (int i = 0; i < ${COUNT}; i++) {
    float R = u_blobs[i].z;
    if (R <= 0.0) continue;
    vec2 d = p - u_blobs[i].xy;
    float dist = length(d);

    // Merge weight: smooth, finite support a little wider than the bead so
    // neighbours bulge a neck between them.
    float q2 = dot(d, d) / (R * SUPPORT * R * SUPPORT);
    if (q2 < 1.0) {
      float a = 1.0 - q2;
      float w = a * a;
      field += w;

      // Analytic sphere-dome normal for this bead (z from a hemisphere of
      // radius R; outside the bead the surface is flat/side-on).
      float rr = min(dist / R, 1.0);
      float z = sqrt(max(0.0, 1.0 - rr * rr));
      vec3 ni = normalize(vec3(d / R, z + 0.001));
      nAccum += ni * w;
    }
  }

  // Antialiased silhouette mask around the iso-level.
  float aa = fwidth(field) + 1e-4;
  float mask = smoothstep(THRESH - aa, THRESH + aa, field);
  if (mask <= 0.001) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec3 n = normalize(nAccum);

  vec3 view = vec3(0.0, 0.0, 1.0);
  vec3 refl = reflect(-view, n);

  vec3 col = envColor(refl);

  // Fresnel rim light — the bright silver lip where the surface turns away.
  float fres = pow(1.0 - max(n.z, 0.0), 4.0);
  col += vec3(0.95, 0.96, 1.0) * fres * 0.55;

  // Two tight specular glints for that wet, polished-metal snap.
  vec3 L1 = normalize(vec3(0.32, 0.55, 0.78));
  float s1 = pow(max(dot(refl, L1), 0.0), 90.0);
  vec3 L2 = normalize(vec3(-0.4, -0.3, 0.85));
  float s2 = pow(max(dot(refl, L2), 0.0), 140.0);
  col += vec3(1.0) * s1 * 1.2 + vec3(0.9, 0.94, 1.0) * s2 * 0.7;

  // Filmic-ish rolloff — protects the hotspots from clipping to flat white
  // while keeping the deep greys, so contrast stays metallic.
  col = col / (col + vec3(0.5)) * 1.5;
  col = pow(col, vec3(0.9));

  // Ordered-ish dither to kill banding on the dark falloff.
  float dither = fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  col += (dither - 0.5) / 255.0;

  gl_FragColor = vec4(col * mask, 1.0);
}
`;

type Blob = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number; // css px
};

export default function Mercury() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    gl.getExtension("OES_standard_derivatives");

    // ---- shader program ---------------------------------------------------
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    // OES_standard_derivatives needs the pragma in WebGL1.
    gl.attachShader(
      prog,
      compile(gl.FRAGMENT_SHADER, "#extension GL_OES_standard_derivatives : enable\n" + FRAG),
    );
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uBlobs = gl.getUniformLocation(prog, "u_blobs");

    // ---- sizing -----------------------------------------------------------
    let W = 0;
    let H = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    // ---- simulation -------------------------------------------------------
    const blobs: Blob[] = [];
    const cx = W / 2;
    const cy = H / 2;
    // A few large overlapping beads read as one elegant mercury mass with soft
    // lobes (like the reference), rather than a busy cauliflower. Extra shader
    // slots are parked with radius 0 so they contribute nothing.
    const ACTIVE = 6;
    // Scale the mercury to the viewport so it reads the same on a phone and a
    // wide desktop.
    const scale = Math.max(0.6, Math.min(1.15, Math.min(W, H) / 820));
    for (let i = 0; i < COUNT; i++) {
      if (i >= ACTIVE) {
        blobs.push({ x: cx, y: cy, vx: 0, vy: 0, r: 0 });
        continue;
      }
      const a = (i / (ACTIVE - 1)) * Math.PI * 2;
      const rad = i === 0 ? 0 : 66 * scale;
      blobs.push({
        x: cx + Math.cos(a) * rad,
        y: cy + Math.sin(a) * rad,
        vx: 0,
        vy: 0,
        r: (i === 0 ? 92 : 66 + (i % 3) * 6) * scale,
      });
    }

    // Interaction state
    const pointer = { x: cx, y: cy, active: false, strength: 0 };
    const gravity = { x: 0, y: 0 }; // px/s^2, from device tilt on mobile
    let hasMotion = false;

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      pointer.strength = 1;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) onLeave();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onOut);

    // Tap / click → splash impulse outward from the point.
    const splash = (x: number, y: number) => {
      for (const b of blobs) {
        const dx = b.x - x;
        const dy = b.y - y;
        const d = Math.hypot(dx, dy) + 1;
        const f = Math.min(900, 90000 / d);
        b.vx += (dx / d) * f;
        b.vy += (dy / d) * f;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      splash(e.clientX, e.clientY);
      if (!hasMotion) enableMotion();
    };
    window.addEventListener("pointerdown", onPointerDown);

    // Device tilt → gravity (mobile). iOS needs a permission gesture.
    const onOrient = (e: DeviceOrientationEvent) => {
      const g = 2400;
      // gamma: left/right (-90..90), beta: front/back (-180..180)
      const gx = (e.gamma ?? 0) / 90;
      const gy = (e.beta ?? 0) / 90;
      gravity.x = gx * g;
      gravity.y = gy * g;
    };
    const enableMotion = () => {
      hasMotion = true;
      const D = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (D && typeof D.requestPermission === "function") {
        D.requestPermission()
          .then((s) => {
            if (s === "granted")
              window.addEventListener("deviceorientation", onOrient);
          })
          .catch(() => {});
      } else {
        window.addEventListener("deviceorientation", onOrient);
      }
    };

    // ---- physics step -----------------------------------------------------
    const blobData = new Float32Array(COUNT * 3);
    let last = performance.now();
    let raf = 0;

    const step = (now: number) => {
      let dt = (now - last) / 1000;
      last = now;
      dt = Math.min(dt, 1 / 30); // clamp to keep the sim stable on hitches

      // Centroid for cohesion (active beads only).
      let mx = 0;
      let my = 0;
      for (let i = 0; i < ACTIVE; i++) {
        mx += blobs[i].x;
        my += blobs[i].y;
      }
      mx /= ACTIVE;
      my /= ACTIVE;

      const usePointer = pointer.active || pointer.strength > 0.01;
      pointer.strength *= 0.94;

      for (let i = 0; i < ACTIVE; i++) {
        const b = blobs[i];
        let fx = 0;
        let fy = 0;

        // Cohesion — hold the mass together around its centroid.
        fx += (mx - b.x) * 6.0;
        fy += (my - b.y) * 6.0;

        // Mutual repulsion — keep the puddle voluminous instead of collapsing.
        for (let j = 0; j < ACTIVE; j++) {
          if (i === j) continue;
          const o = blobs[j];
          const dx = b.x - o.x;
          const dy = b.y - o.y;
          const d2 = dx * dx + dy * dy + 1;
          const rest = (b.r + o.r) * 0.62;
          if (d2 < rest * rest) {
            const d = Math.sqrt(d2);
            const push = (rest - d) * 26;
            fx += (dx / d) * push;
            fy += (dy / d) * push;
          }
        }

        // Cursor attraction (desktop) — the mercury chases the pointer.
        if (usePointer) {
          fx += (pointer.x - b.x) * 9.0 * (pointer.active ? 1 : pointer.strength);
          fy += (pointer.y - b.y) * 9.0 * (pointer.active ? 1 : pointer.strength);
        }

        // Gravity (mobile tilt).
        fx += gravity.x;
        fy += gravity.y;

        b.vx += fx * dt;
        b.vy += fy * dt;

        // Damping — viscous, mercury settles rather than jitters.
        b.vx *= 0.9;
        b.vy *= 0.9;

        // Speed cap.
        const sp = Math.hypot(b.vx, b.vy);
        const cap = 2600;
        if (sp > cap) {
          b.vx = (b.vx / sp) * cap;
          b.vy = (b.vy / sp) * cap;
        }

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Hard-box walls — clamp by radius and bounce with restitution.
        const e = 0.42;
        if (b.x < b.r) {
          b.x = b.r;
          b.vx = Math.abs(b.vx) * e;
        } else if (b.x > W - b.r) {
          b.x = W - b.r;
          b.vx = -Math.abs(b.vx) * e;
        }
        if (b.y < b.r) {
          b.y = b.r;
          b.vy = Math.abs(b.vy) * e;
        } else if (b.y > H - b.r) {
          b.y = H - b.r;
          b.vy = -Math.abs(b.vy) * e;
        }

        blobData[i * 3] = b.x * dpr;
        blobData[i * 3 + 1] = (H - b.y) * dpr; // flip Y for gl_FragCoord
        blobData[i * 3 + 2] = b.r * dpr;
      }

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, now / 1000);
      gl.uniform3fv(uBlobs, blobData);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
