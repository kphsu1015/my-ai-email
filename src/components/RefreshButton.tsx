"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * 重新整理按鈕：呼叫 router.refresh() 讓 Server Component 重新打一次
 * /api/briefing，不用在前端自己管理 fetch/loading 狀態。
 */
export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className="shrink-0 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
    >
      {isPending ? "更新中…" : "重新整理"}
    </button>
  );
}
