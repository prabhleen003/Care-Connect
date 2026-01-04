import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { User, Cause, PostResponse } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, MapPin, Mail, Heart, MessageSquare } from "lucide-react";
import { CauseCard } from "@/components/CauseCard";
import { PostCard } from "../components/PostCard";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const { data: posts, isLoading: isLoadingPosts } = useQuery<PostResponse[]>({
    queryKey: [`/api/posts/author/${ngoId}`],
  });

  if (isLoadingNgo || isLoadingCauses || isLoadingPosts) {
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

      {/* Posts Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-secondary">Community Updates</h2>
            <p className="text-muted-foreground">Recent activities and announcements</p>
          </div>
          {posts && posts.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">Show All Posts</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                  <DialogTitle>All Posts from {ngo.name}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {posts && posts.length > 0 ? (
          <div className="relative">
            <div className="flex gap-6 overflow-x-auto pb-6 snap-x scrollbar-hide">
              {posts.slice(0, 3).map((post) => (
                <div key={post.id} className="min-w-[350px] max-w-[400px] snap-start">
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium">No updates yet</h3>
            <p className="text-muted-foreground">This NGO hasn't posted any updates to the community feed.</p>
          </div>
        )}
      </div>

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
