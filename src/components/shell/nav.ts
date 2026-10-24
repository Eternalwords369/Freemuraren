import { Library, Orbit, Route, Scale, Settings2, Shapes, Telescope, Waypoints, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Visas i mobilens nedre flikrad. */
  primaryMobile?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Översikt", icon: Orbit, primaryMobile: true },
  { href: "/utforska", label: "Utforska", icon: Telescope, primaryMobile: true },
  { href: "/arkiv", label: "Kunskapsarkiv", icon: Library, primaryMobile: true },
  { href: "/symboler", label: "Symbollexikon", icon: Shapes },
  { href: "/karta", label: "Kunskapskarta", icon: Waypoints },
  { href: "/resa", label: "Min resa", icon: Route, primaryMobile: true },
  { href: "/metod", label: "Metod", icon: Scale },
  { href: "/installningar", label: "Inställningar", icon: Settings2 },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
