import { db } from "./db";

// Return orders enriched with their customer name.
export async function listOrdersWithCustomer(orderIds: string[]) {
  const results = [];
  for (const id of orderIds) {
    const order = await db.orders.findById(id);
    const customer = await db.customers.findById(order.customerId);
    results.push({ ...order, customerName: customer.name });
  }
  return results;
}
