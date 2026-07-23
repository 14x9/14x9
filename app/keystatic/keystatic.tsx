"use client";

import { makePage } from "@keystatic/next/ui/app";
import config from "@/keystatic.config";

// The Keystatic admin UI (client-only). Rendered by the catch-all route below.
export default makePage(config);
