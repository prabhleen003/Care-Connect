import { useAuth } from "@/hooks/use-auth";
import { useNgoCauses } from "@/hooks/use-causes";
import { useNgoTasks } from "@/hooks/use-tasks";
import { Navbar } from "@/components/Navbar";
import { CreateCauseDialog } from "@/components/CreateCauseDialog";
import { CauseCard } from "@/components/CauseCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApproveTask, useUpdateTaskStatus } from "@/hooks/use-tasks";
import { Loader2, CheckCircle2, LayoutDashboard, ListTodo, Clock, XCircle } from "lucide-react";
import { Link } from "wouter";

export default function NgoDashboard() {
  const { user } = useAuth();
  const { data: causes, isLoading: causesLoading } = useNgoCauses();
  const { data: tasks, isLoading: tasksLoading } = useNgoTasks();
  const approveTask = useApproveTask();
  const updateStatus = useUpdateTaskStatus();

  if (causesLoading || tasksLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingApprovals = tasks?.filter(t => t.status === "completed" && !t.approved) || [];
  const inProgressTasks = tasks?.filter(t => t.status === "in_progress") || [];

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-secondary">NGO Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your causes and volunteer applications</p>
          </div>
          <CreateCauseDialog />
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary to-accent text-white border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-white/90">Total Causes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-display">{causes?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-muted-foreground">Active Volunteers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-display text-secondary">{inProgressTasks.length}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-muted-foreground">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-display text-primary">{pendingApprovals.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="approvals" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Pending Approvals
              {pendingApprovals.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                  {pendingApprovals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="causes" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              My Causes
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <ListTodo className="h-4 w-4" />
              All Applications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="space-y-4">
            <h2 className="text-xl font-bold text-secondary mb-4">Work Pending Approval</h2>
            {pendingApprovals.length === 0 ? (
              <EmptyState title="All caught up!" description="No pending approvals at the moment." />
            ) : (
              <div className="grid gap-4">
                {pendingApprovals.map((task) => (
                  <Card key={task.id} className="flex items-center p-4 gap-4 hover:bg-muted/30 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{task.cause?.title}</Badge>
                        <span className="text-sm text-muted-foreground">• Completed by {task.volunteer?.name}</span>
                      </div>
                      <div className="text-sm font-medium">Proof of work:</div>
                      <a href={task.proofUrl || '#'} target="_blank" rel="noreferrer" className="text-sm text-primary underline truncate block max-w-md">
                        {task.proofUrl || 'No URL provided'}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => approveTask.mutate(task.id)}
                        disabled={approveTask.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {approveTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve Work"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="causes">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {causes?.map((cause) => (
                <CauseCard key={cause.id} cause={cause} />
              ))}
              {causes?.length === 0 && (
                <div className="col-span-full">
                  <EmptyState title="No causes yet" description="Create your first cause to start recruiting volunteers." />
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="applications">
             <div className="rounded-md border">
               <div className="p-4 bg-muted/30 font-medium grid grid-cols-4 text-sm text-muted-foreground">
                 <div>Volunteer</div>
                 <div>Cause</div>
                 <div>Status</div>
                 <div>Date</div>
               </div>
               {tasks?.length === 0 ? (
                 <div className="p-8 text-center text-muted-foreground">No applications yet.</div>
               ) : (
                 tasks?.map(task => (
                   <div key={task.id} className="p-4 border-t grid grid-cols-4 items-center text-sm">
                     <div className="font-medium text-secondary">{task.volunteer?.name}</div>
                     <div className="truncate pr-4">{task.cause?.title}</div>
                     <div className="flex items-center gap-2">
                       <Badge variant={
                         task.status === 'completed' && task.approved ? 'default' : 
                         task.status === 'completed' ? 'secondary' : 
                         task.status === 'in_progress' ? 'outline' : 
                         task.status === 'declined' ? 'destructive' : 'secondary'
                       } className={task.status === 'completed' && task.approved ? 'bg-green-500' : ''}>
                         {task.approved ? 'Approved' : task.status.replace('_', ' ')}
                       </Badge>
                       {task.status === 'pending' && (
                         <div className="flex gap-1">
                           <Button 
                             size="sm" 
                             variant="ghost" 
                             className="h-7 w-7 p-0 text-yellow-600"
                             onClick={() => updateStatus.mutate({ taskId: task.id, status: 'in_consideration' })}
                             title="In Consideration"
                           >
                             <Clock className="h-4 w-4" />
                           </Button>
                           <Button 
                             size="sm" 
                             variant="ghost" 
                             className="h-7 w-7 p-0 text-green-600"
                             onClick={() => updateStatus.mutate({ taskId: task.id, status: 'approved' })}
                             title="Approve"
                           >
                             <CheckCircle2 className="h-4 w-4" />
                           </Button>
                           <Button 
                             size="sm" 
                             variant="ghost" 
                             className="h-7 w-7 p-0 text-red-600"
                             onClick={() => updateStatus.mutate({ taskId: task.id, status: 'declined' })}
                             title="Decline"
                           >
                             <XCircle className="h-4 w-4" />
                           </Button>
                         </div>
                       )}
                       {task.status === 'in_consideration' && (
                         <div className="flex gap-1">
                           <Button 
                             size="sm" 
                             variant="ghost" 
                             className="h-7 w-7 p-0 text-green-600"
                             onClick={() => updateStatus.mutate({ taskId: task.id, status: 'approved' })}
                             title="Approve"
                           >
                             <CheckCircle2 className="h-4 w-4" />
                           </Button>
                           <Button 
                             size="sm" 
                             variant="ghost" 
                             className="h-7 w-7 p-0 text-red-600"
                             onClick={() => updateStatus.mutate({ taskId: task.id, status: 'declined' })}
                             title="Decline"
                           >
                             <XCircle className="h-4 w-4" />
                           </Button>
                         </div>
                       )}
                     </div>
                     <div className="text-muted-foreground">
                       {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : '-'}
                     </div>
                   </div>
                 ))
               )}
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string, description: string }) {
  return (
    <div className="text-center py-12 px-4 rounded-xl border border-dashed bg-muted/10">
      <div className="bg-muted/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
        <LayoutDashboard className="text-muted-foreground h-6 w-6" />
      </div>
      <h3 className="text-lg font-medium text-secondary">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
