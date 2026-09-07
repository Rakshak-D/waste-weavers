"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AddToCartButtonProps = {
  productId: string;
  itemType: "PURCHASE" | "RENTAL";
  quantity: number;
  startDate?: string;
  endDate?: string;
  label: string;
};

export function AddToCartButton({ productId, itemType, quantity, startDate, endDate, label }: AddToCartButtonProps) {
  const router = useRouter();
  const [selectedQuantity, setSelectedQuantity] = useState(quantity);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function addToCart() {
    setState("loading");
    setMessage(null);
    try {
      const response = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, itemType, quantity: selectedQuantity, startDate, endDate }) });
      const payload: unknown = await response.json();
      if (response.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!response.ok) throw new Error(payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string" ? payload.message : "Could not add this item to your cart.");
      setState("success");
      setMessage("Added to cart.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not add this item to your cart.");
    }
  }

  return <div className="flex flex-1 gap-3">{itemType === "PURCHASE" && <label className="text-xs text-[#665548]">Qty<input aria-label="Purchase quantity" type="number" min="1" max="100" value={selectedQuantity} onChange={(event) => setSelectedQuantity(Math.min(100, Math.max(1, Number(event.target.value) || 1)))} className="mt-1 block w-16 border border-[#cdbb9f] bg-transparent px-2 py-3 text-center text-sm text-[#332a22] outline-none focus:border-[#5f4630]" /></label>}<div className="flex-1"><button type="button" onClick={addToCart} disabled={state === "loading"} className="w-full bg-[#5f4630] px-5 py-3 text-sm font-medium text-[#fffdf8] transition hover:bg-[#332a22] disabled:cursor-wait disabled:opacity-60">{state === "loading" ? "Adding…" : state === "success" ? "Added to cart" : label}</button>{message && <p className={`mt-2 text-xs ${state === "error" ? "text-[#7c332a]" : "text-[#5e4b3a]"}`} role="status">{message}</p>}</div></div>;
}
