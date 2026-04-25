"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckSquare, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { usePolling } from "@/hooks/use-polling";
import { getCrews, getRoutePlan, updateRouteStop } from "@/lib/api/client";

const CREW_ID = "crew-alpha";

const CHECKLIST = [
  { id: "emptied", label: "Container emptied" },
  { id: "cleaned", label: "Surrounding area cleaned" },
  { id: "damage", label: "No physical damage found" },
  { id: "flame", label: "No flame / fire hazard detected" },
  { id: "sensor", label: "Sensor opening clear and unobstructed" },
];

export default function StopDetailPage() {
  const params = useParams<{ stopId: string }>();
  const router = useRouter();
  const stopId = params.stopId;

  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCrews = useCallback(() => getCrews(), []);
  const { data: crews } = usePolling(fetchCrews, 60_000);
  const crew = crews?.find((c) => c.crew_id === CREW_ID) ?? crews?.[0];

  const fetchRoute = useCallback(
    () =>
      crew?.assigned_route_plan_id
        ? getRoutePlan(crew.assigned_route_plan_id)
        : Promise.resolve(null),
    [crew?.assigned_route_plan_id]
  );
  const { data: routePlan, refresh } = usePolling(
    fetchRoute,
    30_000,
    !!crew?.assigned_route_plan_id
  );

  const stop = routePlan?.routes
    .flatMap((r) => r.stops)
    .find((s) => s.stop_id === stopId);

  const allChecked = CHECKLIST.every((c) => checks[c.id]);

  const handleComplete = async () => {
    if (!routePlan || !stop) return;
    setSubmitting(true);
    try {
      await updateRouteStop(routePlan.route_plan_id, stopId, {
        status: "COMPLETED",
        notes,
      });
      toast.success("Stop completed!");
      refresh();
      router.push("/crew/stops");
    } catch {
      toast.error("Failed to update stop");
    } finally {
      setSubmitting(false);
    }
  };

  const handleArrive = async () => {
    if (!routePlan || !stop) return;
    await updateRouteStop(routePlan.route_plan_id, stopId, { status: "ARRIVED" });
    toast.success("Marked as arrived");
    refresh();
  };

  const handleSkip = async () => {
    if (!routePlan || !stop) return;
    await updateRouteStop(routePlan.route_plan_id, stopId, {
      status: "SKIPPED",
      notes: "Skipped by crew",
    });
    toast.info("Stop skipped");
    refresh();
    router.push("/crew/stops");
  };

  if (!stop) {
    return (
      <div className="p-4 py-20 text-center">
        <p className="text-muted-foreground">Stop not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-6">
      {/* Back */}
      <div className="flex items-center gap-2 pt-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">
            Stop {stop.order} — {stop.container_name ?? stop.container_id}
          </h1>
          <p className="text-xs text-muted-foreground">{stop.status}</p>
        </div>
      </div>

      {/* Container info */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm">{stop.address}</p>
          </div>
          {stop.fill_pct !== undefined && (
            <p className="text-sm">
              Fill: <strong>{stop.fill_pct}%</strong>
              {stop.fill_state && ` — ${stop.fill_state}`}
            </p>
          )}
          {stop.camera_state && (
            <p className="text-sm">
              Camera: <strong>{stop.camera_state}</strong>
            </p>
          )}
          <div className="flex flex-wrap gap-1">
            {stop.reason.map((r) => (
              <span key={r} className="text-[10px] bg-muted rounded px-1.5 py-0.5 font-medium">
                {r}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation button */}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() =>
          window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${stop.location.lat},${stop.location.lng}`,
            "_blank"
          )
        }
      >
        <Navigation className="h-4 w-4" />
        Open in Maps
      </Button>

      {/* Arrive */}
      {stop.status === "PENDING" && (
        <Button className="w-full" variant="secondary" onClick={handleArrive}>
          Mark Arrived
        </Button>
      )}

      {/* Service checklist */}
      {(stop.status === "ARRIVED" || stop.status === "IN_PROGRESS") && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Service Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {CHECKLIST.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <Checkbox
                    id={item.id}
                    checked={checks[item.id] ?? false}
                    onCheckedChange={(c) =>
                      setChecks((prev) => ({ ...prev, [item.id]: Boolean(c) }))
                    }
                  />
                  <Label htmlFor={item.id} className="text-sm font-normal">
                    {item.label}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Notes (optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Any issues or observations…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          <Separator />

          <div className="flex gap-3">
            <Button
              className="flex-1"
              disabled={!allChecked || submitting}
              onClick={handleComplete}
            >
              {submitting ? "Saving…" : "Complete Stop"}
            </Button>
            <Button variant="outline" onClick={handleSkip} disabled={submitting}>
              Skip
            </Button>
          </div>
          {!allChecked && (
            <p className="text-xs text-muted-foreground text-center">
              Complete all checklist items to finish this stop
            </p>
          )}
        </>
      )}

      {stop.status === "COMPLETED" && (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-green-600 font-semibold">✓ Stop Completed</p>
            {stop.notes && <p className="text-xs text-muted-foreground mt-1">{stop.notes}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
