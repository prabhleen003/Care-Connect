import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MapPin, Loader2, Building2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

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
          <Link key={ngo.id} href={`/ngo/${ngo.id}`}>
            <Card className="hover-elevate transition-all cursor-pointer h-full overflow-hidden border-none shadow-sm" data-testid={`card-ngo-${ngo.id}`}>
              <div className="relative h-24 bg-muted">
                {ngo.bannerUrl ? (
                  <img src={ngo.bannerUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary/10 to-primary/5" />
                )}
              </div>
              <CardContent className="relative pt-12 pb-6">
                <Avatar className="absolute -top-10 left-6 h-20 w-20 border-4 border-background shadow-sm">
                  <AvatarImage src={ngo.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold uppercase">
                    {ngo.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-secondary truncate">{ngo.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {ngo.headline || (ngo.description?.substring(0, 100) + '...') || 'Dedicated to community service and social impact.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-primary font-medium">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{ngo.location || 'Global Support Network'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
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
