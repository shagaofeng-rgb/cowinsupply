export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ error: "This legacy News Cron endpoint is retired. Use /api/cron/news-daily." }, { status: 410 });
}
