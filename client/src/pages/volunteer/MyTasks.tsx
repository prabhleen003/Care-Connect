import { useMyTasks, useUploadProof, useUpdateTaskStatus } from "@/hooks/use-tasks";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, Clock, Upload, Link as LinkIcon } from "lucide-react";
import { useState } from "react";

export default function MyTasks() {
  const { data: tasks, isLoading } = useMyTasks();

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <h1 className="text-3xl font-display font-bold text-secondary mb-2">My Applications</h1>
        <p className="text-muted-foreground mb-8">Track your impact and task progress.</p>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tasks?.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
            <h3 className="text-lg font-medium">You haven't applied to any causes yet.</h3>
          </div>
        ) : (
          <div className="grid gap-6">
            {tasks?.map((task) => (
              <TaskItem key={task.id} task={task} />
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

  return (
    <Card className="flex flex-col md:flex-row overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-all">
      <div className="w-full md:w-48 bg-muted/30 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r">
        {task.status === "completed" ? (
          <div className="text-center text-green-600">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2" />
            <span className="font-bold text-sm">Completed</span>
            {task.approved && <div className="text-xs mt-1 bg-green-100 text-green-800 px-2 py-1 rounded-full">Verified</div>}
          </div>
        ) : (
          <div className="text-center text-primary">
            <Clock className="h-10 w-10 mx-auto mb-2" />
            <span className="font-bold text-sm capitalize">{task.status.replace("_", " ")}</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-secondary mb-1">{task.cause.title}</h3>
            <p className="text-sm text-muted-foreground">{task.cause.location} • {task.cause.category}</p>
          </div>
          <Badge variant="outline">{task.cause.urgency > 7 ? "High Priority" : "Standard"}</Badge>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t">
          {task.status === "pending" && (
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
