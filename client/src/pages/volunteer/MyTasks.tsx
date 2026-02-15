import { useVolunteerTasks, useUploadProof, useUpdateTaskStatus, useOptOutTask } from "@/hooks/use-tasks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, Clock, Upload, Link as LinkIcon } from "lucide-react";
import { useState } from "react";

export default function MyTasks() {
  const { data: tasks, isLoading } = useVolunteerTasks();

  return (
    <div className="min-h-screen bg-background pb-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <h1 className="text-3xl font-display font-bold text-secondary mb-2">My Applications</h1>
        <p className="text-muted-foreground mb-8">Track your impact and task progress.</p>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
            <h3 className="text-lg font-medium">You haven't applied to any causes yet.</h3>
          </div>
        ) : (
          <div className="grid gap-6">
            {tasks.map((task: any) => (
              <TaskItem key={task.id || Math.random()} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskItem({ task }: { task: any }) {
  const uploadProof = useUploadProof();
  const updateStatus = useUpdateTaskStatus();
  const optOut = useOptOutTask();
  const [proofUrl, setProofUrl] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmitProof = () => {
    uploadProof.mutate({ taskId: task.id, proofUrl }, {
      onSuccess: () => {
        updateStatus.mutate({ taskId: task.id, status: "completed" });
        setOpen(false);
      }
    });
  };

  const handleStartTask = () => {
    updateStatus.mutate({ taskId: task.id, status: "in_progress" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-green-600";
      case "declined": return "text-red-600";
      case "in_consideration": return "text-yellow-600";
      case "completed": return "text-green-600";
      default: return "text-primary";
    }
  };

  return (
    <Card className="flex flex-col md:flex-row overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-all">
      <div className="w-full md:w-48 bg-muted/30 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r">
        <div className={cn("text-center", getStatusColor(task.status))}>
          {task.status === "completed" ? (
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2" />
          ) : (
            <Clock className="h-10 w-10 mx-auto mb-2" />
          )}
          <span className="font-bold text-sm capitalize">{task.status.replace("_", " ")}</span>
          {task.approved && <div className="text-xs mt-1 bg-green-100 text-green-800 px-2 py-1 rounded-full">Verified</div>}
        </div>
      </div>
      
      <div className="flex-1 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-secondary mb-1">{task.cause?.title || "Untitled Cause"}</h3>
            <p className="text-sm text-muted-foreground">{task.cause.location} • {task.cause.category}</p>
          </div>
          <Badge variant="outline">{task.cause.urgency > 7 ? "High Priority" : "Standard"}</Badge>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t">
          {(task.status === "pending" || task.status === "in_consideration" || task.status === "approved") && (
            <Button 
              variant="ghost" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => optOut.mutate(task.id)}
              disabled={optOut.isPending}
            >
              Opt Out
            </Button>
          )}

          {task.status === "approved" && (
             <Button onClick={handleStartTask} disabled={updateStatus.isPending}>
               Start Task
             </Button>
          )}

          {task.status === "in_progress" && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white">
                  <Upload className="mr-2 h-4 w-4" />
                  Submit Proof
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Proof of Work</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Please provide a link to your work (Google Drive, photo URL, etc.) so the NGO can verify your contribution.
                  </p>
                  <Input 
                    placeholder="https://..." 
                    value={proofUrl} 
                    onChange={(e) => setProofUrl(e.target.value)} 
                  />
                  <Button 
                    onClick={handleSubmitProof} 
                    className="w-full"
                    disabled={!proofUrl || uploadProof.isPending}
                  >
                    {uploadProof.isPending ? "Submitting..." : "Submit for Approval"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {task.status === "completed" && task.proofUrl && (
             <Button variant="outline" asChild>
               <a href={task.proofUrl} target="_blank" rel="noreferrer">
                 <LinkIcon className="mr-2 h-4 w-4" />
                 View Submission
               </a>
             </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
