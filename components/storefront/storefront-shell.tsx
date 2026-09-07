import type { ReactNode } from "react";

import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";

export async function StorefrontShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f2e9] text-[#332a22]">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
