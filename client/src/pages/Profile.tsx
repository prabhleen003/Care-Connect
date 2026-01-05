import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { User } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Globe, Phone, Mail, Edit3, Camera, X, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      headline: user?.headline || "",
      description: user?.description || "",
      location: user?.location || "",
      website: user?.website || "",
      phoneNumber: user?.phoneNumber || "",
      avatarUrl: user?.avatarUrl || "",
      bannerUrl: user?.bannerUrl || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await apiRequest("PATCH", "/api/user", data);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      setIsEditing(false);
      toast({ title: "Profile updated successfully" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error updating profile",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <Card className="overflow-hidden border-none shadow-sm rounded-lg bg-background">
        {/* Banner Section */}
        <div className="relative h-48 md:h-64 bg-muted group">
          {user.bannerUrl ? (
            <img 
              src={user.bannerUrl} 
              alt="Profile Banner" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/10 to-primary/5" />
          )}
          {isEditing && (
            <div className="absolute top-4 right-4">
              <Button 
                variant="secondary" 
                size="icon" 
                className="rounded-full shadow-lg"
                onClick={() => {
                  const url = prompt("Enter banner image URL:");
                  if (url !== null) form.setValue("bannerUrl", url);
                }}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <CardContent className="relative px-6 pb-6">
          {/* Avatar Section */}
          <div className="relative -mt-16 mb-4 inline-block group">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-md">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-4xl font-bold uppercase">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button 
                variant="secondary" 
                size="icon" 
                className="absolute bottom-2 right-2 rounded-full shadow-lg border-2 border-background"
                onClick={() => {
                  const url = prompt("Enter profile image URL:");
                  if (url !== null) form.setValue("avatarUrl", url);
                }}
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-secondary">{user.name}</h1>
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-lg text-secondary/80">
                {user.headline || (user.role === 'ngo' ? 'Non-Profit Organization' : 'Community Volunteer')}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {user.location}
                  </span>
                )}
                {user.website && (
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                    Visit My Website
                  </a>
                )}
              </div>
              <p className="text-sm font-medium text-primary hover:underline cursor-pointer">
                500+ connections
              </p>
            </div>

            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="icon" className="rounded-full border-secondary/20">
                <Edit3 className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={form.handleSubmit((data) => updateProfileMutation.mutate(data))} disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <Card className="mt-6 border-none shadow-sm">
          <CardContent className="pt-6">
            <Form {...form}>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <CustomFormLabel>Full Name</CustomFormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="headline"
                    render={({ field }) => (
                      <FormItem>
                        <CustomFormLabel>Headline</CustomFormLabel>
                        <FormControl><Input {...field} placeholder="e.g. Student at University, Program Manager..." /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <CustomFormLabel>Location</CustomFormLabel>
                        <FormControl><Input {...field} placeholder="City, State, Country" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <CustomFormLabel>Website</CustomFormLabel>
                        <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <CustomFormLabel>About</CustomFormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[120px] resize-none" placeholder="Share your story..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {!isEditing && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-none shadow-sm">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold text-secondary mb-4">About</h3>
              <p className="text-secondary/80 leading-relaxed whitespace-pre-wrap">
                {user.description || "No description provided yet."}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-xl font-bold text-secondary mb-2">Contact Info</h3>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.phoneNumber && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>{user.phoneNumber}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function CustomFormLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{children}</label>;
}
