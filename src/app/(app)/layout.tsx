import type { Metadata } from "next";
import type React from "react";

import { RootLayout } from "@/components/layouts/root-layout";
import { metadata as defaultMetadata } from "@/config/metadata";

export const metadata: Metadata = {
  ...defaultMetadata,
  manifest: "/manifest.json", // Ensure this path is correct
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootLayout>{children}</RootLayout>;
}
