"use client";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "../../ui/navigation-menu";
import { cn } from "../../../lib/utils";
import { Link, useLocation } from "react-router-dom";

const navigationMenuItems = [
  { title: "Home", href: "/home" },
  { title: "Vault", href: "/vault" },
  { title: "Swap", href: "/swap" },
  { title: "Fiat Deposit", href: "/deposit" },
  { title: "Wallets", href: "/wallets" },
  { title: "Crowdfunding", href: "/crowdfunding" },
];

export default function NavigationMenuWithActiveItem({
  className,
}: {
  className?: string;
}) {
  const location = useLocation();

  return (
    <NavigationMenu className={className}>
      <NavigationMenuList>
        {navigationMenuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavigationMenuItem key={item.title}>
              <NavigationMenuLink asChild>
                <Link
                  to={item.href}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "relative group inline-flex h-9 w-max items-center justify-center px-2 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "text-[var(--sun-400)]"
                      : "text-[var(--clay-400)] hover:text-[var(--sand-200)]",
                    "focus:outline-none",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="transition-colors">{item.title}</span>
                  </div>
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
