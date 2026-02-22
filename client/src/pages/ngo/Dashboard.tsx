import { useAuth } from "@/hooks/use-auth";
import { useNgoCauses } from "@/hooks/use-causes";
import { useNgoTasks } from "@/hooks/use-tasks";
import { CreateCauseDialog } from "@/components/CreateCauseDialog";
import { CauseCard } from "@/components/CauseCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApproveTask, useUpdateTaskStatus } from "@/hooks/use-tasks";
import { Loader2, CheckCircle2, LayoutDashboard, ListTodo, Clock, XCircle, UserX, CalendarDays, Inbox, ExternalLink, Image as ImageIcon, Video } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

  const newApplications = tasks?.filter(t => t.status === "pending" || t.status === "in_consideration") || [];
  const pendingApprovals = tasks?.filter(t => t.status === "completed" && !t.approved) || [];
  const inProgressTasks = tasks?.filter(t => t.status === "in_progress") || [];

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-secondary">Welcome back, {user?.name.split(" ")[0]}!</h1>
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
              <CardTitle className="text-lg font-medium text-muted-foreground">New Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-display text-primary">{newApplications.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="applications" className="gap-2">
              <Inbox className="h-4 w-4" />
              New Applications
              {newApplications.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                  {newApplications.length}
                </Badge>
              )}
            </TabsTrigger>
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
            <TabsTrigger value="all" className="gap-2">
              <ListTodo className="h-4 w-4" />
              All Applications
            </TabsTrigger>
          </TabsList>

          {/* New Applications (pending + in_consideration) */}
          <TabsContent value="applications" className="space-y-4">
            <h2 className="text-xl font-bold text-secondary mb-4">New Volunteer Applications</h2>
            {newApplications.length === 0 ? (
              <EmptyState title="No new applications" description="When volunteers apply for your causes, they'll appear here." />
            ) : (
              <div className="grid gap-4">
                {newApplications.map((task) => (
                  <Card key={task.id} className="p-5 hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={task.volunteer?.avatarUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {task.volunteer?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-semibold text-secondary">{task.volunteer?.name}</div>
                          <div className="text-sm text-muted-foreground truncate">Applied for: <span className="font-medium text-foreground">{task.cause?.title}</span></div>
                          {(task.startDate || task.endDate) && (
                            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                              <CalendarDays className="h-3.5 w-3.5" />
                              <span>
                                {task.startDate ? new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                {' to '}
                                {task.endDate ? new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:ml-auto">
                        <Badge variant="secondary" className="capitalize">
                          {(task.status ?? 'pending').replace('_', ' ')}
                        </Badge>
                        {task.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-yellow-400 text-yellow-700 hover:bg-yellow-50 gap-1.5"
                              onClick={() => updateStatus.mutate({ taskId: task.id, status: 'in_consideration' })}
                              disabled={updateStatus.isPending}
                            >
                              <Clock className="h-4 w-4" />
                              Consider
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                              onClick={() => updateStatus.mutate({ taskId: task.id, status: 'approved' })}
                              disabled={updateStatus.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1.5"
                              onClick={() => updateStatus.mutate({ taskId: task.id, status: 'declined' })}
                              disabled={updateStatus.isPending}
                            >
                              <XCircle className="h-4 w-4" />
                              Decline
                            </Button>
                          </>
                        )}
                        {task.status === 'in_consideration' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                              onClick={() => updateStatus.mutate({ taskId: task.id, status: 'approved' })}
                              disabled={updateStatus.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1.5"
                              onClick={() => updateStatus.mutate({ taskId: task.id, status: 'declined' })}
                              disabled={updateStatus.isPending}
                            >
                              <XCircle className="h-4 w-4" />
                              Decline
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Work Pending Approval (completed but not yet approved) */}
          <TabsContent value="approvals" className="space-y-4">
            <h2 className="text-xl font-bold text-secondary mb-4">Work Pending Approval</h2>
            {pendingApprovals.length === 0 ? (
              <EmptyState title="All caught up!" description="No pending approvals at the moment." />
            ) : (
              <div className="grid gap-4">
                {pendingApprovals.map((task) => {
                  const isImage = task.proofUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(task.proofUrl);
                  const isVideo = task.proofUrl && /\.(mp4|webm)$/i.test(task.proofUrl);
                  return (
                    <Card key={task.id} className="overflow-hidden border-border/60">
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={task.volunteer?.avatarUrl || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {task.volunteer?.name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-secondary">{task.volunteer?.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              Completed: <span className="font-medium text-foreground">{task.cause?.title}</span>
                            </div>
                            {(task.startDate || task.endDate) && (
                              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                <CalendarDays className="h-3 w-3" />
                                {task.startDate ? new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                {' to '}
                                {task.endDate ? new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                              </div>
                            )}
                          </div>
                          <Badge className="bg-amber-100 text-amber-800 border-0">Awaiting Review</Badge>
                        </div>

                        {/* Proof display */}
                        {task.proofUrl && (
                          <div className="mb-4 rounded-lg border bg-muted/20 p-3">
                            <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                              {isVideo ? <Video className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                              Submitted Proof
                            </div>
                            {isImage ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <img
                                    src={task.proofUrl}
                                    alt="Proof of work"
                                    className="rounded-md max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  />
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle>Proof of Work — {task.volunteer?.name}</DialogTitle>
                                  </DialogHeader>
                                  <img src={task.proofUrl} alt="Proof of work" className="rounded-md w-full" />
                                </DialogContent>
                              </Dialog>
                            ) : isVideo ? (
                              <video
                                src={task.proofUrl}
                                controls
                                className="rounded-md max-h-48 w-full object-cover"
                              />
                            ) : (
                              <a href={task.proofUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1.5">
                                <ExternalLink className="h-3.5 w-3.5" />
                                {task.proofUrl}
                              </a>
                            )}
                          </div>
                        )}
                        {!task.proofUrl && (
                          <div className="mb-4 rounded-lg border border-dashed bg-muted/10 p-4 text-center text-sm text-muted-foreground">
                            No proof submitted
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-3">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1.5"
                            onClick={() => updateStatus.mutate({ taskId: task.id, status: 'declined' })}
                            disabled={updateStatus.isPending}
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white gap-1.5 px-5"
                            onClick={() => approveTask.mutate(task.id)}
                            disabled={approveTask.isPending}
                          >
                            {approveTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Approve Work</>}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
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

          {/* All Applications - full table view */}
          <TabsContent value="all">
             <div className="rounded-md border">
               <div className="p-4 bg-muted/30 font-medium grid grid-cols-5 text-sm text-muted-foreground">
                 <div>Volunteer</div>
                 <div>Cause</div>
                 <div>Dates</div>
                 <div>Status</div>
                 <div>Actions</div>
               </div>
               {tasks?.length === 0 ? (
                 <div className="p-8 text-center text-muted-foreground">No applications yet.</div>
               ) : (
                 tasks?.map(task => (
                   <div key={task.id} className="p-4 border-t grid grid-cols-5 items-center text-sm gap-2">
                     <div className="font-medium text-secondary">{task.volunteer?.name}</div>
                     <div className="truncate pr-2">{task.cause?.title}</div>
                     <div className="text-muted-foreground text-xs">
                       {task.startDate ? new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                       {' – '}
                       {task.endDate ? new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                     </div>
                     <div>
                       <Badge variant={
                         task.status === 'completed' && task.approved ? 'default' :
                         task.status === 'completed' ? 'secondary' :
                         task.status === 'in_progress' ? 'outline' :
                         task.status === 'declined' ? 'destructive' :
                         task.status === 'no_show' ? 'destructive' : 'secondary'
                       } className={
                         task.status === 'completed' && task.approved ? 'bg-green-500' :
                         task.status === 'no_show' ? 'bg-orange-500' : ''
                       }>
                         {task.approved ? 'Approved' : task.status === 'no_show' ? 'No Show' : (task.status ?? 'pending').replace('_', ' ')}
                       </Badge>
                     </div>
                     <div className="flex items-center gap-1.5 flex-wrap">
                       {task.status === 'pending' && (
                         <>
                           <Button
                             size="sm"
                             variant="outline"
                             className="h-8 px-2.5 border-yellow-400 text-yellow-700 hover:bg-yellow-50 gap-1 text-xs"
                             onClick={() => updateStatus.mutate({ taskId: task.id, status: 'in_consideration' })}
                           >
                             <Clock className="h-3.5 w-3.5" />
                             Consider
                           </Button>
                           <Button
                             size="sm"
                             className="h-8 px-2.5 bg-green-600 hover:bg-green-700 text-white gap-1 text-xs"
                             onClick={() => updateStatus.mutate({ taskId: task.id, status: 'approved' })}
                           >
                             <CheckCircle2 className="h-3.5 w-3.5" />
                             Accept
                           </Button>
                           <Button
                             size="sm"
                             variant="destructive"
                             className="h-8 px-2.5 gap-1 text-xs"
                             onClick={() => updateStatus.mutate({ taskId: task.id, status: 'declined' })}
                           >
                             <XCircle className="h-3.5 w-3.5" />
                             Decline
                           </Button>
                         </>
                       )}
                       {task.status === 'in_consideration' && (
                         <>
                           <Button
                             size="sm"
                             className="h-8 px-2.5 bg-green-600 hover:bg-green-700 text-white gap-1 text-xs"
                             onClick={() => updateStatus.mutate({ taskId: task.id, status: 'approved' })}
                           >
                             <CheckCircle2 className="h-3.5 w-3.5" />
                             Accept
                           </Button>
                           <Button
                             size="sm"
                             variant="destructive"
                             className="h-8 px-2.5 gap-1 text-xs"
                             onClick={() => updateStatus.mutate({ taskId: task.id, status: 'declined' })}
                           >
                             <XCircle className="h-3.5 w-3.5" />
                             Decline
                           </Button>
                         </>
                       )}
                       {(task.status === 'approved' || task.status === 'in_progress') && (
                         <Button
                           size="sm"
                           variant="outline"
                           className="h-8 px-2.5 border-orange-400 text-orange-600 hover:bg-orange-50 gap-1 text-xs"
                           onClick={() => updateStatus.mutate({ taskId: task.id, status: 'no_show' })}
                         >
                           <UserX className="h-3.5 w-3.5" />
                           No Show
                         </Button>
                       )}
                       {task.status === 'completed' && task.approved && (
                         <span className="text-xs text-green-600 font-medium">Done</span>
                       )}
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
