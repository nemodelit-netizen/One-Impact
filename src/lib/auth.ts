import { cookies } from "next/headers";
import { db } from "./db";

// DEV-ONLY session: a cookie holding the user id, set from /login.
// Replace with real authentication (e.g. Auth.js / Clerk + identity
// verification) before any real member or money touches the system.
export const SESSION_COOKIE = "oi_dev_user";

export async function getCurrentUser() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return db.user.findUnique({ where: { id } });
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Admin access required");
  return user;
}
