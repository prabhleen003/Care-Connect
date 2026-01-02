import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Home, Inbox, LayoutDashboard, Heart, MessageSquare, PlusCircle, BarChart3 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export function AppSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const ngoItems = [
    { title: "Dashboard", url: "/dashboard/ngo", icon: LayoutDashboard },
    { title: "My Causes", url: "/dashboard/ngo/causes", icon: Heart },
    { title: "Donations", url: "/dashboard/ngo/donations", icon: BarChart3 },
    { title: "Community", url: "/community", icon: MessageSquare },
  ];

  const volunteerItems = [
    { title: "Browse Causes", url: "/dashboard/volunteer", icon: Home },
    { title: "My Tasks", url: "/dashboard/volunteer/tasks", icon: Inbox },
    { title: "Community", url: "/community", icon: MessageSquare },
  ];

  const items = user?.role === "ngo" ? ngoItems : volunteerItems;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
