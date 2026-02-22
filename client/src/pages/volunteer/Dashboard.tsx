import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCauses } from "@/hooks/use-causes";
import { useVolunteerImpact } from "@/hooks/use-impact";
import { Navbar } from "@/components/Navbar";
import { CauseCard } from "@/components/CauseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Filter, LayoutGrid, Map, Clock, Heart, DollarSign, CheckCircle2, Flame, TrendingUp } from "lucide-react";
import { CauseMap } from "@/components/CauseMap";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  Environment: "#10b981",
  Education: "#3b82f6",
  Health: "#ef4444",
  Community: "#f59e0b",
  Animals: "#8b5cf6",
};

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ category: "all", location: "" });
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const { data: causes, isLoading } = useCauses(filters);
  const { data: impact } = useVolunteerImpact();

  const hasImpact = impact && (impact.tasksCompleted > 0 || impact.totalDonated > 0 || impact.activeTasks > 0);

  return (
    <div className="min-h-screen bg-background pb-12">
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

        {/* Impact Summary Section */}
        {hasImpact && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-secondary mb-4">Your Impact</h2>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="border-border/50 bg-gradient-to-br from-emerald-50 to-white">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-100">
                      <Clock className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-secondary">{impact.totalHours}</p>
                      <p className="text-xs text-muted-foreground">Volunteer Hours</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-100">
                      <Heart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-secondary">{impact.causesSupported}</p>
                      <p className="text-xs text-muted-foreground">Causes Supported</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-gradient-to-br from-amber-50 to-white">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-100">
                      <DollarSign className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-secondary">${impact.totalDonated.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Donated</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-gradient-to-br from-purple-50 to-white">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-100">
                      <CheckCircle2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-secondary">{impact.tasksCompleted}</p>
                      <p className="text-xs text-muted-foreground">Tasks Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Contribution Timeline */}
              {impact.timeline.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Contribution Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={impact.timeline}>
                        <defs>
                          <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="donationGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => {
                            const [y, m] = v.split("-");
                            return new Date(Number(y), Number(m) - 1).toLocaleString("default", { month: "short" });
                          }}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          labelFormatter={(v) => {
                            const [y, m] = (v as string).split("-");
                            return new Date(Number(y), Number(m) - 1).toLocaleString("default", { month: "long", year: "numeric" });
                          }}
                          formatter={(value: number, name: string) => [
                            name === "tasks" ? `${value} tasks` : `$${value}`,
                            name === "tasks" ? "Completed" : "Donated",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="tasks"
                          stroke="#10b981"
                          strokeWidth={2}
                          fill="url(#taskGradient)"
                        />
                        <Area
                          type="monotone"
                          dataKey="donated"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="url(#donationGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Category Breakdown */}
              {impact.categories.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Flame className="h-4 w-4 text-primary" />
                      Causes by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={impact.categories} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fontSize: 12 }}
                          width={90}
                        />
                        <Tooltip
                          formatter={(value: number) => [`${value} task${value !== 1 ? "s" : ""}`, "Completed"]}
                        />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                          {impact.categories.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={CATEGORY_COLORS[entry.name] || "#6b7280"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Cause Browsing Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-secondary">Available Opportunities</h2>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="gap-1.5"
            >
              <LayoutGrid className="h-4 w-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("map")}
              className="gap-1.5"
            >
              <Map className="h-4 w-4" />
              Map
            </Button>
          </div>
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
        ) : viewMode === "grid" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {causes?.map((cause) => (
              <CauseCard key={cause.id} cause={cause} />
            ))}
          </div>
        ) : (
          <CauseMap causes={causes ?? []} />
        )}
      </div>
    </div>
  );
}
