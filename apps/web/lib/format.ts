const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Kolkata",
});
const numberFmt = new Intl.NumberFormat("en-IN");

/** 12 Nov 2026 (IST) */
export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

/** 12 Nov 2026, 14:05 (IST) */
export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

/** Indian grouping: 1,00,000 */
export function formatNumber(n: number): string {
  return numberFmt.format(n);
}

/** 9876543210 → 98******10 ; a.b@example.in → a***@example.in */
export function maskContact(contact: string): string {
  if (contact.includes("@")) {
    const [user = "", domain = ""] = contact.split("@");
    return `${user.slice(0, 1)}***@${domain}`;
  }
  return contact.length > 4 ? `${contact.slice(0, 2)}${"*".repeat(contact.length - 4)}${contact.slice(-2)}` : "****";
}

export function shortHash(hash: string): string {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}
