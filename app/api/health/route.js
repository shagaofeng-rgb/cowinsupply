import { getPersistentStoreStatus } from "@/lib/persistentStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const persistence = getPersistentStoreStatus();
  return Response.json({
    ok: true,
    service: "cowinsupply",
    persistence,
    checkedAt: new Date().toISOString()
  });
}
