"use client";

import { usePathname } from "next/navigation";
import Nav from "./Nav";
import Footer from "./Footer";
import BottomBlur from "./BottomBlur";

/**
 * Site chrome (nav + footer) around page content — hidden on the Keystatic
 * admin (`/keystatic`) so the CMS renders on its own.
 */
export default function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/keystatic")) return <>{children}</>;
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
      <BottomBlur />
    </>
  );
}
