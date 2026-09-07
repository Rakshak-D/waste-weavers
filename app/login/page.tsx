"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsLoading(false);
    if (!result?.ok) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f2e9] px-6 py-16 text-[#332a22]">
      <section className="w-full max-w-md rounded-2xl border border-[#dfd2be] bg-[#fffdf8] p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#6b4b30]">Waste Weavers</p>
        <h1 className="mt-4 font-serif text-4xl">Welcome back</h1>
        <p className="mt-3 text-sm leading-6 text-[#68584a]">Sign in to access your account.</p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#cdbb9f] bg-white px-3 py-2.5 outline-none focus:border-[#6b4b30]"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#cdbb9f] bg-white px-3 py-2.5 outline-none focus:border-[#6b4b30]"
            />
          </label>
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <button
            disabled={isLoading}
            type="submit"
            className="w-full rounded-lg bg-[#5f4630] px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {isLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-sm text-[#68584a]">
          New to Waste Weavers? <a className="font-medium text-[#5f4630] underline" href="/register">Create an account</a>
        </p>
      </section>
    </main>
  );
}
