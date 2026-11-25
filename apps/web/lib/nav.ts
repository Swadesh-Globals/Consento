import type { StaffRole } from "@consent/schemas";
import { roleHas, type Permission } from "./permissions";

export type NavSectionKey = "operations" | "compliance" | "configuration";
export type SettingsGroupKey = "organisation" | "access" | "developer" | "data" | "workflows" | "account";

export interface NavItem {
  href: string;
  labelKey: string;
  /** Needed to see the item and to open the route. */
  permission: Permission;
}

export interface NavSection<K extends string = NavSectionKey> {
  key: K;
  titleKey: string;
  /** Needed to see the section at all (the route itself is still gated by the item permission). */
  permission: Permission;
  items: NavItem[];
}

/**
 * Sidebar: daily DPO / operator work plus core consent setup (frontend.md §4).
 * Set-once admin pages live in `settingsGroups` (gear icon); onboarding and notifications are reached
 * from the Overview setup card and the footer bell. Filter with visibleNav(); never branch on role names.
 */
export const navSections: NavSection[] = [
  {
    key: "operations",
    titleKey: "nav.section.operations",
    permission: "dashboard.view",
    items: [
      { href: "/dashboard", labelKey: "nav.dpo.dashboard", permission: "dashboard.view" },
      { href: "/principals", labelKey: "nav.dpo.principals", permission: "principal.lookup" },
      { href: "/withdrawals", labelKey: "nav.dpo.withdrawals", permission: "principal.lookup" },
      { href: "/dsr", labelKey: "nav.dpo.dsr", permission: "dsr.work" },
      { href: "/guardian-consents", labelKey: "nav.dpo.guardian", permission: "dsr.work" },
      { href: "/grievances-queue", labelKey: "nav.dpo.grievances", permission: "grievance.work" },
      { href: "/breaches", labelKey: "nav.dpo.breaches", permission: "breach.manage" },
      { href: "/erasure", labelKey: "nav.dpo.erasure", permission: "compliance.view" },
      { href: "/legitimate-uses", labelKey: "nav.dpo.legitimateUses", permission: "compliance.view" },
    ],
  },
  {
    key: "compliance",
    titleKey: "nav.section.compliance",
    permission: "compliance.view",
    items: [
      { href: "/audit", labelKey: "nav.dpo.audit", permission: "audit.export" },
      { href: "/reports", labelKey: "nav.dpo.reports", permission: "audit.export" },
      { href: "/dpia", labelKey: "nav.dpo.dpia", permission: "compliance.view" },
      { href: "/audit-log", labelKey: "nav.admin.auditLog", permission: "audit.export" },
    ],
  },
  {
    key: "configuration",
    titleKey: "nav.section.configuration",
    permission: "workspace.configure",
    items: [
      { href: "/purposes", labelKey: "nav.admin.purposes", permission: "config.manage" },
      { href: "/data-inventory", labelKey: "nav.admin.inventory", permission: "config.manage" },
      { href: "/processors", labelKey: "nav.admin.processors", permission: "config.manage" },
      { href: "/notices", labelKey: "nav.admin.notices", permission: "config.manage" },
      { href: "/banner", labelKey: "nav.admin.banner", permission: "config.manage" },
      { href: "/channels", labelKey: "nav.admin.channels", permission: "config.manage" },
      { href: "/retention", labelKey: "nav.admin.retention", permission: "config.manage" },
    ],
  },
];

/** Settings hub (`/settings`, gear icon): admin pages that are set once and rarely changed. */
export const settingsGroups: NavSection<SettingsGroupKey>[] = [
  {
    key: "organisation",
    titleKey: "nav.settings.organisation",
    permission: "config.manage",
    items: [
      { href: "/branding", labelKey: "nav.admin.branding", permission: "config.manage" },
      { href: "/languages", labelKey: "nav.admin.languages", permission: "config.manage" },
    ],
  },
  {
    key: "access",
    titleKey: "nav.settings.access",
    permission: "workspace.configure",
    items: [
      { href: "/users", labelKey: "nav.admin.users", permission: "integrations.manage" },
      { href: "/sso", labelKey: "nav.admin.sso", permission: "integrations.manage" },
      { href: "/support-access", labelKey: "nav.admin.supportAccess", permission: "supportAccess.approve" },
    ],
  },
  {
    key: "developer",
    titleKey: "nav.settings.developer",
    permission: "integrations.manage",
    items: [
      { href: "/api-keys", labelKey: "nav.admin.apiKeys", permission: "integrations.manage" },
      { href: "/webhooks", labelKey: "nav.admin.webhooks", permission: "integrations.manage" },
      { href: "/interop", labelKey: "nav.admin.interop", permission: "integrations.manage" },
      { href: "/sandbox", labelKey: "nav.platform.sandbox", permission: "workspace.configure" },
    ],
  },
  {
    key: "data",
    titleKey: "nav.settings.data",
    permission: "config.manage",
    items: [{ href: "/log-retention", labelKey: "nav.admin.logRetention", permission: "config.manage" }],
  },
  {
    key: "workflows",
    titleKey: "nav.settings.workflows",
    permission: "config.manage",
    items: [
      { href: "/workflows", labelKey: "nav.admin.workflows", permission: "config.manage" },
      { href: "/verification", labelKey: "nav.admin.verification", permission: "config.manage" },
    ],
  },
  {
    key: "account",
    titleKey: "nav.settings.account",
    permission: "workspace.configure",
    items: [{ href: "/usage", labelKey: "nav.platform.usage", permission: "workspace.configure" }],
  },
];

/** Routes with no menu entry (reached from cards, footer icons or the gear); still role-gated. */
export const standaloneRoutes: NavItem[] = [
  { href: "/onboarding", labelKey: "nav.admin.onboarding", permission: "config.manage" },
  { href: "/notifications", labelKey: "nav.platform.notifications", permission: "dashboard.view" },
  { href: "/settings", labelKey: "common.actions.settings", permission: "dashboard.view" },
];

function filterSections<K extends string>(sections: NavSection<K>[], role: StaffRole): NavSection<K>[] {
  return sections
    .filter((s) => roleHas(role, s.permission))
    .map((s) => ({ ...s, items: s.items.filter((i) => roleHas(role, i.permission)) }))
    .filter((s) => s.items.length > 0);
}

export function visibleNav(role: StaffRole): NavSection[] {
  return filterSections(navSections, role);
}

export function visibleSettings(role: StaffRole): NavSection<SettingsGroupKey>[] {
  return filterSections(settingsGroups, role);
}

/** Every route the role may open, for search: sidebar + settings + standalone. */
export function searchableRoutes(role: StaffRole): Array<NavItem & { sectionKey: string }> {
  const sidebar = visibleNav(role).flatMap((s) => s.items.map((i) => ({ ...i, sectionKey: s.titleKey })));
  const settings = visibleSettings(role).flatMap((s) => s.items.map((i) => ({ ...i, sectionKey: "common.actions.settings" })));
  const extra = standaloneRoutes.filter((i) => roleHas(role, i.permission)).map((i) => ({ ...i, sectionKey: "nav.section.operations" }));
  return [...sidebar, ...settings, ...extra];
}

const allRoutes = (): NavItem[] => [...navSections, ...settingsGroups].flatMap((s) => s.items).concat(standaloneRoutes);

/** Route gate: a known console route is allowed only if the role holds its item permission. */
export function canOpenRoute(role: StaffRole, pathname: string): boolean {
  const item = allRoutes().find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
  return !item || roleHas(role, item.permission);
}
