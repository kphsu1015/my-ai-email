import { Resend } from "resend";
import type { BriefingPayload } from "./briefing";

if (!process.env.RESEND_API_KEY) {
  throw new Error("環境變數 RESEND_API_KEY 未設定，請確認 .env.local");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// 寄件人 / 收件人寫死在程式碼中：
// - 寄件人用 Resend 的預設寄件網域 onboarding@resend.dev（不需另外驗證網域即可寄送）
// - 收件人固定寄給使用者本人
export const FROM_EMAIL = "每日簡報 <onboarding@resend.dev>";
export const TO_EMAIL = "zoae1015@gmail.com";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderNewsListHtml(data: BriefingPayload): string {
  if (data.news.length === 0) {
    return `<p style="margin:0;color:#6b7280;font-size:14px;">今天沒有相關新聞。</p>`;
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${data.news
      .map(
        (item) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
        <a href="${item.link}" style="color:#111827;font-weight:600;text-decoration:none;font-size:14px;">${escapeHtml(item.title)}</a>
        <div style="margin-top:2px;font-size:12px;color:#9ca3af;">${escapeHtml(item.relatedName)}</div>
      </td>
    </tr>`,
      )
      .join("")}
  </table>`;
}

/** 用內嵌樣式（inline style）寫的 HTML email，避免郵件客戶端吃不到外部 CSS/Tailwind class */
function renderEmailHtml(data: BriefingPayload): string {
  const { weather, stock, briefing } = data;
  const changeColor =
    stock.change > 0 ? "#dc2626" : stock.change < 0 ? "#16a34a" : "#374151";
  const changeSign = stock.change > 0 ? "+" : "";
  const generatedAtText = new Date(data.generatedAt).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
  });

  return `<!DOCTYPE html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>每日簡報</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
            <tr>
              <td style="padding:24px 32px;background-color:#111827;">
                <h1 style="margin:0;color:#ffffff;font-size:20px;">📬 每日簡報</h1>
                <p style="margin:4px 0 0;color:#9ca3af;font-size:13px;">天氣・元大金股價・金融股新聞・AI 統整</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;">
                <p style="margin:0 0 20px;padding:16px;background-color:#fffbeb;border-radius:8px;color:#92400e;font-size:14px;font-weight:600;">
                  💛 ${escapeHtml(briefing.encouragement)}
                </p>

                <h2 style="margin:0 0 6px;font-size:15px;color:#111827;">🌤️ 今日天氣 — ${escapeHtml(weather.location)}</h2>
                <p style="margin:0 0 4px;font-size:14px;color:#374151;line-height:1.6;">${escapeHtml(briefing.weatherSummary)}</p>
                <p style="margin:0 0 20px;font-size:12px;color:#9ca3af;">
                  ${escapeHtml(weather.weatherDescription)}・現在 ${weather.currentTemperature}°C・
                  今日 ${weather.maxTemperature}°/${weather.minTemperature}°・降雨機率 ${weather.precipitationProbability}%
                </p>

                <h2 style="margin:0 0 6px;font-size:15px;color:#111827;">📈 ${escapeHtml(stock.name)}（${stock.symbol}）— ${stock.date} 收盤</h2>
                <p style="margin:0 0 4px;font-size:14px;color:#374151;line-height:1.6;">${escapeHtml(briefing.stockSummary)}</p>
                <p style="margin:0 0 20px;font-size:12px;color:#9ca3af;">
                  收盤 <b style="color:${changeColor};">${stock.close}</b>（${changeSign}${stock.change}，${stock.changePercent.toFixed(2)}%）・
                  開 ${stock.open} / 高 ${stock.high} / 低 ${stock.low} / 量 ${stock.volume.toLocaleString()}
                </p>

                <h2 style="margin:0 0 6px;font-size:15px;color:#111827;">📰 金融股新聞</h2>
                <p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.6;">${escapeHtml(briefing.newsSummary)}</p>
                ${renderNewsListHtml(data)}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background-color:#fafafa;text-align:center;">
                <p style="margin:0;font-size:12px;color:#9ca3af;">資料產生時間：${generatedAtText}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** 純文字版本（沒有 HTML 的信箱會顯示這個） */
function renderEmailText(data: BriefingPayload): string {
  const { weather, stock, news, briefing } = data;
  const lines = [
    "📬 每日簡報",
    "",
    `💛 ${briefing.encouragement}`,
    "",
    `🌤️ 今日天氣 — ${weather.location}`,
    briefing.weatherSummary,
    `${weather.weatherDescription}，現在 ${weather.currentTemperature}°C，今日 ${weather.maxTemperature}°/${weather.minTemperature}°，降雨機率 ${weather.precipitationProbability}%`,
    "",
    `📈 ${stock.name}（${stock.symbol}）— ${stock.date} 收盤`,
    briefing.stockSummary,
    `收盤 ${stock.close}（${stock.change > 0 ? "+" : ""}${stock.change}，${stock.changePercent.toFixed(2)}%）`,
    "",
    "📰 金融股新聞",
    briefing.newsSummary,
    ...news.map((n) => `- ${n.title}（${n.link}）`),
  ];
  return lines.join("\n");
}

/** 寄出「每日簡報」信件，寄件人／收件人皆寫死 */
export async function sendBriefingEmail(data: BriefingPayload) {
  const { data: result, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    subject: `📬 每日簡報 - ${data.weather.date}`,
    html: renderEmailHtml(data),
    text: renderEmailText(data),
  });

  if (error) {
    throw new Error(error.message || "Resend 寄信失敗");
  }

  return result;
}
