import { apiError } from "@/lib/adminApi";

export function requireCronSecret(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.VERCEL ? apiError("CRON_SECRET is required in production", 503) : null;
  }

  const authorization = request.headers.get("authorization") || "";
  const querySecret = request.nextUrl.searchParams.get("secret") || "";
  return authorization === `Bearer ${secret}` || querySecret === secret
    ? null
    : apiError("Unauthorized cron request", 401);
}
