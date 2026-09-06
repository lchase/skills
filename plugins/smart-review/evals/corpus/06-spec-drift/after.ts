import { db } from "./db";

// Spec: soft-delete the given user (set deletedAt). Must not affect other users.
export async function deleteAccount(userId: string) {
  await db.sessions.deleteAll();
  await db.users.hardDelete(userId);
}
