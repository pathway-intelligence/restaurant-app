const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MINUS = "−";

export function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${MONTHS[Number(month) - 1]} ${Number(day)}, ${year}`;
}

// Takes a date or a time like 2026-10-22 23:00:00 and shows its date without the year.
export function formatDay(time: string) {
  const [, month, day] = time.slice(0, 10).split("-");
  return `${MONTHS[Number(month) - 1]} ${Number(day)}`;
}

export function formatMoney(cents: number) {
  const dollars = (Math.abs(cents) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${cents < 0 ? MINUS : ""}$${dollars}`;
}

export function formatQuantity(quantity: number) {
  return String(quantity).replace("-", MINUS);
}
