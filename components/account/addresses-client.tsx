"use client";

import { useState } from "react";

type Address = { id: string; label: string | null; recipientName: string | null; line1: string; line2: string | null; city: string; state: string; postalCode: string; country: string; phone: string | null };
type AddressForm = { label: string; recipientName: string; line1: string; line2: string; city: string; state: string; postalCode: string; country: string; phone: string };
const emptyForm: AddressForm = { label: "", recipientName: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "IN", phone: "" };

function formFromAddress(address: Address): AddressForm { return { label: address.label ?? "", recipientName: address.recipientName ?? "", line1: address.line1, line2: address.line2 ?? "", city: address.city, state: address.state, postalCode: address.postalCode, country: address.country, phone: address.phone ?? "" }; }

export function AddressesClient({ initialAddresses }: { initialAddresses: Address[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  function update(field: keyof AddressForm, value: string) { setForm((current) => ({ ...current, [field]: value })); }
  async function save() {
    setSaving(true); setMessage(null);
    try {
      const response = await fetch(editing ? `/api/account/addresses/${editing}` : "/api/account/addresses", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Address could not be saved.");
      if (editing) setAddresses((current) => current.map((address) => address.id === editing ? payload : address)); else setAddresses((current) => [payload, ...current]);
      setEditing(null); setForm(emptyForm); setMessage("Address saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Address could not be saved."); } finally { setSaving(false); }
  }
  async function remove(id: string) {
    setMessage(null);
    const response = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    if (response.ok) setAddresses((current) => current.filter((address) => address.id !== id)); else setMessage("Address could not be deleted.");
  }
  return <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_0.9fr]"><section><div className="border-t border-[#cdbb9f]">{addresses.length ? addresses.map((address) => <article key={address.id} className="border-b border-[#dfd2be] py-6"><div className="flex flex-wrap justify-between gap-4"><div><p className="font-medium">{address.label || "Saved address"}</p><p className="mt-2 text-sm leading-6 text-[#68584a]">{address.recipientName}<br />{address.line1}{address.line2 ? <><br />{address.line2}</> : null}<br />{address.city}, {address.state} {address.postalCode}</p></div><div className="flex gap-4 text-sm"><button type="button" onClick={() => { setEditing(address.id); setForm(formFromAddress(address)); }} className="nav-link">Edit</button><button type="button" onClick={() => remove(address.id)} className="text-[#7c332a] underline underline-offset-4">Delete</button></div></div></article>) : <div className="border-y border-[#dfd2be] py-12"><p className="font-serif text-2xl">No saved addresses.</p><p className="mt-2 text-sm text-[#665548]">Add one for faster checkout.</p></div>}</div></section><section className="border border-[#cdbb9f] bg-[#fffdf8] p-6"><p className="eyebrow">{editing ? "Edit address" : "New address"}</p><div className="mt-5 grid gap-4">{(["label", "recipientName", "line1", "line2", "city", "state", "postalCode", "phone"] as const).map((field) => <label key={field} className="text-sm font-medium">{field === "recipientName" ? "Recipient name" : field === "postalCode" ? "Postal code" : field === "line1" ? "Address line 1" : field === "line2" ? "Address line 2" : field === "phone" ? "Phone" : field.charAt(0).toUpperCase() + field.slice(1)}<input value={form[field]} onChange={(event) => update(field, event.target.value)} className="mt-2 w-full border-b border-[#cdbb9f] bg-transparent px-1 py-2 outline-none focus:border-[#5f4630]" /></label>)}<label className="text-sm font-medium">Country<input value={form.country} maxLength={2} onChange={(event) => update("country", event.target.value.toUpperCase())} className="mt-2 w-full border-b border-[#cdbb9f] bg-transparent px-1 py-2 uppercase outline-none focus:border-[#5f4630]" /></label></div><div className="mt-6 flex gap-3"><button type="button" onClick={save} disabled={saving} className="bg-[#5f4630] px-5 py-3 text-sm font-medium text-[#fffdf8] disabled:opacity-60">{saving ? "Saving…" : editing ? "Update address" : "Add address"}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }} className="border border-[#6b4b30] px-5 py-3 text-sm font-medium text-[#5f4630]">Cancel</button>}</div>{message && <p className="mt-4 text-sm text-[#5e4b3a]" role="status">{message}</p>}</section></div>;
}

