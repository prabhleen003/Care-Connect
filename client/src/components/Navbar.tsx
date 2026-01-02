import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HeartHandshake, LogOut, LayoutDashboard, Search, ListTodo } from "lucide-react";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
    window.location.href = "/";
  };

  return (
    <nav className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
            <HeartHandshake className="h-6 w-6 text-primary" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            Care<span className="text-primary">Connect</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Role-based Navigation Links */}
              <div className="hidden md:flex items-center gap-6 mr-4">
                {user.role === "ngo" ? (
                  <>
                    <Link href="/dashboard/ngo" className={`text-sm font-medium hover:text-primary transition-colors ${location === '/dashboard/ngo' ? 'text-primary' : 'text-muted-foreground'}`}>
                      Overview
                    </Link>
                    <Link href="/dashboard/ngo/causes" className={`text-sm font-medium hover:text-primary transition-colors ${location === '/dashboard/ngo/causes' ? 'text-primary' : 'text-muted-foreground'}`}>
                      My Causes
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard/volunteer" className={`text-sm font-medium hover:text-primary transition-colors ${location === '/dashboard/volunteer' ? 'text-primary' : 'text-muted-foreground'}`}>
                      Find Causes
                    </Link>
                    <Link href="/dashboard/volunteer/tasks" className={`text-sm font-medium hover:text-primary transition-colors ${location === '/dashboard/volunteer/tasks' ? 'text-primary' : 'text-muted-foreground'}`}>
                      My Tasks
                    </Link>
                  </>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt={user.name} />
                      <AvatarFallback className="bg-primary/5 text-primary font-bold">
                        {user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = user.role === 'ngo' ? '/dashboard/ngo' : '/dashboard/volunteer'}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="font-medium">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
