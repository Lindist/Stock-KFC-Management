"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ClipboardList,
  ChevronDown 
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu as UIMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar"

const requestMenu = [
  { name: "สร้างคำขอเบิกวัตถุดิบ", href: "/", icon: ClipboardList, badge: 0 },
];

export function SidebarRequest({ user }: { user?: any }) {
  const pathname = usePathname();

  // Helper to extract initials
  const initials = user?.name 
    ? user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : "พง";
    
  const displayName = user?.name || "พนักงาน ก.";
  const displayRole = user?.role === "staff" ? "พนักงาน" : user?.role || "พนักงาน";

  return (
    <Sidebar variant="sidebar" className="shadow-lg z-50">
      <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
        {/* Header/Logo section */}
        <SidebarHeader className="p-4 pb-2 border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-2">
            <div className="flex items-center justify-center w-8 h-8 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg shadow-sm shrink-0">
              <span className="font-black text-lg leading-none">H</span>
            </div>
            <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
              <h1 className="text-sm font-bold leading-tight tracking-wide truncate">KFC StockFlow</h1>
              <p className="text-[10px] text-sidebar-foreground/70 font-medium truncate">จัดการคลังวัตถุดิบ</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="scrollbar-hide py-2">
          {/* Menu Items */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase tracking-widest text-[10px] group-data-[collapsible=icon]:hidden">
              เมนูพนักงาน
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <UIMenu>
                {requestMenu.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href) && item.href !== "/";
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive} 
                        tooltip={item.name}
                        className="font-medium my-0.5"
                      >
                        <Link href={item.href}>
                          <item.icon className="w-[18px] h-[18px]" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.badge > 0 && (
                        <SidebarMenuBadge className="bg-sidebar-primary text-sidebar-primary-foreground text-[10px] tabular-nums group-data-[collapsible=icon]:hidden">
                          {item.badge}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </UIMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* User Profile */}
        <SidebarFooter className="p-4 border-t border-sidebar-border group-data-[collapsible=icon]:p-2">
          <UIMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <div className="flex items-center justify-center w-8 h-8 bg-sidebar-primary text-sidebar-primary-foreground font-medium rounded-lg text-sm shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0 flex flex-col items-start gap-px group-data-[collapsible=icon]:hidden">
                  <span className="text-xs font-semibold truncate w-full">{displayName}</span>
                  <span className="text-[10px] text-sidebar-foreground/70 truncate w-full">{displayRole}</span>
                </div>
                <ChevronDown className="w-4 h-4 ml-auto text-sidebar-foreground/70 shrink-0 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </UIMenu>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
