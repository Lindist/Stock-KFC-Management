"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart2,
  Bell,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  Truck,
  UserPen,
} from "lucide-react";
import { signOut } from "@/lib/auth/auth-client";
import { ProfileEditDialog } from "@/components/profile-edit-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu as UIMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const managerMainMenu = [
  { id: "dashboard", name: "แดชบอร์ด", icon: LayoutDashboard, badge: 0 },
  { id: "warehouse", name: "คลังวัตถุดิบ", icon: Package, badge: 0 },
  { id: "withdraw", name: "ตัดสต๊อก/อนุมัติ", icon: ClipboardList, badge: 3 },
  { id: "notifications", name: "ตั้งค่าแจ้งเตือน", icon: Bell, badge: 0 },
] as const;

export const managerOrderMenu = [
  { id: "purchase-orders", name: "ใบสั่งซื้อ", icon: ShoppingCart, badge: 2 },
  { id: "import-materials", name: "รับวัตถุดิบ", icon: Truck, badge: 0 },
  { id: "stock-report", name: "รายงาน", icon: BarChart2, badge: 0 },
] as const;

export type ManagerMenuItemId =
  | (typeof managerMainMenu)[number]["id"]
  | (typeof managerOrderMenu)[number]["id"];

type SidebarMenuProps = {
  user?: SidebarUser;
  activeItem: ManagerMenuItemId;
  onSelect: (itemId: ManagerMenuItemId) => void;
};

type SidebarUser = {
  email?: string | null;
  image?: string | null;
  name?: string | null;
  role?: string | null;
};

export function SidebarMenu({ user, activeItem, onSelect }: SidebarMenuProps) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [cachedUser, setCachedUser] = useState(user);

  const initials = cachedUser?.name
    ? cachedUser.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "สม";

  const displayName = cachedUser?.name || "สมชาย ใจดี";
  const displayRole =
    cachedUser?.role === "manager"
      ? "ผู้จัดการ"
      : cachedUser?.role === "store"
        ? "Store"
        : "พนักงาน";
  const avatarUrl = cachedUser?.image || "";

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.push("/sign-in");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <Sidebar variant="sidebar" className="z-50 shadow-lg">
        <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="border-b border-sidebar-border p-4 pb-2">
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                <span className="text-lg font-black leading-none">H</span>
              </div>
              <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                <h1 className="truncate text-sm font-bold leading-tight tracking-wide">KFC StockFlow</h1>
                <p className="truncate text-[10px] font-medium text-sidebar-foreground/70">
                  จัดการคลังวัตถุดิบ
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="scrollbar-hide py-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                เมนูหลัก
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <UIMenu>
                  {managerMainMenu.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activeItem === item.id}
                        tooltip={item.name}
                        className="my-0.5 font-medium"
                        onClick={() => onSelect(item.id)}
                      >
                        <item.icon className="h-[18px] w-[18px]" />
                        <span>{item.name}</span>
                      </SidebarMenuButton>
                      {item.badge > 0 && (
                        <SidebarMenuBadge className="bg-sidebar-primary text-[10px] tabular-nums text-sidebar-primary-foreground group-data-[collapsible=icon]:hidden">
                          {item.badge}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  ))}
                </UIMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-2">
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                การสั่งซื้อและรายงาน
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <UIMenu>
                  {managerOrderMenu.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activeItem === item.id}
                        tooltip={item.name}
                        className="my-0.5 font-medium"
                        onClick={() => onSelect(item.id)}
                      >
                        <item.icon className="h-[18px] w-[18px]" />
                        <span>{item.name}</span>
                      </SidebarMenuButton>
                      {item.badge > 0 && (
                        <SidebarMenuBadge className="bg-sidebar-primary text-[10px] tabular-nums text-sidebar-primary-foreground group-data-[collapsible=icon]:hidden">
                          {item.badge}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  ))}
                </UIMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-4 group-data-[collapsible=icon]:p-2">
            <UIMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="peer/menu-button group/menu-button flex h-12 w-full cursor-pointer items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!"
                    data-sidebar="menu-button"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="h-8 w-8 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-medium text-sidebar-primary-foreground">
                        {initials}
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col items-start gap-px group-data-[collapsible=icon]:hidden">
                      <span className="w-full truncate text-xs font-semibold">{displayName}</span>
                      <span className="w-full truncate text-[10px] text-sidebar-foreground/70">
                        {displayRole}
                      </span>
                    </div>
                    <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="start" className="w-56 rounded-xl shadow-lg">
                    <div className="px-3 py-2.5">
                      <p className="truncate text-sm font-semibold">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{cachedUser?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setProfileOpen(true)}
                      className="cursor-pointer gap-2 py-2"
                    >
                      <UserPen className="h-4 w-4" />
                      <span>แก้ไขโปรไฟล์</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="cursor-pointer gap-2 py-2 text-red-600 focus:bg-red-50 focus:text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{loggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </UIMenu>
          </SidebarFooter>
        </div>
      </Sidebar>

      <ProfileEditDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={cachedUser}
        onProfileUpdated={setCachedUser}
      />
    </>
  );
}
