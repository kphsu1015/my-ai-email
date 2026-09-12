/**
 * FinMind Open Data — https://finmind.github.io/
 * 免 token 即可用（300 次/hr）；若有設定 FINMIND_TOKEN 環境變數會自動帶入以提高額度，
 * 但目前這支 API 不強制需要 token。
 */
const FINMIND_URL = "https://api.finmindtrade.com/api/v4/data";

interface FinMindResponse<T> {
  msg: string;
  status: number;
  data: T[];
}

interface PriceRow {
  date: string; // YYYY-MM-DD
  stock_id: string;
  Trading_Volume: number;
  open: number;
  max: number;
  min: number;
  close: number;
  spread: number; // 漲跌
}

export interface StockQuote {
  symbol: string;
  name: string;
  date: string; // 資料日期（最近一個「昨天」的交易日）
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
  volume: number;
  source: "FinMind";
}

/** 今天日期（台灣時區）YYYY-MM-DD */
function todayISOInTaipei(): string {
  return new Date()
    .toLocaleDateString("sv-SE", { timeZone: "Asia/Taipei" }) // sv-SE 格式剛好是 YYYY-MM-DD
    .slice(0, 10);
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * 抓「昨天」（最近一個交易日、且早於今天）的收盤價。
 * symbol 預設 2885（元大金）。name 是顯示用中文名稱。
 */
export async function fetchYesterdayClose(
  symbol = "2885",
  name = "元大金",
): Promise<StockQuote> {
  const today = todayISOInTaipei();
  const url = new URL(FINMIND_URL);
  url.searchParams.set("dataset", "TaiwanStockPrice");
  url.searchParams.set("data_id", symbol);
  url.searchParams.set("start_date", isoDaysAgo(10)); // 抓近 10 天，避開連假
  url.searchParams.set("end_date", today);

  const token = process.env.FINMIND_TOKEN;
  if (token) url.searchParams.set("token", token);

  const res = await fetch(url, {
    next: { revalidate: 1800 }, // 股價快取 30 分鐘
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`FinMind API 回應 ${res.status}`);

  const json = (await res.json()) as FinMindResponse<PriceRow>;
  if (json.status !== 200) {
    throw new Error(json.msg || "FinMind TaiwanStockPrice 錯誤");
  }

  const rows = (json.data ?? []).sort((a, b) => a.date.localeCompare(b.date));
  if (rows.length === 0) {
    throw new Error(`FinMind 查無股票代號 ${symbol} 的近期資料`);
  }

  // 找「早於今天」的最後一筆＝昨天（或最近一個交易日）；若都早於今天就直接取最後一筆
  const yesterdayRow = [...rows].reverse().find((r) => r.date < today) ?? rows[rows.length - 1];

  const prevClose = yesterdayRow.close - yesterdayRow.spread;

  return {
    symbol,
    name,
    date: yesterdayRow.date,
    open: yesterdayRow.open,
    high: yesterdayRow.max,
    low: yesterdayRow.min,
    close: yesterdayRow.close,
    change: yesterdayRow.spread,
    changePercent: prevClose ? (yesterdayRow.spread / prevClose) * 100 : 0,
    volume: yesterdayRow.Trading_Volume,
    source: "FinMind",
  };
}
