import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Cause, insertCauseSchema, InsertCause } from "@shared/schema";
import { useUpdateCause, useDeleteCause } from "@/hooks/use-causes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MapPin, Clock, ArrowRight, Pencil, Trash2, Loader2, CalendarDays, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface CauseCardProps {
  cause: Cause & { ngoName?: string };
  ngoName?: string;
}

const formSchema = insertCauseSchema.omit({ ngoId: true });

export function CauseCard({ cause, ngoName: propNgoName }: CauseCardProps) {
  const { user } = useAuth();
  const isOwner = user?.role === "ngo" && user?.id === cause.ngoId;
  const ngoName = propNgoName || cause.ngoName;

  const fallbackImage = "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80";

  return (
    <div className="group bg-card rounded-2xl border border-border/50 overflow-hidden card-hover h-full flex flex-col">
      <div className="relative h-48 overflow-hidden">
        <img
          src={fallbackImage}
          alt={cause.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
        <div className="absolute top-4 left-4">
          <Badge className="bg-white/90 text-secondary hover:bg-white capitalize backdrop-blur-sm">
            {cause.category}
          </Badge>
        </div>
        {isOwner && (
          <div className="absolute top-4 right-4 flex gap-1.5">
            <EditCauseDialog cause={cause} />
            <DeleteCauseButton cause={cause} />
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <Badge variant={(cause.urgency ?? 0) > 7 ? "destructive" : "secondary"} className="shadow-lg">
            Urgency: {cause.urgency ?? 0}/10
          </Badge>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1">{cause.title}</h3>
        <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-grow">
          {cause.description}
        </p>

        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mb-6">
          {ngoName && (
            <div className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span>Posted by <span className="font-medium text-foreground">{ngoName}</span></span>
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>{cause.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Posted recently</span>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <Link href={`/cause/${cause.id}`} className="w-full">
            <Button className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
              View Details
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function EditCauseDialog({ cause }: { cause: Cause }) {
  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: cause.startDate ? new Date(cause.startDate) : undefined,
    to: cause.endDate ? new Date(cause.endDate) : undefined,
  });
  const updateCause = useUpdateCause();

  const form = useForm<Omit<InsertCause, "ngoId">>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: cause.title,
      description: cause.description,
      category: cause.category,
      location: cause.location,
      urgency: cause.urgency ?? 5,
      status: (cause.status as "open" | "closed") ?? "open",
    },
  });

  const onSubmit = (data: Omit<InsertCause, "ngoId">) => {
    updateCause.mutate(
      {
        causeId: cause.id,
        data: {
          ...data,
          startDate: dateRange?.from ?? null,
          endDate: dateRange?.to ?? null,
        },
      },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 bg-white/90 hover:bg-white backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-primary">Edit Cause</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Cause Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Community Beach Cleanup" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Environment">Environment</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Community">Community</SelectItem>
                        <SelectItem value="Animals">Animals</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="City, State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Cause Duration</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d, yyyy")} — {format(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      "Select start and end dates"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <FormField
              control={form.control}
              name="urgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Urgency Level: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[field.value || 5]}
                      onValueChange={(val) => field.onChange(val[0])}
                      className="py-4"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value ?? "open"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the cause, what volunteers will do, and the impact..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateCause.isPending} className="bg-primary">
                {updateCause.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCauseButton({ cause }: { cause: Cause }) {
  const deleteCause = useDeleteCause();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="icon"
          variant="destructive"
          className="h-8 w-8 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{cause.title}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this cause and all associated volunteer applications. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => deleteCause.mutate(cause.id)}
            disabled={deleteCause.isPending}
          >
            {deleteCause.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
