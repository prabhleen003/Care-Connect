import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { User, Cause } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, MapPin, Mail, Heart } from "lucide-react";
import CauseCard from "@/components/CauseCard";

export default function NgoProfile() {
  const { id } = useParams();
  const ngoId = Number(id);

  const { data: ngos, isLoading: isLoadingNgo } = useQuery<User[]>({
    queryKey: ["/api/ngos"],
  });

  const ngo = ngos?.find((n) => n.id === ngoId);

  const { data: causes, isLoading: isLoadingCauses } = useQuery<Cause[]>({
    queryKey: [`/api/causes/ngo/${ngoId}`],
  });

  if (isLoadingNgo || isLoadingCauses) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ngo) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">NGO not found</h2>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center gap-6">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-sm">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl text-secondary">{ngo.name}</CardTitle>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>Global Support Network</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                <span>{ngo.email}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-secondary/80 leading-relaxed max-w-3xl">
            Dedicated to community service and social impact. This NGO works tirelessly to connect 
            volunteers with meaningful causes that drive real change in the community. Through 
            collaboration and passion, we aim to build a better future for everyone.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Active Causes</h2>
          <p className="text-muted-foreground">Opportunities to make a difference</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {causes?.map((cause) => (
            <CauseCard key={cause.id} cause={cause} />
          ))}
        </div>

        {causes?.length === 0 && (
          <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium">No active causes</h3>
            <p className="text-muted-foreground">This NGO doesn't have any open causes at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
