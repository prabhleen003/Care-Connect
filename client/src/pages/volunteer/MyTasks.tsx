import { useVolunteerTasks, useUploadProof, useUpdateTaskStatus, useOptOutTask } from "@/hooks/use-tasks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, CheckCircle2, Clock, Upload, Link as LinkIcon, CalendarDays, Play, Hourglass, MapPin, AlertCircle, Award, Star, Heart, Flame, Shield, Zap, Trophy, Target, Sparkles, ThumbsUp, Medal, ImageIcon, Video } from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { generateCertificate, calculateHours } from "@/lib/generate-certificate";
import { DayPicker, DayProps } from "react-day-picker";
import { format, eachDayOfInterval, isToday } from "date-fns";

// Color config for each task status group
const STATUS_COLORS: Record<string, { bg: string; dot: string; label: string; bgStyle: string; textStyle: string }> = {
  approved:    { bg: "bg-teal-100 text-teal-900",    dot: "bg-teal-500",    label: "Upcoming",    bgStyle: "bg-teal-200/80",     textStyle: "text-teal-900 font-semibold" },
  in_progress: { bg: "bg-amber-100 text-amber-900",  dot: "bg-amber-500",   label: "In Progress", bgStyle: "bg-amber-200/80",    textStyle: "text-amber-900 font-semibold" },
  completed:   { bg: "bg-emerald-100 text-emerald-900", dot: "bg-emerald-500", label: "Completed", bgStyle: "bg-emerald-200/80",  textStyle: "text-emerald-900 font-semibold" },
  no_show:     { bg: "bg-orange-100 text-orange-900", dot: "bg-orange-500",  label: "No Show",    bgStyle: "bg-orange-200/80",   textStyle: "text-orange-900 font-semibold" },
  pending:     { bg: "bg-blue-100 text-blue-900",    dot: "bg-blue-500",    label: "Pending",    bgStyle: "bg-blue-200/80",     textStyle: "text-blue-900 font-semibold" },
  in_consideration: { bg: "bg-yellow-100 text-yellow-900", dot: "bg-yellow-500", label: "Under Review", bgStyle: "bg-yellow-200/80", textStyle: "text-yellow-900 font-semibold" },
};

type DayInfo = { title: string; status: string; color: string };

export default function MyTasks() {
  const { user } = useAuth();
  const { data: tasks, isLoading } = useVolunteerTasks();

  // Build a map of date -> causes for the calendar
  const dayMap = useMemo(() => {
    const map = new Map<string, DayInfo[]>();

    if (!tasks) return map;

    for (const task of tasks as any[]) {
      if (!task.startDate || !task.endDate) continue;

      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

      const status = task.status || "pending";
      const days = eachDayOfInterval({ start, end });
      const color = STATUS_COLORS[status]?.dot || "bg-primary";

      for (const day of days) {
        const key = format(day, "yyyy-MM-dd");
        const existing = map.get(key) || [];
        existing.push({ title: task.cause?.title || "Untitled", status, color });
        map.set(key, existing);
      }
    }

    return map;
  }, [tasks]);

  // Group tasks for the list section
  const grouped = useMemo(() => {
    if (!tasks) return { upcoming: [], inProgress: [], completed: [], pending: [] };
    const allTasks = tasks as any[];
    return {
      upcoming: allTasks.filter((t) => t.status === "approved"),
      inProgress: allTasks.filter((t) => t.status === "in_progress"),
      completed: allTasks.filter((t) => t.status === "completed"),
      pending: allTasks.filter((t) => t.status === "pending" || t.status === "in_consideration" || t.status === "declined" || t.status === "no_show"),
    };
  }, [tasks]);

  // Custom Day renderer — applies colored background directly + tooltip on hover
  function CustomDay(props: DayProps) {
    const { date, displayMonth, ...rest } = props;
    const key = format(date, "yyyy-MM-dd");
    const infos = dayMap.get(key);

    // Pick the highest-priority status color for the cell background
    const primaryStatus = infos?.[0]?.status;
    const colorConfig = primaryStatus ? STATUS_COLORS[primaryStatus] : null;

    const dayContent = (
      <div
        className={cn(
          "relative flex items-center justify-center h-9 w-9 text-sm rounded-md transition-colors",
          infos && colorConfig && colorConfig.bgStyle,
          infos && colorConfig && colorConfig.textStyle,
          isToday(date) && "ring-2 ring-primary font-bold",
          !infos && !isToday(date) && "hover:bg-muted"
        )}
      >
        {date.getDate()}
        {infos && infos.length > 1 && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-secondary text-[9px] text-white flex items-center justify-center font-bold">
            {infos.length}
          </span>
        )}
      </div>
    );

    if (!infos || infos.length === 0) {
      return <div {...(rest as any)}>{dayContent}</div>;
    }

    return (
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <div {...(rest as any)} className={cn((rest as any).className, "cursor-pointer")}>
            {dayContent}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] p-3">
          <div className="space-y-2">
            <p className="font-semibold text-xs text-muted-foreground">{format(date, "EEEE, MMM d, yyyy")}</p>
            {infos.map((info, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", info.color)} />
                <div>
                  <span className="text-sm font-medium">{info.title}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">({STATUS_COLORS[info.status]?.label || info.status})</span>
                </div>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-secondary mb-2">My Tasks</h1>
          <p className="text-muted-foreground">Track your volunteering schedule and task progress.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">You haven't applied to any causes yet.</h3>
            <p className="text-sm text-muted-foreground mt-1">Browse causes and start making an impact!</p>
          </div>
        ) : (
          <>
            {/* ═══════ CALENDAR SECTION ═══════ */}
            <Card className="mb-8 overflow-hidden border-border/60 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-display">My Schedule</CardTitle>
                    <p className="text-sm text-muted-foreground">Highlighted dates show your volunteering commitments</p>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-4">
                  {Object.entries(STATUS_COLORS).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <span className={cn("h-3 w-3 rounded-full", val.dot)} />
                      <span className="text-muted-foreground">{val.label}</span>
                    </div>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="flex justify-center py-6">
                <TooltipProvider>
                  <DayPicker
                    numberOfMonths={2}
                    showOutsideDays
                    components={{ Day: CustomDay }}
                    className="p-0"
                    classNames={{
                      months: "flex flex-col sm:flex-row gap-6",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-semibold font-display",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-9 font-medium text-[0.75rem] uppercase",
                      row: "flex w-full mt-1",
                      cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                      day: "h-9 w-9 p-0 font-normal rounded-md hover:bg-muted transition-colors",
                      day_today: "ring-2 ring-primary/40 font-bold",
                      day_outside: "text-muted-foreground/40",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_hidden: "invisible",
                    }}
                  />
                </TooltipProvider>
              </CardContent>
            </Card>

            {/* ═══════ TASK LIST SECTIONS ═══════ */}
            <div className="space-y-8">
              <TaskSection
                title="In Progress"
                icon={<Play className="h-4 w-4" />}
                tasks={grouped.inProgress}
                color="text-amber-600"
                emptyText="No tasks in progress right now."
                volunteerName={user?.name || "Volunteer"}
              />
              <TaskSection
                title="Upcoming"
                icon={<CalendarDays className="h-4 w-4" />}
                tasks={grouped.upcoming}
                color="text-teal-600"
                emptyText="No upcoming tasks."
                volunteerName={user?.name || "Volunteer"}
              />
              <TaskSection
                title="Pending Review"
                icon={<Hourglass className="h-4 w-4" />}
                tasks={grouped.pending}
                color="text-blue-600"
                emptyText="No pending applications."
                volunteerName={user?.name || "Volunteer"}
              />
              <TaskSection
                title="Completed"
                icon={<CheckCircle2 className="h-4 w-4" />}
                tasks={grouped.completed}
                color="text-emerald-600"
                emptyText="No completed tasks yet."
                volunteerName={user?.name || "Volunteer"}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TaskSection({ title, icon, tasks, color, emptyText, volunteerName }: {
  title: string;
  icon: React.ReactNode;
  tasks: any[];
  color: string;
  emptyText: string;
  volunteerName: string;
}) {
  if (tasks.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("flex items-center gap-2", color)}>
          {icon}
          <h2 className="text-xl font-display font-bold">{title}</h2>
        </div>
        <Badge variant="secondary" className="rounded-full text-xs px-2.5">
          {tasks.length}
        </Badge>
      </div>
      <div className="grid gap-4">
        {tasks.map((task: any) => (
          <TaskItem key={task.id || Math.random()} task={task} volunteerName={volunteerName} />
        ))}
      </div>
    </div>
  );
}

function TaskItem({ task, volunteerName }: { task: any; volunteerName: string }) {
  const uploadProof = useUploadProof();
  const updateStatus = useUpdateTaskStatus();
  const optOut = useOptOutTask();
  const { toast } = useToast();
  const [proofUrl, setProofUrl] = useState("");
  const [open, setOpen] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isVideoPreview, setIsVideoPreview] = useState(false);

  const resetDialog = () => {
    setProofUrl("");
    setFilePreview(null);
    setFileUploading(false);
    setIsVideoPreview(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(file));
      setIsVideoPreview(false);
    } else if (file.type.startsWith("video/")) {
      setFilePreview(URL.createObjectURL(file));
      setIsVideoPreview(true);
    }

    setFileUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setProofUrl(url);
    } catch {
      toast({ title: "Upload failed", description: "Please try again or paste a link instead.", variant: "destructive" });
      setFilePreview(null);
    } finally {
      setFileUploading(false);
    }
  };

  const handleSubmitProof = () => {
    uploadProof.mutate({ taskId: task.id, proofUrl }, {
      onSuccess: () => {
        setOpen(false);
        resetDialog();
      }
    });
  };

  const handleStartTask = () => {
    updateStatus.mutate({ taskId: task.id, status: "in_progress" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border-0">Approved</Badge>;
      case "declined": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">Declined</Badge>;
      case "in_consideration": return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0">Under Review</Badge>;
      case "in_progress": return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">In Progress</Badge>;
      case "completed": return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Completed</Badge>;
      case "no_show": return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0">No Show</Badge>;
      default: return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">Pending</Badge>;
    }
  };

  const startDate = task.startDate ? new Date(task.startDate) : null;
  const endDate = task.endDate ? new Date(task.endDate) : null;

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col md:flex-row">
        {/* Status strip */}
        <div className={cn(
          "w-full md:w-1.5 h-1.5 md:h-auto shrink-0",
          task.status === "approved" && "bg-teal-500",
          task.status === "in_progress" && "bg-amber-500",
          task.status === "completed" && "bg-emerald-500",
          task.status === "declined" && "bg-red-400",
          task.status === "no_show" && "bg-orange-500",
          (task.status === "pending" || task.status === "in_consideration") && "bg-blue-400",
        )} />

        <div className="flex-1 p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-secondary leading-tight">{task.cause?.title || "Untitled Cause"}</h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {task.cause?.location}
                </span>
                <span>|</span>
                <span>{task.cause?.category}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {getStatusBadge(task.status)}
              {task.approved && (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </Badge>
              )}
              {(task.cause?.urgency ?? 0) > 7 && (
                <Badge variant="outline" className="text-red-600 border-red-200 gap-1">
                  <AlertCircle className="h-3 w-3" /> Urgent
                </Badge>
              )}
            </div>
          </div>

          {/* Date range */}
          {startDate && endDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 bg-muted/30 rounded-lg px-3 py-2 w-fit">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="font-medium">{format(startDate, "MMM d, yyyy")}</span>
              <span>→</span>
              <span className="font-medium">{format(endDate, "MMM d, yyyy")}</span>
            </div>
          )}

          {/* Badges earned — shown when task is approved */}
          {task.status === "completed" && task.approved && (
            <div className="mb-4 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-900">Badges Earned</span>
                <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs ml-auto">10 badges</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Star,      label: "Star Volunteer",   color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
                  { icon: Heart,     label: "Compassionate",    color: "bg-pink-100 text-pink-700 border-pink-200" },
                  { icon: Flame,     label: "On Fire",          color: "bg-orange-100 text-orange-700 border-orange-200" },
                  { icon: Shield,    label: "Reliable",         color: "bg-blue-100 text-blue-700 border-blue-200" },
                  { icon: Zap,       label: "Quick Starter",    color: "bg-amber-100 text-amber-700 border-amber-200" },
                  { icon: Target,    label: "Goal Achiever",    color: "bg-green-100 text-green-700 border-green-200" },
                  { icon: Sparkles,  label: "Impact Maker",     color: "bg-purple-100 text-purple-700 border-purple-200" },
                  { icon: ThumbsUp,  label: "Team Player",      color: "bg-teal-100 text-teal-700 border-teal-200" },
                  { icon: Medal,     label: "Dedicated",        color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
                  { icon: Award,     label: "Certified",        color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
                ].map(({ icon: Icon, label, color }) => (
                  <TooltipProvider key={label}>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium cursor-default", color)}>
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent><p>Earned for completing {task.cause?.title}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}

          {/* Waiting for NGO approval notice */}
          {task.status === "completed" && !task.approved && task.proofUrl && (
            <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center gap-2 text-sm text-amber-800">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Proof submitted — waiting for NGO to review and approve your work.</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
            {(task.status === "pending" || task.status === "in_consideration" || task.status === "approved") && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => optOut.mutate(task.id)}
                disabled={optOut.isPending}
              >
                Opt Out
              </Button>
            )}

            {task.status === "approved" && (
              <Button size="sm" onClick={handleStartTask} disabled={updateStatus.isPending} className="gap-1.5">
                <Play className="h-3.5 w-3.5" />
                Start Task
              </Button>
            )}

            {task.status === "in_progress" && (
              <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog(); }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary text-white gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    Submit Proof
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Submit Proof of Work</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground">
                      Upload a photo or video of your work, or paste an external link so the NGO can verify your contribution.
                    </p>

                    {/* File upload drop zone */}
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
                        className="sr-only"
                        onChange={handleFileUpload}
                        disabled={fileUploading || uploadProof.isPending}
                      />
                      <div className={cn(
                        "rounded-lg border-2 border-dashed transition-colors p-4 text-center",
                        filePreview ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
                      )}>
                        {filePreview ? (
                          <div className="space-y-2">
                            {isVideoPreview ? (
                              <video src={filePreview} className="max-h-36 mx-auto rounded-md object-cover" controls />
                            ) : (
                              <img src={filePreview} alt="Preview" className="max-h-36 mx-auto rounded-md object-cover" />
                            )}
                            <p className="text-xs text-muted-foreground">Click to change file</p>
                          </div>
                        ) : fileUploading ? (
                          <div className="flex flex-col items-center gap-2 py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 py-4">
                            <div className="flex items-center gap-3">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              <Video className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium">Click to upload a file</p>
                            <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP, MP4, WebM · max 10 MB</p>
                          </div>
                        )}
                      </div>
                    </label>

                    {/* OR divider */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground font-medium uppercase">or</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* URL input */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium flex items-center gap-1.5">
                        <LinkIcon className="h-3.5 w-3.5" />
                        Paste a link
                      </label>
                      <Input
                        placeholder="https://drive.google.com/..."
                        value={proofUrl}
                        onChange={(e) => { setProofUrl(e.target.value); setFilePreview(null); }}
                        disabled={fileUploading || uploadProof.isPending}
                      />
                    </div>

                    <Button
                      onClick={handleSubmitProof}
                      className="w-full"
                      disabled={!proofUrl || uploadProof.isPending || fileUploading}
                    >
                      {uploadProof.isPending
                        ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</>
                        : "Submit for Approval"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {task.status === "completed" && task.proofUrl && !task.approved && (
              <Button variant="outline" size="sm" asChild>
                <a href={task.proofUrl} target="_blank" rel="noreferrer" className="gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5" />
                  View Submission
                </a>
              </Button>
            )}

            {task.status === "completed" && task.approved && startDate && endDate && (
              <Button
                size="sm"
                className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-5"
                onClick={() => {
                  generateCertificate({
                    volunteerName: volunteerName,
                    causeTitle: task.cause?.title || "Untitled",
                    ngoName: task.ngoName || "NGO",
                    startDate: format(startDate, "MMM d, yyyy"),
                    endDate: format(endDate, "MMM d, yyyy"),
                    hours: calculateHours(startDate, endDate),
                    approved: true,
                  });
                }}
              >
                <Award className="h-4 w-4" />
                Download Certificate
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
