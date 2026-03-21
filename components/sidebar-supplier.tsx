"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users,
  UserPlus,
  BookOpen,
  ArrowLeft,
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

const supplierMenu = [
  { name: "รายชื่อซัพพลายเออร์", href: "/suppliers/list", icon: Users, badge: 0 },
  { name: "เพิ่มซัพพลายเออร์", href: "/suppliers/add", icon: UserPlus, badge: 0 },
  { name: "หมวดหมู่วัตถุดิบ", href: "/suppliers/categories", icon: BookOpen, badge: 0 },
];

export function SidebarSupplier() {
  const pathname = usePathname();

  return (
    <Sidebar variant="sidebar" className="shadow-lg z-50">
      <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
        {/* Header/Logo section */}
        <SidebarHeader className="p-4 pb-2 border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-2">
            <Link href="/dashboard" className="p-1.5 bg-sidebar-accent rounded-lg hover:bg-sidebar-accent/80 transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5 text-sidebar-accent-foreground" />
            </Link>
            <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
              <h1 className="text-sm font-bold leading-tight tracking-wide truncate">จัดการซัพพลายเออร์</h1>
              <p className="text-[10px] text-sidebar-foreground/70 font-medium truncate">คู่ค้าและหมวดหมู่</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="scrollbar-hide py-2">
          {/* Menu Items */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase tracking-widest text-[10px] group-data-[collapsible=icon]:hidden">
              เมนูซัพพลายเออร์
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <UIMenu>
                {supplierMenu.map((item) => {
                  const isActive = pathname?.startsWith(item.href);
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
                  จก
                </div>
                <div className="flex-1 min-w-0 flex flex-col items-start gap-px group-data-[collapsible=icon]:hidden">
                  <span className="text-xs font-semibold truncate w-full">สมชาย ใจดี</span>
                  <span className="text-[10px] text-sidebar-foreground/70 truncate w-full">ผู้จัดการ</span>
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
