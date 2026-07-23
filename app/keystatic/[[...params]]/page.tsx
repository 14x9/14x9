import { notFound } from "next/navigation";
import KeystaticApp from "../keystatic";

/**
 * The Keystatic admin UI. Local-only — see the route handler at
 * app/api/keystatic/[[...params]]/route.ts for why it must not ship.
 */
export default function KeystaticAdmin() {
  if (process.env.NODE_ENV === "production") notFound();
  return <KeystaticApp />;
}
