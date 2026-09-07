"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(payload.message ?? "Unable to create an account.");
      setIsLoading(false);
      return;
    }

    const loginResult = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setIsLoading(false);

    if (!loginResult?.ok) {
      router.push("/login");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f2e9] px-6 py-16 text-[#332a22]">
      <section className="w-full max-w-md rounded-2xl border border-[#dfd2be] bg-[#fffdf8] p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#6b4b30]">Waste Weavers</p>
        <h1 className="mt-4 font-serif text-4xl">Create your account</h1>
        <p className="mt-3 text-sm leading-6 text-[#68584a]">Your new account starts with customer access.</p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            Name
            <input required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-lg border border-[#cdbb9f] bg-white px-3 py-2.5 outline-none focus:border-[#6b4b30]" />
          </label>
          <label className="block text-sm font-medium">
            Email
            <input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 w-full rounded-lg border border-[#cdbb9f] bg-white px-3 py-2.5 outline-none focus:border-[#6b4b30]" />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input required type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-2 w-full rounded-lg border border-[#cdbb9f] bg-white px-3 py-2.5 outline-none focus:border-[#6b4b30]" />
          </label>
          <label className="block text-sm font-medium">
            Confirm password
            <input required type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} className="mt-2 w-full rounded-lg border border-[#cdbb9f] bg-white px-3 py-2.5 outline-none focus:border-[#6b4b30]" />
          </label>
          <p className="text-xs leading-5 text-[#68584a]">Use at least 8 characters, including a letter and a number.</p>
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <button disabled={isLoading} type="submit" className="w-full rounded-lg bg-[#5f4630] px-4 py-3 text-sm font-medium text-white disabled:opacity-60">
            {isLoading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-sm text-[#68584a]">
          Already registered? <a className="font-medium text-[#5f4630] underline" href="/login">Sign in</a>
        </p>
      </section>
    </main>
  );
}
