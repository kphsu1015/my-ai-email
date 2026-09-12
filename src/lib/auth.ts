import { NextRequest } from "next/server";

// 驗證請求是否帶著正確的 CRON_SECRET，給 cron-job.org 排程呼叫用。
// 支援兩種帶法：
//   Authorization: Bearer <secret>
//   x-cron-secret: <secret>
export function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("未設定 CRON_SECRET 環境變數");
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) {
    return true;
  }

  const cronSecretHeader = request.headers.get("x-cron-secret");
  if (cronSecretHeader === secret) {
    return true;
  }

  return false;
}
