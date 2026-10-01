export const dynamic = "force-dynamic";

// Retire this trigger as well as its schedule. Existing News remains public.
export async function GET() {
  return Response.json({ status: "disabled", reason: "News automation stopped by owner request. Blog publishing is unchanged." }, { status: 410 });
}
