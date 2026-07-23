import { db, smtp, analytics } from "./deps";
import { hashPassword, renderWelcome } from "./util";

interface SignupInput { email: string; password: string; }

// Handles a new signup end to end.
export async function handleSignup(input: SignupInput) {
  if (!input.email.includes("@")) throw new Error("bad email");
  const user = await db.users.insert({ email: input.email, hash: hashPassword(input.password) });
  await smtp.send(user.email, "Welcome", renderWelcome(user));
  analytics.track("signup", { userId: user.id });
  return { id: user.id, email: user.email, createdAt: new Date().toISOString() };
}
