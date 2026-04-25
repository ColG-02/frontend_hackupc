"use client";

import { useCallback, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Plus, RefreshCw } from "lucide-react";
import { MaintenanceTicket } from "@/types";
import {
  MaintenancePriorityBadge,
  MaintenanceStatusBadge,
} from "@/components/maintenance/maintenance-priority-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { usePolling } from "@/hooks/use-polling";
import {
  createMaintenanceTicket,
  getMaintenanceTickets,
  updateMaintenanceTicket,
} from "@/lib/api/client";

export default function MaintenancePage() {
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    container_id: "",
    type: "SENSOR_FAULT",
    priority: "MEDIUM",
    description: "",
  });

  const fetcher = useCallback(
    () =>
      getMaintenanceTickets({
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
    [priorityFilter, statusFilter]
  );

  const { data: tickets, isLoading, refresh } = usePolling(fetcher, 30_000);

  const handleCreate = async () => {
    await createMaintenanceTicket(newForm as Partial<MaintenanceTicket>);
    toast.success("Ticket created");
    setCreateOpen(false);
    setNewForm({ container_id: "", type: "SENSOR_FAULT", priority: "MEDIUM", description: "" });
    refresh();
  };

  const handleStatusUpdate = async (ticket: MaintenanceTicket, status: string) => {
    await updateMaintenanceTicket(ticket.ticket_id, { status: status as MaintenanceTicket["status"] });
    toast.success("Ticket updated");
    refresh();
    setSelectedTicket(null);
  };

  const sorted = [...(tickets ?? [])].sort((a, b) => {
    const pri = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (pri[a.priority] ?? 3) - (pri[b.priority] ?? 3);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Maintenance</h1>
          <p className="text-sm text-muted-foreground">{sorted.length} tickets</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Create Ticket</Button>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className="hidden" />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Maintenance Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Container ID</Label>
                <Input value={newForm.container_id} onChange={(e) => setNewForm(f => ({ ...f, container_id: e.target.value }))} placeholder="cont-001" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={newForm.type} onValueChange={(v) => v && setNewForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["SENSOR_FAULT", "CAMERA_FAULT", "FLAME_SENSOR_FAULT", "LOW_POWER", "PHYSICAL_DAMAGE", "CALIBRATION_REQUIRED", "OTHER"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={newForm.priority} onValueChange={(v) => v && setNewForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={newForm.description} onChange={(e) => setNewForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v ?? "all")}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {["OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-8" onClick={refresh}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Container</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No tickets found.</TableCell></TableRow>
              ) : (
                sorted.map((ticket) => (
                  <TableRow key={ticket.ticket_id} className="cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                    <TableCell><MaintenancePriorityBadge priority={ticket.priority} /></TableCell>
                    <TableCell className="text-xs font-mono">{ticket.type}</TableCell>
                    <TableCell className="text-xs">{ticket.container_id}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{ticket.description}</TableCell>
                    <TableCell><MaintenanceStatusBadge status={ticket.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail sheet */}
      <Sheet open={!!selectedTicket} onOpenChange={(o) => !o && setSelectedTicket(null)}>
        <SheetContent>
          {selectedTicket && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <MaintenancePriorityBadge priority={selectedTicket.priority} />
                  {selectedTicket.type}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{selectedTicket.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Container</p><p>{selectedTicket.container_id}</p></div>
                  <div><p className="text-xs text-muted-foreground">Status</p><MaintenanceStatusBadge status={selectedTicket.status} /></div>
                  <div><p className="text-xs text-muted-foreground">Assigned to</p><p>{selectedTicket.assigned_to ?? "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Ticket ID</p><p className="font-mono text-xs">{selectedTicket.ticket_id}</p></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTicket.status === "OPEN" && (
                    <Button size="sm" onClick={() => handleStatusUpdate(selectedTicket, "IN_PROGRESS")}>Mark In Progress</Button>
                  )}
                  {(selectedTicket.status === "OPEN" || selectedTicket.status === "IN_PROGRESS") && (
                    <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(selectedTicket, "RESOLVED")}>Resolve</Button>
                  )}
                  {selectedTicket.status !== "CANCELLED" && selectedTicket.status !== "RESOLVED" && (
                    <Button size="sm" variant="ghost" onClick={() => handleStatusUpdate(selectedTicket, "CANCELLED")}>Cancel</Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
