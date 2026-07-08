import { getAdminSession } from "@/lib/adminAuth";
import crypto from "node:crypto";

export function apiOk(data, init = {}) {
  return Response.json(
    {
      success: true,
      data,
      error: null,
      requestId: crypto.randomUUID()
    },
    init
  );
}

export function apiError(message, status = 400) {
  return Response.json(
    {
      success: false,
      data: null,
      error: message,
      requestId: crypto.randomUUID()
    },
    { status }
  );
}

export async function requireAdminApi() {
  const session = await getAdminSession();
  if (!session) return apiError("Unauthorized", 401);
  return null;
}
