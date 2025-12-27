"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

type AnalyzeResponse = {
  status?: string;
  result?: string;
  error?: string;
  requestId?: string;
};

export default function ResultPage() {
  const params = useParams<{ id: string }>();
  const requestId = params?.id;
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!requestId) return;
    let mounted = true;

    const load = async () => {
      setError(null);
      try {
        const response = await fetch(`${apiBaseUrl}/analyze/${requestId}`);
        const payload = (await response.json().catch(() => ({}))) as
          | AnalyzeResponse
          | { message?: string };

        if (!response.ok) {
          throw new Error(
            "message" in payload && payload.message
              ? payload.message
              : "Failed to fetch status."
          );
        }

        if (mounted) {
          setData(payload as AnalyzeResponse);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (mounted) {
          const message = err instanceof Error ? err.message : "Network error";
          setError(message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, 3000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [requestId]);

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-slate-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Request
            </p>
            <h1 className="text-3xl font-semibold">{requestId}</h1>
          </div>
          <Link
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-white/80"
            href="/"
          >
            ← Back to form
          </Link>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.6)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <p className="text-2xl font-semibold">
                {loading ? "Loading…" : data?.status ?? "unknown"}
              </p>
            </div>
            <div className="text-xs text-slate-500">
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString()}`
                : "Waiting for first update"}
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {data?.result && (
            <div className="mt-6">
              <p className="text-sm text-slate-600">Result</p>
              <p className="mt-2 whitespace-pre-wrap text-lg leading-relaxed">
                {data.result}
              </p>
            </div>
          )}

          {data?.error && !data?.result && (
            <div className="mt-6">
              <p className="text-sm text-slate-600">Error</p>
              <p className="mt-2 text-lg text-red-700">{data.error}</p>
            </div>
          )}

          {!loading && !data?.result && !data?.error && (
            <p className="mt-6 text-sm text-slate-500">
              Still processing. This page refreshes automatically.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-black/10 bg-slate-900 p-6 text-white">
          <p className="text-sm uppercase tracking-wide text-white/70">
            Endpoint used
          </p>
          <p className="mt-2 break-all text-lg font-semibold">
            {apiBaseUrl}/analyze/{requestId}
          </p>
        </div>
      </div>
    </div>
  );
}
