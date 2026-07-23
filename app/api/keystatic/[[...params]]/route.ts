import { makeRouteHandler } from "@keystatic/next/route-handler";
import config from "@/keystatic.config";

/**
 * Backing API for the Keystatic admin (reads/writes local content files).
 *
 * Disabled in production builds. Storage is `local`, so this only works on a
 * dev machine anyway — it writes to the filesystem, which is read-only and
 * wiped on every deploy on a hosted runtime. More importantly, Keystatic's
 * local mode has no authentication of any kind, so leaving it reachable would
 * put an open admin API on the live domain.
 *
 * Authoring flow is therefore: edit locally, commit what it writes, push.
 * See "Publishing" in the README.
 */
const handlers = makeRouteHandler({ config });

const gone = () => new Response("Not found", { status: 404 });

// `process.env.NODE_ENV` is inlined at build time, so the real handlers are
// eliminated from the production bundle rather than just guarded at runtime.
const isProd = process.env.NODE_ENV === "production";

export const GET = isProd ? gone : handlers.GET;
export const POST = isProd ? gone : handlers.POST;
