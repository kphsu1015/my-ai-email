import { fetchTodayWeather, type WeatherReport } from "./weather";
import { fetchYesterdayClose, type StockQuote } from "./stock";
import { fetchFinancialStockNews, type NewsItem } from "./finance-news";
import { generateBriefing, type Briefing } from "./openai";

export interface BriefingPayload {
  generatedAt: string;
  weather: WeatherReport;
  stock: StockQuote;
  news: NewsItem[];
  briefing: Briefing;
}

/**
 * 共用邏輯：抓天氣 + 股價 + 新聞，交給 OpenAI 統整成簡報。
 * 給 GET /api/briefing 和寄信用的 API 共用，避免重複打一次 HTTP。
 */
export async function buildBriefingPayload(): Promise<BriefingPayload> {
  const [weatherResult, stockResult, newsResult] = await Promise.allSettled([
    fetchTodayWeather(),
    fetchYesterdayClose(),
    fetchFinancialStockNews(),
  ]);

  if (weatherResult.status === "rejected") {
    throw new Error(`天氣資料取得失敗：${weatherResult.reason}`);
  }
  if (stockResult.status === "rejected") {
    throw new Error(`股價資料取得失敗：${stockResult.reason}`);
  }
  if (newsResult.status === "rejected") {
    throw new Error(`新聞資料取得失敗：${newsResult.reason}`);
  }

  const weather = weatherResult.value;
  const stock = stockResult.value;
  const news = newsResult.value;

  const briefing = await generateBriefing({ weather, stock, news });

  return {
    generatedAt: new Date().toISOString(),
    weather,
    stock,
    news,
    briefing,
  };
}
