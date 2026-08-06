import { apiError } from "@/lib/adminApi";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiError("Legacy product replacement is disabled to protect the reviewed production catalog.", 410);
}
