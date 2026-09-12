import { headers } from "next/headers";
import { BriefingView, type BriefingResponse } from "@/components/BriefingView";
import { RefreshButton } from "@/components/RefreshButton";

type BriefingResult =
  | { ok: true; data: BriefingResponse }
  | { ok: false; error: string };

/**
 * Server Component 內打自己的 /api/briefing（同一個 server），
 * 用 request 的 host header 組出絕對網址（Next.js 的 fetch 不支援相對路徑）。
 */
async function getBriefing(): Promise<BriefingResult> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = `${proto}://${host}`;

  try {
    const res = await fetch(`${base}/api/briefing`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json?.error ?? `API 回應 ${res.status}` };
    }
    return { ok: true, data: json as BriefingResponse };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "未知錯誤" };
  }
}

export default async function Home() {
  const result = await getBriefing();

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-2xl px-4 py-10 sm:px-6">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              📬 每日簡報
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              天氣・元大金股價・金融股新聞・AI 統整
            </p>
          </div>
          <RefreshButton />
        </header>

        {result.ok ? (
          <BriefingView data={result.data} />
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            ⚠️ 讀取失敗：{result.error}
          </div>
        )}
      </main>
    </div>
  );
}
