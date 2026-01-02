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
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

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
    return <NotFound />; // Or redirect to correct dashboard
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={AuthPage} />
      <Route path="/register" component={AuthPage} />
      
      {/* Public cause details */}
      <Route path="/cause/:id" component={CauseDetails} />

      {/* Protected NGO Routes */}
      <Route path="/dashboard/ngo">
        {() => <ProtectedRoute component={NgoDashboard} allowedRole="ngo" />}
      </Route>
      <Route path="/dashboard/ngo/causes">
        {() => <ProtectedRoute component={NgoDashboard} allowedRole="ngo" />}
      </Route>

      {/* Protected Volunteer Routes */}
      <Route path="/dashboard/volunteer">
        {() => <ProtectedRoute component={VolunteerDashboard} allowedRole="volunteer" />}
      </Route>
      <Route path="/dashboard/volunteer/tasks">
        {() => <ProtectedRoute component={MyTasks} allowedRole="volunteer" />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
