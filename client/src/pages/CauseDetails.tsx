import { useCause } from "@/hooks/use-causes";
import { useApplyForCause, useUploadProof, useUpdateTaskStatus } from "@/hooks/use-tasks";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, Link } from "wouter";
import { Loader2, MapPin, Tag, AlertCircle, CheckCircle, Heart } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDonationSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CauseDetails() {
  const { id } = useParams<{ id: string }>();
  const { data: cause, isLoading } = useCause(Number(id));
  const applyMutation = useApplyForCause();
  const { user } = useAuth();
  const { toast } = useToast();

  const donationForm = useForm({
    resolver: zodResolver(insertDonationSchema.omit({ volunteerId: true, causeId: true })),
    defaultValues: { amount: "10" },
  });

  const donateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/donations", { 
        ...data, 
        causeId: Number(id),
        amount: data.amount.toString()
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Donation successful! Thank you for your support." });
      donationForm.reset();
    },
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cause) {
    return (
      <div className="h-screen flex items-center justify-center flex-col">
        <h1 className="text-2xl font-bold mb-4">Cause not found</h1>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  // Use placehold.co or Unsplash based on category
  const imageUrl = `https://source.unsplash.com/random/1200x600/?${cause.category},helping`;
  // Using static fallback if dynamic fails for stability
  const fallbackImage = "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1200&q=80";

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />

      <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
        <img 
          src={fallbackImage} 
          alt={cause.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
          <Badge className="bg-white/90 text-black hover:bg-white mb-4 text-base px-4 py-1">
            {cause.category}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 shadow-sm">
            {cause.title}
          </h1>
          <div className="flex items-center text-white/90 gap-2">
            <MapPin className="h-5 w-5" />
            <span className="text-lg">{cause.location}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-display font-bold text-secondary mb-4">About the Cause</h2>
            <div className="prose prose-lg text-muted-foreground">
              <p>{cause.description}</p>
            </div>
          </section>

          <section className="bg-muted/30 rounded-2xl p-6 border border-border/50">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Impact Summary
            </h3>
            <p className="text-muted-foreground">
              By volunteering for this task, you are directly contributing to the {cause.category.toLowerCase()} development in {cause.location}. 
              This is rated as {cause.urgency}/10 urgency, meaning your immediate help is highly valued.
            </p>
          </section>
        </div>

        <div className="md:col-span-1">
          <Card className="sticky top-24 shadow-lg border-primary/10">
            <CardContent className="p-6 space-y-6">
              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold mb-1">Status</div>
                <div className="flex items-center gap-2">
                   <div className={`h-3 w-3 rounded-full ${cause.status === 'open' ? 'bg-green-500' : 'bg-red-500'}`} />
                   <span className="font-medium capitalize">{cause.status}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold mb-1">Urgency</div>
                <div className="w-full bg-secondary/10 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${cause.urgency > 7 ? 'bg-red-500' : 'bg-primary'}`} 
                    style={{ width: `${cause.urgency * 10}%` }} 
                  />
                </div>
                <div className="text-right text-xs mt-1 font-medium">{cause.urgency}/10</div>
              </div>

              <div className="pt-4 border-t">
                {!user ? (
                  <Link href="/login">
                    <Button className="w-full h-12 text-lg">Sign in to Volunteer</Button>
                  </Link>
                ) : user.role === 'ngo' ? (
                  <Button variant="outline" className="w-full h-12" disabled>
                    NGOs cannot apply
                  </Button>
                ) : (
                  <Button 
                    className="w-full h-12 text-lg shadow-lg shadow-primary/20" 
                    onClick={() => applyMutation.mutate(cause.id)}
                    disabled={applyMutation.isPending}
                  >
                    {applyMutation.isPending ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-5 w-5" />
                    )}
                    Apply Now
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {user?.role === 'volunteer' && (
            <Card className="shadow-lg border-primary/10 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-red-500" />
                  Make a Donation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...donationForm}>
                  <form onSubmit={donationForm.handleSubmit((data) => donateMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={donationForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount ($)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-red-500 hover:bg-red-600"
                      disabled={donateMutation.isPending}
                    >
                      {donateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Donate Now
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
