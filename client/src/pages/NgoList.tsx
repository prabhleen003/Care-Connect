import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Loader2, Building2 } from "lucide-react";
import { useState } from "react";

export default function NgoList() {
  const [search, setSearch] = useState("");
  const { data: ngos, isLoading } = useQuery<User[]>({
    queryKey: ["/api/ngos"],
  });

  const filteredNgos = ngos?.filter((ngo) =>
    ngo.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search NGOs by name..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-ngos"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNgos?.map((ngo) => (
          <Card key={ngo.id} className="hover-elevate transition-all" data-testid={`card-ngo-${ngo.id}`}>
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">{ngo.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 mt-0.5 shrink-0" />
                <p>Dedicated to community service and social impact. Connecting volunteers with meaningful causes.</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>Global Support Network</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNgos?.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium">No NGOs found</h3>
          <p className="text-muted-foreground">Try adjusting your search terms.</p>
        </div>
      )}
    </div>
  );
}
