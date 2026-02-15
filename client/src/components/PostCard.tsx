import { PostResponse } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageSquare, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-0">
        <Avatar className="h-10 w-10 ring-2 ring-primary/10">
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold">
            {post.author?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-secondary truncate text-sm">{post.author?.name}</span>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider shrink-0">
              {post.author?.role}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ""}
          </span>
        </div>
      </div>

      <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
        <p className="whitespace-pre-wrap text-secondary/90 leading-relaxed text-sm line-clamp-4">{post.content}</p>

        {post.mediaUrl && (
          <div className="rounded-xl overflow-hidden bg-muted/30 mt-auto">
            {post.mediaType === "video" ? (
              <video src={post.mediaUrl} className="w-full aspect-video object-cover" />
            ) : (
              <img
                src={post.mediaUrl}
                alt="Post content"
                className="w-full h-48 object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-3 border-t mt-auto">
          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-2 text-muted-foreground hover:text-red-500", post.isLiked && "text-red-500")}
            onClick={() => likeMutation.mutate(post.id)}
          >
            <Heart className={cn("h-4 w-4", post.isLiked && "fill-current")} />
            <span className="text-xs">{post.likesCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-primary"
            onClick={() => setCommentingId(commentingId === post.id ? null : post.id)}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">{post.commentsCount}</span>
          </Button>
        </div>

        {commentingId === post.id && (
          <div className="flex gap-2 items-center bg-muted/40 rounded-full px-3 py-1">
            <Input
              placeholder="Write a comment..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commentContent.trim()) {
                  commentMutation.mutate({ postId: post.id, content: commentContent });
                }
              }}
              className="border-none shadow-none bg-transparent h-8 focus-visible:ring-0 px-0 text-sm"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0 rounded-full text-primary"
              disabled={!commentContent.trim() || commentMutation.isPending}
              onClick={() => commentMutation.mutate({ postId: post.id, content: commentContent })}
            >
              {commentMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
