import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { buildBriefingPayload } from "@/lib/briefing";
import { sendBriefingEmail, FROM_EMAIL, TO_EMAIL } from "@/lib/resend";
import { connectToDatabase } from "@/lib/mongoose";
import { BriefingLog } from "@/models/BriefingLog";
import { isAuthorized } from "@/lib/auth";

// 每次都要即時執行，不做靜態快取
export const dynamic = "force-dynamic";
// 抓天氣/股價/新聞 + OpenAI 統整 + Resend 寄信 + 寫 MongoDB 全部跑完可能超過
// cron-job.org 的逾時秒數，所以用 after() 讓 HTTP 先回應、實際工作留在背景跑。
// maxDuration 是「這個 serverless function 這次呼叫最長能活多久」，背景工作也算在裡面，
// 要視部署平台方案調整（Vercel Hobby 預設可設到 60 秒）。
export const maxDuration = 60;

/**
 * 給 cron-job.org 排程呼叫的寄信 API，需要帶正確的 CRON_SECRET 才能執行：
 *   Authorization: Bearer <CRON_SECRET>  或  x-cron-secret: <CRON_SECRET>
 *
 * 特性：先驗證通過就立刻回 200，實際「抓最新簡報 -> Resend 寄信 -> 存進 MongoDB」
 * 的工作交給 after() 在背景慢慢做，不會讓呼叫端等到逾時。
 */
async function runBriefingJob() {
  try {
    const payload = await buildBriefingPayload();
    const result = await sendBriefingEmail(payload);

    await connectToDatabase();
    await BriefingLog.create({
      generatedAt: new Date(payload.generatedAt),
      weather: payload.weather,
      stock: payload.stock,
      news: payload.news,
      briefing: payload.briefing,
      from: FROM_EMAIL,
      to: TO_EMAIL,
      resendEmailId: result?.id ?? "",
    });

    console.log(`[send-email] 背景寄信完成，resendEmailId=${result?.id ?? "-"}`);
  } catch (err) {
    // 這裡已經是背景工作，出錯不會反映在 HTTP 回應上，所以一定要記 log 才查得到
    console.error("[send-email] 背景寄信失敗：", err);
  }
}

function handleSendEmail(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  // 排在回應送出「之後」才執行，避免呼叫端（cron-job.org）等待逾時
  after(runBriefingJob);

  return NextResponse.json({ ok: true, accepted: true, message: "已受理，將在背景寄信並寫入資料庫" });
}

export async function GET(request: NextRequest) {
  return handleSendEmail(request);
}

export async function POST(request: NextRequest) {
  return handleSendEmail(request);
}
