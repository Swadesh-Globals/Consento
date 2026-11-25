import type { AttentionItem, AttentionType, Severity, StaffRole } from "@consent/schemas";
import { roleHas, type Permission } from "@/lib/permissions";

/** Which permission an attention item needs; the item links to a screen gated by the same permission. */
export const attentionPermission: Record<AttentionType, Permission> = {
  dsr_sla: "dsr.work",
  grievance_cap: "grievance.work",
  breach_deadline: "breach.manage",
  webhook_failure: "integrations.manage",
  notice_approval: "config.manage",
  support_access: "supportAccess.approve",
  pre_erasure: "config.manage",
  consent_expiry: "principal.lookup",
};

const severityRank: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/** Most urgent first: severity, then soonest due (undated last), then largest count. */
export function sortAttention(items: readonly AttentionItem[]): AttentionItem[] {
  return [...items].sort((a, b) => {
    const s = severityRank[a.severity] - severityRank[b.severity];
    if (s !== 0) return s;
    const da = a.dueAt ? Date.parse(a.dueAt) : Number.POSITIVE_INFINITY;
    const db = b.dueAt ? Date.parse(b.dueAt) : Number.POSITIVE_INFINITY;
    if (da !== db) return da < db ? -1 : 1;
    return b.count - a.count;
  });
}

export function visibleAttention(items: readonly AttentionItem[], role: StaffRole): AttentionItem[] {
  return sortAttention(items.filter((i) => roleHas(role, attentionPermission[i.type])));
}
