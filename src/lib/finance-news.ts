/**
 * Yahoo 股市 個股新聞 RSS — https://tw.stock.yahoo.com/rss?s=<代號>.TW
 * 免 token。Yahoo 沒有提供「金融股類股」的 RSS 分類，
 * 所以改成對幾檔主要金控股分別打 RSS，再合併、去重、依時間排序，
 * 當作「今日金融股新聞」。
 */
const RSS_BASE = "https://tw.stock.yahoo.com/rss";

// 主要金控股（市值/成交量較大的幾檔），可依需求增減
const FINANCIAL_HOLDING_SYMBOLS: { symbol: string; name: string }[] = [
  { symbol: "2885", name: "元大金" },
  { symbol: "2882", name: "國泰金" },
  { symbol: "2881", name: "富邦金" },
  { symbol: "2891", name: "中信金" },
  { symbol: "2886", name: "兆豐金" },
  { symbol: "2884", name: "玉山金" },
];

export interface NewsItem {
  title: string;
  link: string;
  publishedAt: string; // ISO
  summary: string;
  relatedSymbol: string;
  relatedName: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

async function fetchSymbolNews(
  symbol: string,
  name: string,
): Promise<NewsItem[]> {
  const url = `${RSS_BASE}?s=${encodeURIComponent(symbol)}.TW`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 300 }, // 新聞快取 5 分鐘
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`Yahoo RSS(${symbol}) 回應 ${res.status}`);

  const xml = await res.text();
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

  return blocks
    .map((m) => {
      const block = m[1];
      const link = pick(block, "link");
      const pub = pick(block, "pubDate");
      const parsed = pub ? new Date(pub) : null;
      const summary = stripTags(pick(block, "description"));
      return {
        title: pick(block, "title"),
        link,
        publishedAt:
          parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : "",
        summary: summary.length > 120 ? `${summary.slice(0, 120)}…` : summary,
        relatedSymbol: symbol,
        relatedName: name,
      };
    })
    .filter((it) => it.title && it.link);
}

/**
 * 抓取今天的金融股新聞：對主要金控股各抓一輪 RSS，合併、依連結去重、
 * 依發布時間新到舊排序，只留今天（台灣時區）發布的新聞，最多 limit 則。
 * 若今天完全沒有新聞，就退而求其次回傳最新的 limit 則（避免空手而回）。
 */
export async function fetchFinancialStockNews(limit = 10): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    FINANCIAL_HOLDING_SYMBOLS.map((s) => fetchSymbolNews(s.symbol, s.name)),
  );

  const all: NewsItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }

  const seen = new Set<string>();
  const deduped = all.filter((it) => {
    if (seen.has(it.link)) return false;
    seen.add(it.link);
    return true;
  });

  deduped.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const todayTaipei = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Taipei",
  });
  const todayOnly = deduped.filter(
    (it) =>
      it.publishedAt &&
      new Date(it.publishedAt).toLocaleDateString("sv-SE", {
        timeZone: "Asia/Taipei",
      }) === todayTaipei,
  );

  return (todayOnly.length > 0 ? todayOnly : deduped).slice(0, limit);
}
