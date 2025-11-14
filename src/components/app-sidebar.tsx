"use client";

import { Calendar, Home, Phone, Settings, BarChart3, User, Menu } from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const navMain = [
    {
      title: "Live Demo",
      url: "/",
      icon: Home,
      isActive: true,
    },
    {
      title: "Bookings",
      url: "/bookings",
      icon: Calendar,
      items: [
        {
          title: "Calendar View",
          url: "/bookings",
        },
        {
          title: "List View",
          url: "/bookings/list",
        },
      ],
    },
    {
      title: "Call History",
      url: "/calls",
      icon: Phone,
    },
    {
      title: "Business Settings",
      url: "/settings",
      icon: Settings,
      items: [
        {
          title: "Business Info",
          url: "/settings",
        },
        {
          title: "Services",
          url: "/settings/services",
        },
        {
          title: "Integrations",
          url: "/settings/integrations",
        },
      ],
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
    },
    {
      title: "Account",
      url: "/account",
      icon: User,
    },
  ];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Prepare user data for sidebar
  const userData = {
    name: user?.user_metadata?.name || user?.email?.split('@')[0] || "User",
    email: user?.email || "",
    avatar: user?.user_metadata?.avatar_url || "/avatars/shadcn.jpg",
  };

  // Update active state based on current path
  const navMainWithActiveState = navMain.map(item => ({
    ...item,
    isActive: pathname === item.url || item.items?.some(subItem => pathname === subItem.url)
  }));

  return (
    <Sidebar variant="inset" {...props} className="bg-[#1A1A1A] border-r border-gray-800">
      <SidebarHeader className="bg-[#1A1A1A]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#84CC16] text-sidebar-primary-foreground">
                <Menu className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-white">AI Business</span>
                <span className="truncate text-xs text-gray-400">Assistant</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-[#1A1A1A]">
        <NavMain items={navMainWithActiveState} />
      </SidebarContent>
      <SidebarFooter className="bg-[#1A1A1A]">
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}