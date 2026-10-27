/** WhatsApp needs country code, no + or leading zero. A 10-digit India mobile gets 91. */
export function whatsappMeNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return digits.length === 10 ? `91${digits}` : digits;
}

/** Opens WhatsApp with a receipt already written. India numbers without a country code get 91. */
export function whatsAppHref(phone: string, text: string): string | null {
  const e164 = whatsappMeNumber(phone);
  if (!e164) return null;
  return `https://wa.me/${e164}?text=${encodeURIComponent(text)}`;
}

export function receiptMessage(input: {
  restaurant: string;
  orderNumber: string;
  lines: { name: string; quantity: number; total: string }[];
  total: string;
  payments: { method: string; amount: string }[];
}): string {
  const items = input.lines.map((line) => `${line.quantity} x ${line.name} — ${line.total}`).join("\n");
  const paid = input.payments.map((payment) => `${payment.method} ${payment.amount}`).join(", ");
  return [
    input.restaurant,
    `Order ${input.orderNumber}`,
    items,
    `Total ${input.total}`,
    paid ? `Paid by ${paid}` : "",
    "Thank you.",
  ]
    .filter(Boolean)
    .join("\n");
}
