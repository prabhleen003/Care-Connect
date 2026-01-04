import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/Landing";
import AuthPage from "@/pages/Auth";
import NgoDashboard from "@/pages/ngo/Dashboard";
import VolunteerDashboard from "@/pages/volunteer/Dashboard";
import MyTasks from "@/pages/volunteer/MyTasks";
import CauseDetails from "@/pages/CauseDetails";
import Community from "@/pages/Community";
import DonationInsights from "@/pages/ngo/DonationInsights";
import NgoList from "@/pages/NgoList";
import NgoProfile from "@/pages/NgoProfile";
import Profile from "@/pages/Profile";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

// Protected Route Wrapper
function ProtectedRoute({ 
  component: Component, 
  allowedRole 
}: { 
  component: React.ComponentType<any>, 
  allowedRole: "ngo" | "volunteer" 
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  if (user.role !== allowedRole) {
    return <NotFound />;
  }

  return <Component />;
}

function Layout({ children, title }: { children: React.ReactNode, title: string }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto bg-muted/20">
          <div className="p-4 border-b bg-background flex items-center gap-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="text-xl font-bold">{title}</h1>
          </div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={AuthPage} />
      <Route path="/register" component={AuthPage} />
      
      {/* Public cause details */}
      <Route path="/cause/:id" component={CauseDetails} />

      <Route path="/ngos">
        {() => (
          <Layout title="Registered NGOs">
            <ProtectedRoute component={NgoList} allowedRole="ngo" />
          </Layout>
        )}
      </Route>

      <Route path="/ngo/:id">
        {() => (
          <Layout title="NGO Profile">
            <NgoProfile />
          </Layout>
        )}
      </Route>

      <Route path="/profile">
        {() => (
          <Layout title="My Profile">
            <Profile />
          </Layout>
        )}
      </Route>

      <Route path="/volunteer/ngos">
        {() => (
          <Layout title="Partner NGOs">
            <ProtectedRoute component={NgoList} allowedRole="volunteer" />
          </Layout>
        )}
      </Route>

      {/* Community Feed */}
      <Route path="/community">
        {() => (
          <Layout title="Community Feed">
            <Community />
          </Layout>
        )}
      </Route>

      {/* Protected NGO Routes */}
      <Route path="/dashboard/ngo">
        {() => (
          <Layout title="NGO Dashboard">
            <ProtectedRoute component={NgoDashboard} allowedRole="ngo" />
          </Layout>
        )}
      </Route>
      <Route path="/dashboard/ngo/causes">
        {() => (
          <Layout title="My Causes">
            <ProtectedRoute component={NgoDashboard} allowedRole="ngo" />
          </Layout>
        )}
      </Route>

      {/* Protected Volunteer Routes */}
      <Route path="/dashboard/volunteer">
        {() => (
          <Layout title="Volunteer Dashboard">
            <ProtectedRoute component={VolunteerDashboard} allowedRole="volunteer" />
          </Layout>
        )}
      </Route>
      <Route path="/dashboard/volunteer/tasks">
        {() => (
          <Layout title="My Tasks">
            <ProtectedRoute component={MyTasks} allowedRole="volunteer" />
          </Layout>
        )}
      </Route>

      <Route path="/dashboard/ngo/donations">
        {() => (
          <Layout title="Donation Insights">
            <ProtectedRoute component={DonationInsights} allowedRole="ngo" />
          </Layout>
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
