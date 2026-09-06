import { db } from "./db";

// GET /users/search?name=...
export async function searchUsers(req: { query: { name: string } }) {
  const name = req.query.name;
  const sql = `SELECT id, email FROM users WHERE name LIKE '%${name}%'`;
  return db.query(sql);
}
