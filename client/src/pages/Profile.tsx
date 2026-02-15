import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { User } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Phone, Mail, Edit3, Camera, Globe, Upload, User as UserIcon, FileText, Briefcase } from "lucide-react";
import { useState, useRef } from "react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

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

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  const handleImageSelect = (type: "avatar" | "banner") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (type === "avatar") {
        setAvatarPreview(ev.target?.result as string);
        setAvatarFile(file);
      } else {
        setBannerPreview(ev.target?.result as string);
        setBannerFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const updateData = { ...data };

      if (avatarFile) {
        updateData.avatarUrl = await uploadFile(avatarFile);
      }
      if (bannerFile) {
        updateData.bannerUrl = await uploadFile(bannerFile);
      }

      const res = await apiRequest("PATCH", "/api/user", updateData);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      setIsEditing(false);
      setAvatarPreview(null);
      setBannerPreview(null);
      setAvatarFile(null);
      setBannerFile(null);
      toast({ title: "Profile updated successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error updating profile", description: err.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  const displayAvatar = avatarPreview || user.avatarUrl;
  const displayBanner = bannerPreview || user.bannerUrl;

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      {/* Hidden file inputs */}
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect("avatar")} />
      <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect("banner")} />

      {/* Main Profile Card */}
      <Card className="overflow-hidden border-none shadow-md rounded-2xl bg-background">
        {/* Banner */}
        <div className="relative h-52 md:h-72 bg-muted group">
          {displayBanner ? (
            <img src={displayBanner} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5" />
          )}
          {isEditing && (
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <div className="flex items-center gap-2 bg-white/90 text-secondary px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                <Camera className="h-4 w-4" />
                Change Banner
              </div>
            </button>
          )}
        </div>

        <CardContent className="relative px-6 md:px-10 pb-8">
          {/* Avatar */}
          <div className="relative -mt-20 mb-5 inline-block group">
            <Avatar className="h-36 w-36 md:h-44 md:w-44 border-[5px] border-background shadow-lg">
              <AvatarImage src={displayAvatar || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-5xl font-bold uppercase">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-2 right-2 bg-primary text-white p-2.5 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Name & Info Row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1 space-y-1.5">
              <h1 className="text-3xl font-bold text-secondary tracking-tight">{user.name}</h1>
              <p className="text-lg text-muted-foreground">
                {user.headline || (user.role === 'ngo' ? 'Non-Profit Organization' : 'Community Volunteer')}
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground pt-1">
                {user.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary/70" /> {user.location}
                  </span>
                )}
                {user.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-primary/70" /> {user.email}
                  </span>
                )}
                {user.website && (
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline font-medium">
                    <Globe className="h-4 w-4" /> Website
                  </a>
                )}
              </div>
            </div>

            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="rounded-full gap-2 px-5" variant="outline">
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={form.handleSubmit((data) => updateProfileMutation.mutate(data))}
                  disabled={updateProfileMutation.isPending}
                  className="rounded-full px-6"
                >
                  {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Changes
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => {
                  setIsEditing(false);
                  setAvatarPreview(null);
                  setBannerPreview(null);
                  setAvatarFile(null);
                  setBannerFile(null);
                }}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      {isEditing && (
        <Card className="mt-6 border-none shadow-md rounded-2xl">
          <CardContent className="p-6 md:p-8">
            <h3 className="text-xl font-bold text-secondary mb-6">Edit Profile</h3>
            <Form {...form}>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <label className="text-sm font-medium text-secondary flex items-center gap-2 mb-1.5">
                          <UserIcon className="h-3.5 w-3.5 text-primary/70" /> Full Name
                        </label>
                        <FormControl><Input {...field} className="h-11 rounded-lg" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="headline"
                    render={({ field }) => (
                      <FormItem>
                        <label className="text-sm font-medium text-secondary flex items-center gap-2 mb-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-primary/70" /> Headline
                        </label>
                        <FormControl><Input {...field} placeholder="e.g. Student, Program Manager..." className="h-11 rounded-lg" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <label className="text-sm font-medium text-secondary flex items-center gap-2 mb-1.5">
                          <Mail className="h-3.5 w-3.5 text-primary/70" /> Email
                        </label>
                        <FormControl><Input {...field} className="h-11 rounded-lg" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <label className="text-sm font-medium text-secondary flex items-center gap-2 mb-1.5">
                          <Phone className="h-3.5 w-3.5 text-primary/70" /> Phone
                        </label>
                        <FormControl><Input {...field} placeholder="+91 ..." className="h-11 rounded-lg" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <label className="text-sm font-medium text-secondary flex items-center gap-2 mb-1.5">
                          <MapPin className="h-3.5 w-3.5 text-primary/70" /> Location
                        </label>
                        <FormControl><Input {...field} placeholder="City, State, Country" className="h-11 rounded-lg" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <label className="text-sm font-medium text-secondary flex items-center gap-2 mb-1.5">
                          <Globe className="h-3.5 w-3.5 text-primary/70" /> Website
                        </label>
                        <FormControl><Input {...field} placeholder="https://..." className="h-11 rounded-lg" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Image upload section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary flex items-center gap-2">
                      <Camera className="h-3.5 w-3.5 text-primary/70" /> Profile Photo
                    </label>
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      className="border-2 border-dashed rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    >
                      {avatarPreview || user.avatarUrl ? (
                        <img src={avatarPreview || user.avatarUrl!} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-secondary">Click to upload</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG, GIF up to 10MB</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary flex items-center gap-2">
                      <Camera className="h-3.5 w-3.5 text-primary/70" /> Banner Image
                    </label>
                    <div
                      onClick={() => bannerInputRef.current?.click()}
                      className="border-2 border-dashed rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    >
                      {bannerPreview || user.bannerUrl ? (
                        <img src={bannerPreview || user.bannerUrl!} alt="Banner" className="h-16 w-28 rounded-lg object-cover" />
                      ) : (
                        <div className="h-16 w-28 rounded-lg bg-muted flex items-center justify-center">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-secondary">Click to upload</p>
                        <p className="text-xs text-muted-foreground">Recommended: 1400 x 400px</p>
                      </div>
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <label className="text-sm font-medium text-secondary flex items-center gap-2 mb-1.5">
                        <FileText className="h-3.5 w-3.5 text-primary/70" /> About
                      </label>
                      <FormControl>
                        <Textarea {...field} className="min-h-[140px] resize-none rounded-lg" placeholder="Tell your story..." />
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

      {/* View Mode - About & Contact */}
      {!isEditing && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-md rounded-2xl">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary/70" /> About
              </h3>
              <p className="text-secondary/80 leading-relaxed whitespace-pre-wrap text-[15px]">
                {user.description || "No description provided yet. Click 'Edit Profile' to add one."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md rounded-2xl">
            <CardContent className="p-6 md:p-8 space-y-5">
              <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary/70" /> Contact
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{user.phoneNumber}</p>
                    </div>
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-medium">{user.location}</p>
                    </div>
                  </div>
                )}
                {user.website && (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Website</p>
                      <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                        {user.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
