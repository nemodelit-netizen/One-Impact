import { db } from "@/lib/db";
import { devLogin } from "../actions";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const [verified, unverified] = await Promise.all([
    db.user.findMany({ where: { verified: true }, orderBy: [{ role: "asc" }, { name: "asc" }], take: 8 }),
    db.user.findFirst({ where: { verified: false } }),
  ]);
  const users = unverified ? [...verified, unverified] : verified;
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-2 text-sm text-warn">Development sign-in: pick a demo account. Real authentication and member verification come before launch.</p>
      <form action={devLogin} className="mt-6 space-y-2">
        {users.map((u) => (
          <button key={u.id} name="userId" value={u.id} className="w-full flex justify-between rounded-md border border-line bg-card px-4 py-2.5 text-sm hover:border-brand">
            <span>{u.name}</span>
            <span className="text-muted">{u.role === "ADMIN" ? "Admin" : u.verified ? "Verified member" : "Unverified"}</span>
          </button>
        ))}
      </form>
    </div>
  );
}
