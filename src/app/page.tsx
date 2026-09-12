import { headers } from "next/headers";
import { BriefingView, type BriefingResponse } from "@/components/BriefingView";
import { RefreshButton } from "@/components/RefreshButton";

interface BriefingLogItem extends BriefingResponse {
  id: string;
  to: string;
  resendEmailId: string;
  createdAt: string;
}

type LogsResult =
  | { ok: true; logs: BriefingLogItem[] }
  | { ok: false; error: string };

/**
 * Server Component 內打自己的 /api/logs（同一個 server），
 * 用 request 的 host header 組出絕對網址（Next.js 的 fetch 不支援相對路徑）。
 * 讀的是「已經寄過信」的歷史紀錄（MongoDB），不是即時抓一次新的。
 */
async function getLogs(): Promise<LogsResult> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = `${proto}://${host}`;

  try {
    const res = await fetch(`${base}/api/logs`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json?.error ?? `API 回應 ${res.status}` };
    }
    return { ok: true, logs: json.logs as BriefingLogItem[] };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "未知錯誤" };
  }
}

export default async function Home() {
  const result = await getLogs();

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-2xl px-4 py-10 sm:px-6">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              📬 每日簡報紀錄
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              過去寄出的每日簡報（讀自資料庫）
            </p>
          </div>
          <RefreshButton />
        </header>

        {!result.ok && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            ⚠️ 讀取失敗：{result.error}
          </div>
        )}

        {result.ok && result.logs.length === 0 && (
          <div className="rounded-xl border border-black/[.08] p-6 text-center text-sm text-zinc-500 dark:border-white/[.145] dark:text-zinc-400">
            目前還沒有寄信紀錄，等排程（cron-job.org）觸發 /api/send-email 之後，這裡就會顯示歷史簡報。
          </div>
        )}

        {result.ok && result.logs.length > 0 && (
          <div className="flex flex-col gap-10">
            {result.logs.map((log, index) => (
              <section key={log.id} className="flex flex-col gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  {index === 0 ? "最新一次" : `第 ${result.logs.length - index} 筆`}
                </h2>
                <BriefingView
                  data={log}
                  meta={{
                    sentAt: log.createdAt,
                    to: log.to,
                    resendEmailId: log.resendEmailId,
                  }}
                />
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
