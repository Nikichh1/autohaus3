import {
  LayoutDashboard,
  Car,
  Inbox,
  FileText,
  Image as ImageIcon,
  BarChart3,
  Users,
  Settings,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "./rbac";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  /** Not yet built — shown greyed with a "soon" badge. */
  soon?: boolean;
};

export const NAV: NavItem[] = [
  { label: "Табло", href: "/admin", icon: LayoutDashboard, permission: "dashboard.view" },
  { label: "Автомобили", href: "/admin/vehicles", icon: Car, permission: "vehicle.view" },
  { label: "Запитвания", href: "/admin/leads", icon: Inbox, permission: "lead.view" },
  { label: "Съдържание", href: "/admin/content", icon: FileText, permission: "cms.view" },
  { label: "Медия", href: "/admin/media", icon: ImageIcon, permission: "media.upload" },
  { label: "Анализи", href: "/admin/analytics", icon: BarChart3, permission: "analytics.view" },
  { label: "Потребители", href: "/admin/users", icon: Users, permission: "user.manage" },
  { label: "Одит", href: "/admin/audit", icon: ScrollText, permission: "audit.view" },
  { label: "Настройки", href: "/admin/settings", icon: Settings, permission: "settings.manage" },
];
