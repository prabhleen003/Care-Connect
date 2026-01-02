import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCauses } from "@/hooks/use-causes";
import { useMyTasks } from "@/hooks/use-tasks";
import { Navbar } from "@/components/Navbar";
import { CauseCard } from "@/components/CauseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Filter } from "lucide-react";

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ category: "all", location: "" });
  const { data: causes, isLoading } = useCauses(filters);

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      
      <div className="bg-primary/5 border-b border-primary/10 py-12 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-display font-bold text-secondary mb-2">
            Welcome back, {user?.name.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground mb-8">Ready to make a difference today?</p>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by location..." 
                className="pl-9 bg-transparent border-0 ring-0 focus-visible:ring-0 px-0"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="w-px bg-border hidden md:block" />
            <div className="w-full md:w-[200px]">
              <Select 
                value={filters.category} 
                onValueChange={(val) => setFilters(prev => ({ ...prev, category: val }))}
              >
                <SelectTrigger className="border-0 focus:ring-0">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Environment">Environment</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Community">Community</SelectItem>
                  <SelectItem value="Animals">Animals</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="md:w-auto bg-primary text-white">
              Search Causes
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-secondary">Available Opportunities</h2>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : causes?.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
            <h3 className="text-lg font-medium">No causes found matching your filters.</h3>
            <Button 
              variant="link" 
              onClick={() => setFilters({ category: "all", location: "" })}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {causes?.map((cause) => (
              <CauseCard key={cause.id} cause={cause} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
