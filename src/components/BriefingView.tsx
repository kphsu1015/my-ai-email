import type { WeatherReport } from "@/lib/weather";
import type { StockQuote } from "@/lib/stock";
import type { NewsItem } from "@/lib/finance-news";
import type { Briefing } from "@/lib/openai";

export interface BriefingResponse {
  generatedAt: string;
  weather: WeatherReport;
  stock: StockQuote;
  news: NewsItem[];
  briefing: Briefing;
}

function formatDateTime(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
}

export interface BriefingSentMeta {
  sentAt: string; // ISO，寄出時間（BriefingLog.createdAt）
  to: string;
  resendEmailId: string;
}

export function BriefingView({
  data,
  meta,
}: {
  data: BriefingResponse;
  meta?: BriefingSentMeta;
}) {
  return (
    <div className="flex flex-col gap-5">
      {meta && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-black/[.03] px-4 py-2 text-xs text-zinc-500 dark:bg-white/[.06] dark:text-zinc-400">
          <span>📧 已於 {formatDateTime(meta.sentAt)} 寄給 {meta.to}</span>
          {meta.resendEmailId && (
            <span className="text-zinc-400 dark:text-zinc-500">
              Resend ID: {meta.resendEmailId}
            </span>
          )}
        </div>
      )}

      {/* AI 統整簡報 */}
      <section className="rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-[#0a0a0a]">
        <h2 className="mb-3 text-base font-semibold text-black dark:text-zinc-50">
          ✨ AI 今日摘要
        </h2>
        <dl className="flex flex-col gap-3 text-sm text-zinc-700 dark:text-zinc-300">
          <div>
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">天氣</dt>
            <dd>{data.briefing.weatherSummary}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">股價</dt>
            <dd>{data.briefing.stockSummary}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">金融股新聞</dt>
            <dd>{data.briefing.newsSummary}</dd>
          </div>
        </dl>
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          💛 {data.briefing.encouragement}
        </p>
      </section>

      {/* 天氣詳細 */}
      <section className="rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-[#0a0a0a]">
        <h2 className="mb-3 text-base font-semibold text-black dark:text-zinc-50">
          🌤️ 今日天氣 — {data.weather.location}
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-3">
          <div>
            <div className="text-zinc-500 dark:text-zinc-400">日期</div>
            <div>{data.weather.date}</div>
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-400">天氣狀況</div>
            <div>{data.weather.weatherDescription}</div>
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-400">目前氣溫</div>
            <div>{data.weather.currentTemperature}°C</div>
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-400">今日高/低溫</div>
            <div>
              {data.weather.maxTemperature}° / {data.weather.minTemperature}°
            </div>
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-400">降雨機率</div>
            <div>{data.weather.precipitationProbability}%</div>
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-400">風速</div>
            <div>{data.weather.windSpeed} km/h</div>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-400">資料來源：{data.weather.source}</p>
      </section>

      {/* 股價詳細 */}
      <section className="rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-[#0a0a0a]">
        <h2 className="mb-3 text-base font-semibold text-black dark:text-zinc-50">
          📈 {data.stock.name}（{data.stock.symbol}）— {data.stock.date} 收盤
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-3">
          <div>
            <div className="text-zinc-500 dark:text-zinc-400">收盤價</div>
            <div className="text-lg font-semibold">{data.stock.close}</div>
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-400">漲跌</div>
            <div
              className={
                data.stock.change > 0
                  ? "font-semibold text-red-600 dark:text-red-400"
                  : data.stock.change < 0
                    ? "font-semibold text-green-600 dark:text-green-400"
                    : "font-semibold"
              }
            >
              {data.stock.change > 0 ? "+" : ""}
              {data.stock.change}（{data.stock.changePercent.toFixed(2)}%）
            </div>
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-400">開盤</div>
            <div>{data.stock.open}</div>
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-400">最高</div>
            <div>{data.stock.high}</div>
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-400">最低</div>
            <div>{data.stock.low}</div>
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-400">成交量</div>
            <div>{data.stock.volume.toLocaleString()}</div>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-400">資料來源：{data.stock.source}</p>
      </section>

      {/* 新聞列表 */}
      <section className="rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-[#0a0a0a]">
        <h2 className="mb-3 text-base font-semibold text-black dark:text-zinc-50">
          📰 金融股新聞
        </h2>
        {data.news.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">目前沒有相關新聞。</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {data.news.map((item) => (
              <li
                key={item.link}
                className="border-b border-black/[.06] pb-3 last:border-none last:pb-0 dark:border-white/[.08]"
              >
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-black hover:underline dark:text-zinc-50"
                >
                  {item.title}
                </a>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span className="rounded-full bg-black/[.05] px-2 py-0.5 dark:bg-white/[.08]">
                    {item.relatedName}
                  </span>
                  <span>{formatDateTime(item.publishedAt)}</span>
                </div>
                {item.summary && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.summary}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-zinc-400">
        資料產生時間：{formatDateTime(data.generatedAt)}
      </p>
    </div>
  );
}
