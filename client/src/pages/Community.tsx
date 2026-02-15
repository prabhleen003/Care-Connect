import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPostSchema, type PostResponse } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, ImageIcon, Heart, MessageSquare, X, Upload, Sparkles } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";

export default function Community() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: posts, isLoading, error } = useQuery<PostResponse[]>({
    queryKey: ["/api/posts"]
  });

  const form = useForm({
    resolver: zodResolver(insertPostSchema.omit({ authorId: true })),
    defaultValues: {
      content: "",
      mediaUrl: "",
      mediaType: "image" as const,
    },
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 10MB", variant: "destructive" });
      return;
    }

    setSelectedFile(file);
    const isVideo = file.type.startsWith("video/");
    form.setValue("mediaType", isVideo ? "video" : "image");

    const reader = new FileReader();
    reader.onload = (ev) => setFilePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, [form, toast]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
    form.setValue("mediaUrl", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [form]);

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upload failed: ${res.status} ${text.substring(0, 100)}`);
    }
    const data = await res.json();
    return data.url;
  };

  const createPostMutation = useMutation({
    mutationFn: async (data: any) => {
      const file = data._file;
      const postData: any = { content: data.content, mediaType: data.mediaType, mediaUrl: data.mediaUrl || "" };

      if (file) {
        setIsUploading(true);
        try {
          postData.mediaUrl = await uploadFile(file);
        } finally {
          setIsUploading(false);
        }
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.startsWith("<") ? `Server error (${res.status})` : text);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      form.reset();
      clearFile();
      setIsDialogOpen(false);
      toast({ title: "Post shared with the community!" });
    },
    onError: (err: Error) => {
      setIsUploading(false);
      toast({ title: "Error creating post", description: err.message, variant: "destructive" });
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
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading community feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-destructive">Failed to load community feed</h2>
        <p className="text-muted-foreground mt-2">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 pb-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-3xl font-bold text-secondary tracking-tight">Community</h2>
        </div>
        <p className="text-muted-foreground">Stories, updates, and moments from our community</p>
      </div>

      {/* Create Post Card */}
      {user && (
        <Card className="border-none shadow-sm bg-gradient-to-r from-background to-muted/20">
          <CardContent className="p-4">
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) clearFile();
            }}>
              <DialogTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer group">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-muted/50 rounded-full px-5 py-2.5 text-sm text-muted-foreground group-hover:bg-muted/80 transition-colors">
                    What's on your mind, {user.name.split(" ")[0]}?
                  </div>
                  <Button size="sm" variant="ghost" className="text-primary hover:text-primary/80">
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                  <DialogTitle className="text-xl font-bold text-center">Create a Post</DialogTitle>
                </DialogHeader>
                <div className="border-t mt-4" />
                <div className="p-6 pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                    </div>
                  </div>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => createPostMutation.mutate({ ...data, _file: selectedFile }))} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Share your story, an update, or an inspiring moment..."
                                className="min-h-[120px] resize-none border-none shadow-none text-base focus-visible:ring-0 p-0 placeholder:text-muted-foreground/60"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* File Preview */}
                      {filePreview && (
                        <div className="relative rounded-xl overflow-hidden border bg-muted/30">
                          <button
                            type="button"
                            onClick={clearFile}
                            className="absolute top-2 right-2 z-10 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          {selectedFile?.type.startsWith("video/") ? (
                            <video src={filePreview} controls className="w-full max-h-[300px] object-contain" />
                          ) : (
                            <img src={filePreview} alt="Preview" className="w-full max-h-[300px] object-contain" />
                          )}
                        </div>
                      )}

                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground mr-2">Add to post</span>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*,video/mp4,video/webm"
                              className="hidden"
                              onChange={handleFileSelect}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="rounded-full h-9 w-9 text-green-600 hover:bg-green-50 hover:text-green-700"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="h-5 w-5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="rounded-full h-9 w-9 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                              onClick={() => {
                                const url = form.getValues("mediaUrl");
                                if (!url) {
                                  const input = window.prompt("Enter image/video URL:");
                                  if (input) {
                                    form.setValue("mediaUrl", input);
                                    setFilePreview(input);
                                  }
                                }
                              }}
                            >
                              <ImageIcon className="h-5 w-5" />
                            </Button>
                          </div>
                          <Button
                            type="submit"
                            className="rounded-full px-6"
                            disabled={createPostMutation.isPending || isUploading || !form.watch("content")?.trim()}
                          >
                            {(createPostMutation.isPending || isUploading) ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            {isUploading ? "Uploading..." : "Post"}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Posts Feed */}
      <div className="space-y-5">
        {posts?.map((post) => (
          <Card key={post.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-200">
            {/* Post Header */}
            <div className="flex items-center gap-3 p-4 pb-0">
              <Avatar className="h-11 w-11 ring-2 ring-primary/10">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold">
                  {post.author?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-secondary truncate">{post.author?.name}</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider shrink-0">
                    {post.author?.role}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ""}
                </span>
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Post Content */}
              <p className="whitespace-pre-wrap text-secondary/90 leading-relaxed">{post.content}</p>

              {/* Post Media */}
              {post.mediaUrl && (
                <div className="rounded-xl overflow-hidden bg-muted/30 -mx-4">
                  {post.mediaType === "video" ? (
                    <video
                      src={post.mediaUrl}
                      controls
                      className="w-full max-h-[500px] object-contain bg-black"
                    />
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt="Post content"
                      className="w-full max-h-[500px] object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
              )}

              {/* Like & Comment counts summary */}
              {(post.likesCount > 0 || post.commentsCount > 0) && (
                <div className="flex items-center justify-between text-xs text-muted-foreground py-1">
                  <span>{post.likesCount > 0 ? `${post.likesCount} ${post.likesCount === 1 ? 'like' : 'likes'}` : ''}</span>
                  <span>{post.commentsCount > 0 ? `${post.commentsCount} ${post.commentsCount === 1 ? 'comment' : 'comments'}` : ''}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center border-t border-b py-1 -mx-4 px-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex-1 gap-2 rounded-lg h-9 text-muted-foreground hover:text-red-500",
                    post.isLiked && "text-red-500"
                  )}
                  onClick={() => likeMutation.mutate(post.id)}
                >
                  <Heart className={cn("h-[18px] w-[18px]", post.isLiked && "fill-current")} />
                  <span className="text-sm font-medium">Like</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-2 rounded-lg h-9 text-muted-foreground hover:text-primary"
                  onClick={() => setCommentingId(commentingId === post.id ? null : post.id)}
                >
                  <MessageSquare className="h-[18px] w-[18px]" />
                  <span className="text-sm font-medium">Comment</span>
                </Button>
              </div>

              {/* Comments Section */}
              {(commentingId === post.id || (post.comments && post.comments.length > 0)) && (
                <div className="space-y-3 pt-1">
                  {/* Existing Comments */}
                  {post.comments?.slice(-3).map((comment) => (
                    <div key={comment.id} className="flex gap-2.5">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-muted text-xs font-bold">
                          {comment.author.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted/50 rounded-2xl px-3.5 py-2 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold">{comment.author.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ""}
                          </span>
                        </div>
                        <p className="text-sm text-secondary/80 mt-0.5">{comment.content}</p>
                      </div>
                    </div>
                  ))}

                  {/* Comment Input */}
                  {commentingId === post.id && (
                    <div className="flex gap-2.5 items-center">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex gap-2 bg-muted/40 rounded-full px-4 py-1 items-center">
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
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {posts?.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-secondary mb-2">No stories yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Be the first to share an update with the community. Your story matters!
            </p>
            {user && (
              <Button className="mt-6 rounded-full" onClick={() => setIsDialogOpen(true)}>
                Share Your First Post
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
