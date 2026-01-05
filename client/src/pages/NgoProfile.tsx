import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { User, Cause, PostResponse } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Building2, MapPin, Mail, Heart, MessageSquare, Globe, CheckCircle2 } from "lucide-react";
import { CauseCard } from "@/components/CauseCard";
import { PostCard } from "../components/PostCard";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
    <div className="max-w-5xl mx-auto pb-12">
      <Card className="overflow-hidden border-none shadow-sm rounded-lg bg-background">
        {/* Banner Section */}
        <div className="relative h-48 md:h-64 bg-muted">
          {ngo.bannerUrl ? (
            <img 
              src={ngo.bannerUrl} 
              alt={`${ngo.name} Banner`} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/10 to-primary/5" />
          )}
        </div>

        <CardContent className="relative px-6 pb-6">
          {/* Avatar Section */}
          <div className="relative -mt-16 mb-4 inline-block">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-md">
              <AvatarImage src={ngo.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-4xl font-bold uppercase">
                {ngo.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-secondary">{ngo.name}</h1>
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-lg text-secondary/80">
                {ngo.headline || 'Non-Profit Organization'}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {ngo.location || 'Global Support Network'}
                </span>
                {ngo.website && (
                  <a href={ngo.website} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                    Visit Our Website
                  </a>
                )}
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>{ngo.email}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Section */}
      <div className="mt-8 space-y-6">
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

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold text-secondary mb-4">About Us</h3>
              <p className="text-secondary/80 leading-relaxed whitespace-pre-wrap">
                {ngo.description || "Dedicated to community service and social impact. This NGO works tirelessly to connect volunteers with meaningful causes that drive real change in the community."}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-secondary">Active Causes</h2>
              <p className="text-muted-foreground">Opportunities to make a difference</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>
    </div>
  );
}
