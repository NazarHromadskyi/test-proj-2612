"use client";

import Link from "next/link";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

type FormState = {
  name: string;
  age: string;
  description: string;
};

export default function Home() {
  const [form, setForm] = useState<FormState>({
    name: "",
    age: "",
    description: "",
  });
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onChange =
    (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setRequestId(null);

    const payload = {
      name: form.name.trim(),
      age: Number(form.age),
      description: form.description.trim(),
    };

    if (!payload.name || !payload.description || Number.isNaN(payload.age)) {
      setError("Please fill name, age, and description.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => ({}))) as {
        requestId?: string;
        message?: string;
      };

      if (!response.ok || !data.requestId) {
        setError(data.message ?? "Request failed. Please try again.");
        return;
      }

      setRequestId(data.requestId);
      setForm({ name: "", age: "", description: "" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-slate-900">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-32 top-12 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,#f5b657,transparent_65%)] blur-2xl" />
        <div className="pointer-events-none absolute right-10 top-32 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,#7dd3fc,transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,#e9a8ff,transparent_65%)] blur-3xl" />
        <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-12 px-6 py-16 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:px-10">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-1 text-sm">
              <span className="font-[var(--font-display)] text-lg">Async</span>
              <span className="text-slate-600">AI analysis, no waiting</span>
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Submit a person profile and get an insight later.
            </h1>
            <p className="max-w-lg text-lg text-slate-700">
              We queue the request, process it in the background, and let you
              check the status by request ID.
            </p>
            <form
              onSubmit={onSubmit}
              className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.6)] backdrop-blur"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Name
                  <input
                    value={form.name}
                    onChange={onChange("name")}
                    className="h-11 rounded-xl border border-black/10 bg-white px-4 text-base outline-none ring-orange-300 transition focus:ring-2"
                    placeholder="Olena"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Age
                  <input
                    value={form.age}
                    onChange={onChange("age")}
                    className="h-11 rounded-xl border border-black/10 bg-white px-4 text-base outline-none ring-orange-300 transition focus:ring-2"
                    placeholder="27"
                    inputMode="numeric"
                    required
                  />
                </label>
              </div>
              <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
                Short description
                <textarea
                  value={form.description}
                  onChange={onChange("description")}
                  className="min-h-[120px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none ring-orange-300 transition focus:ring-2"
                  placeholder="A curious product designer who loves cycling."
                  required
                />
              </label>
              {error && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                {submitting ? "Submitting..." : "Start async analysis"}
              </button>
            </form>
          </section>

          <aside className="flex flex-col gap-6">
            <div className="rounded-3xl border border-black/10 bg-white/70 p-6">
              <h2 className="font-[var(--font-display)] text-2xl">
                Track your request
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                When the API responds, you&apos;ll get a request ID. Use it to
                check the result page anytime.
              </p>
              {requestId ? (
                <div className="mt-4 rounded-2xl border border-black/10 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Request ID
                  </p>
                  <p className="mt-1 font-mono text-sm">{requestId}</p>
                  <Link
                    className="mt-3 inline-flex text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
                    href={`/result/${requestId}`}
                  >
                    View status →
                  </Link>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  No request submitted yet.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-black/10 bg-slate-900 p-6 text-white">
              <p className="text-sm uppercase tracking-wide text-white/70">
                Live endpoint
              </p>
              <p className="mt-2 break-all text-lg font-semibold">
                {apiBaseUrl}
              </p>
              <p className="mt-3 text-sm text-white/70">
                You can override this with{" "}
                <span className="font-mono">NEXT_PUBLIC_API_BASE_URL</span>.
              </p>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
