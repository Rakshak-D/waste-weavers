import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waste Weavers",
  description: "Circular event décor made from upcycled post-consumer textiles.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
