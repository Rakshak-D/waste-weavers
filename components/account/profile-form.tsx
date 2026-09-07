"use client";

import { useState } from "react";

type Profile = { name: string | null; email: string; phone: string | null };

export function ProfileForm({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true); setMessage(null);
    try {
      const response = await fetch("/api/account/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Profile could not be updated.");
      setMessage("Profile saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Profile could not be updated."); } finally { setSaving(false); }
  }
  return <div className="mt-10 max-w-xl border-t border-[#cdbb9f] pt-6"><div className="grid gap-5"><label className="text-sm font-medium">Name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full border-b border-[#cdbb9f] bg-transparent px-1 py-3 outline-none focus:border-[#5f4630]" /></label><label className="text-sm font-medium">Email<input value={profile.email} readOnly className="mt-2 w-full border-b border-[#cdbb9f] bg-[#eadfce]/40 px-1 py-3 text-[#665548] outline-none" /><span className="mt-2 block text-xs text-[#665548]">Email is read-only until verification and account-change flows are implemented.</span></label><label className="text-sm font-medium">Phone<input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full border-b border-[#cdbb9f] bg-transparent px-1 py-3 outline-none focus:border-[#5f4630]" /></label></div><div className="mt-6 flex items-center gap-4"><button type="button" onClick={save} disabled={saving} className="bg-[#5f4630] px-5 py-3 text-sm font-medium text-[#fffdf8] disabled:opacity-60">{saving ? "Saving…" : "Save profile"}</button>{message && <p className="text-sm text-[#5e4b3a]" role="status">{message}</p>}</div></div>;
}

