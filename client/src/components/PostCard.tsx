import { PostResponse } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageSquare, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface PostCardProps {
  post: PostResponse;
}

export function PostCard({ post }: PostCardProps) {
  const { toast } = useToast();
  const [commentingId, setCommentingId] = useState<number | null>(null);
  const [commentContent, setCommentContent] = useState("");

  const likeMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/like`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/author/${post.authorId}`] });
    }
  });

  const commentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number, content: string }) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/comments`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/author/${post.authorId}`] });
      setCommentContent("");
      setCommentingId(null);
      toast({ title: "Comment added" });
    }
  });

  return (
    <Card className="overflow-hidden border-border/60 hover:shadow-md transition-shadow h-full flex flex-col">
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
            {post.createdAt ? format(new Date(post.createdAt), "MMM d, yyyy") : ""}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4 flex-1 flex flex-col">
        <p className="whitespace-pre-wrap text-secondary/90 leading-relaxed line-clamp-4">{post.content}</p>
        {post.mediaUrl && (
          <div className="rounded-xl overflow-hidden border bg-muted/20 shadow-inner mt-auto">
            {post.mediaType === "video" ? (
              <video 
                src={post.mediaUrl} 
                className="w-full aspect-video object-cover"
              />
            ) : (
              <img 
                src={post.mediaUrl} 
                alt="Post content" 
                className="w-full h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80";
                }}
              />
            )}
          </div>
        )}
        
        <div className="flex items-center gap-4 pt-4 border-t mt-auto">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
