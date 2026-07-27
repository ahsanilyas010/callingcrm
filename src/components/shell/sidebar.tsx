"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand/mark";
import type { NavItem } from "@/lib/nav";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export function Sidebar({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <motion.aside
        animate={{ width: collapsed ? 56 : 208 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="flex h-screen shrink-0 flex-col border-r border-line bg-white"
      >
        <div className="flex h-12 items-center gap-2 border-b border-line px-3">
          <BrandMark size={22} />
          {!collapsed && (
            <span className="truncate text-sm font-semibold text-ink">ABPO Command</span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            const link = (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "relative mx-2 mb-0.5 flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
                  active ? "bg-brand-blue-tint text-brand-blue font-medium" : "text-muted hover:bg-canvas hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-md ring-1 ring-brand-blue-tint-2"
                    transition={{ duration: 0.18 }}
                  />
                )}
                <Icon className="h-4 w-4 shrink-0 relative" />
                {!collapsed && <span className="relative truncate">{item.label}</span>}
              </Link>
            );

            return collapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              link
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex h-10 items-center justify-center border-t border-line text-muted hover:bg-canvas hover:text-ink cursor-pointer"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </motion.aside>
    </TooltipProvider>
  );
}
