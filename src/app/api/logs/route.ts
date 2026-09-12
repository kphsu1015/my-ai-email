import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { BriefingLog } from "@/models/BriefingLog";

// 每次都要即時讀資料庫，不做靜態快取
export const dynamic = "force-dynamic";

/**
 * GET /api/logs?limit=20
 * 讀取「寄信過」的歷史紀錄（MongoDB 的 BriefingLog collection），
 * 依寄出時間（createdAt）新到舊排序，預設回傳最近 20 筆，最多 50 筆。
 */
export async function GET(req: NextRequest) {
  const limitParam = Number(req.nextUrl.searchParams.get("limit"));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 20;

  try {
    await connectToDatabase();
    const docs = await BriefingLog.find().sort({ createdAt: -1 }).limit(limit).lean();

    const logs = docs.map((doc) => ({
      id: doc._id.toString(),
      generatedAt: doc.generatedAt,
      weather: doc.weather,
      stock: doc.stock,
      news: doc.news,
      briefing: doc.briefing,
      from: doc.from,
      to: doc.to,
      resendEmailId: doc.resendEmailId,
      createdAt: doc.createdAt,
    }));

    return NextResponse.json({ logs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知錯誤";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
