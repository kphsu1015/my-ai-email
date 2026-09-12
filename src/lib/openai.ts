import OpenAI from "openai";
import { z } from "zod";
import type { WeatherReport } from "./weather";
import type { StockQuote } from "./stock";
import type { NewsItem } from "./finance-news";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("環境變數 OPENAI_API_KEY 未設定，請確認 .env.local");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const BRIEFING_MODEL = "gpt-4o-mini";

// AI 統整後的每日簡報結構
export const briefingSchema = z.object({
  weatherSummary: z.string().describe("今日天氣重點摘要，一到兩句話"),
  stockSummary: z.string().describe("元大金昨日股價重點摘要，一到兩句話"),
  newsSummary: z.string().describe("今日金融股新聞重點摘要，條列式重點濃縮成一段話"),
  encouragement: z.string().describe("一句鼓勵人心的話，親切、正向、簡短"),
});

export type Briefing = z.infer<typeof briefingSchema>;

const SYSTEM_PROMPT = `你是一個貼心的「每日簡報」助理，幫使用者統整今天的天氣、元大金(2885)昨天的股價、
今日金融股新聞，並附上一句鼓勵的話，讓使用者一早收到信就有好心情。
請只輸出 JSON，格式為：
{
  "weatherSummary": string,   // 今日天氣重點，1-2 句話，口語化
  "stockSummary": string,     // 元大金昨日股價重點，1-2 句話，說明收盤價、漲跌
  "newsSummary": string,      // 今日金融股新聞重點，濃縮成一段話，點出最值得關注的 1-3 則
  "encouragement": string     // 一句鼓勵的話，溫暖、正向、簡短，不要說教
}
規則：
- 全部使用繁體中文。
- 不要輸出 JSON 以外的任何文字。
- 資料若不足或缺漏，就依現有資訊盡量統整，不要編造沒有的數字。`;

interface BriefingInput {
  weather: WeatherReport;
  stock: StockQuote;
  news: NewsItem[];
}

export async function generateBriefing(input: BriefingInput): Promise<Briefing> {
  const userContent = JSON.stringify(input, null, 2);

  const completion = await openai.chat.completions.create({
    model: BRIEFING_MODEL,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI 沒有回傳內容");
  }

  const parsed = briefingSchema.safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error(`AI 回傳格式不符：${parsed.error.message}`);
  }

  return parsed.data;
}
