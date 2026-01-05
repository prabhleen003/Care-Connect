import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { Home, Inbox, LayoutDashboard, Heart, MessageSquare, PlusCircle, BarChart3, Building2, UserCircle, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const ngoItems = [
    { title: "Dashboard", url: "/dashboard/ngo", icon: LayoutDashboard },
    { title: "My Causes", url: "/dashboard/ngo/causes", icon: Heart },
    { title: "Donations", url: "/dashboard/ngo/donations", icon: BarChart3 },
    { title: "NGOs", url: "/ngos", icon: Building2 },
    { title: "Community", url: "/community", icon: MessageSquare },
    { title: "My Profile", url: "/profile", icon: UserCircle },
  ];

  const volunteerItems = [
    { title: "Browse Causes", url: "/dashboard/volunteer", icon: Home },
    { title: "My Tasks", url: "/dashboard/volunteer/tasks", icon: Inbox },
    { title: "NGOs", url: "/volunteer/ngos", icon: Building2 },
    { title: "Community", url: "/community", icon: MessageSquare },
    { title: "My Profile", url: "/profile", icon: UserCircle },
  ];

  const items = user?.role === "ngo" ? ngoItems : volunteerItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b hidden">
        <Link href="/" className="flex items-center gap-2 px-2">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-primary">CareConnect</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground">
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3 px-2 mb-4">
          <Avatar className="h-9 w-9 border border-primary/10">
            <AvatarImage src={user?.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold uppercase">
              {user?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-secondary truncate">{user?.name}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
