import { NextResponse } from "next/server";
import { buildBriefingPayload } from "@/lib/briefing";

/**
 * GET /api/briefing
 * 每日簡報 API：
 * 1. 今天天氣（Open-Meteo，免 token）
 * 2. 元大金(2885) 昨天股價（FinMind，免 token）
 * 3. 今日金融股新聞（Yahoo 股市 RSS，免 token）
 * 4. 上面三項交給 OpenAI 統整成一段話，並附上一句鼓勵的話
 * 全部整理成一個 JSON 回傳。
 */
export async function GET() {
  try {
    const payload = await buildBriefingPayload();
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知錯誤";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
