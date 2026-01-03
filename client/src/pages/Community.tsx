import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPostSchema, type PostResponse } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Send, Plus, Image as ImageIcon, Heart, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Community() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: posts, isLoading, error } = useQuery<PostResponse[]>({ 
    queryKey: ["/api/posts"] 
  });

  const form = useForm({
    resolver: zodResolver(insertPostSchema.omit({ authorId: true })),
    defaultValues: {
      content: "",
      mediaUrl: "",
      mediaType: "image",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/posts", data);
      if (!res.ok) throw new Error("Failed to create post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      form.reset();
      setIsDialogOpen(false);
      toast({ title: "Post created successfully" });
    },
    onError: (err: Error) => {
      toast({ 
        title: "Error creating post", 
        description: err.message,
        variant: "destructive" 
      });
    }
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/like`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    }
  });

  const [commentingId, setCommentingId] = useState<number | null>(null);
  const [commentContent, setCommentContent] = useState("");

  const commentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number, content: string }) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/comments`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setCommentContent("");
      setCommentingId(null);
      toast({ title: "Comment added" });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-destructive">Failed to load community feed</h2>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center bg-background p-4 rounded-lg border shadow-sm sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Community</h2>
          <p className="text-sm text-muted-foreground">Share your stories and updates</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Share with the Community</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createPostMutation.mutate(data))} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What's happening?</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell your story..." 
                          className="min-h-[150px] resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mediaUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image/Video URL</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="https://..." {...field} className="pl-9" />
                            <ImageIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mediaType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Media Type</FormLabel>
                        <FormControl>
                          <select 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full mt-4 h-11" 
                  disabled={createPostMutation.isPending}
                >
                  {createPostMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Post Story
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {posts?.map((post) => (
          <Card key={post.id} className="overflow-hidden border-border/60 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 py-4 bg-muted/5">
              <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {post.author?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-secondary">{post.author?.name}</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                    {post.author?.role}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {post.createdAt ? format(new Date(post.createdAt), "MMM d, yyyy • h:mm a") : ""}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <p className="whitespace-pre-wrap text-secondary/90 leading-relaxed">{post.content}</p>
              {post.mediaUrl && (
                <div className="rounded-xl overflow-hidden border bg-muted/20 shadow-inner">
                  {post.mediaType === "video" ? (
                    <video 
                      src={post.mediaUrl} 
                      controls 
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <img 
                      src={post.mediaUrl} 
                      alt="Post content" 
                      className="w-full h-auto object-cover max-h-[600px]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80";
                      }}
                    />
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-4 pt-4 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn("gap-2", post.isLiked && "text-red-500 hover:text-red-600")}
                  onClick={() => likeMutation.mutate(post.id)}
                >
                  <Heart className={cn("h-4 w-4", post.isLiked && "fill-current")} />
                  {post.likesCount}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setCommentingId(commentingId === post.id ? null : post.id)}
                >
                  <MessageSquare className="h-4 w-4" />
                  {post.commentsCount}
                </Button>
              </div>

              {commentingId === post.id && (
                <div className="pt-4 space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Write a comment..." 
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && commentContent.trim()) {
                          commentMutation.mutate({ postId: post.id, content: commentContent });
                        }
                      }}
                    />
                    <Button 
                      size="sm"
                      disabled={!commentContent.trim() || commentMutation.isPending}
                      onClick={() => commentMutation.mutate({ postId: post.id, content: commentContent })}
                    >
                      {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {post.comments?.map((comment) => (
                      <div key={comment.id} className="bg-muted/30 p-3 rounded-lg text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-secondary">{comment.author.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {comment.createdAt ? format(new Date(comment.createdAt), "MMM d, h:mm a") : ""}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {posts?.length === 0 && (
          <div className="text-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed">
            <div className="bg-background w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-secondary">No stories yet</h3>
            <p className="text-muted-foreground">Be the first to share an update with the community!</p>
          </div>
        )}
      </div>
    </div>
  );
}
    </div>
  );
}
        {posts?.length === 0 && (
          <div className="text-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed">
            <div className="bg-background w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-secondary">No stories yet</h3>
            <p className="text-muted-foreground">Be the first to share an update with the community!</p>
          </div>
        )}
      </div>
    </div>
  );
}
