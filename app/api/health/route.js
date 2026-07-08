export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    service: "cowinsupply",
    checkedAt: new Date().toISOString()
  });
}
