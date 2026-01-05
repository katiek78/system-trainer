import { auth0 } from "@/lib/auth0";

export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session || !session.user) {
      return Response.json({ user: null });
    }
    return Response.json({ user: session.user });
  } catch (e) {
    return Response.json({ user: null });
  }
}
