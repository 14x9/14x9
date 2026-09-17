import type { Metadata } from "next";
import Mercury from "@/components/ai/Mercury";

export const metadata: Metadata = {
  title: "AI 01 — Mercury",
  description: "An experiment in liquid metal. 14x9.",
};

export default function AI01() {
  return <Mercury />;
}
