"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Eye, MoreHorizontal, Settings2, Wrench } from "lucide-react";
import { Container } from "@/types";
import { DeviceConfigDialog } from "@/components/devices/device-config-dialog";
import {
  CameraStateBadge,
  DeviceStatusBadge,
  FillStateBadge,
} from "./container-state-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatApiDistanceToNow } from "@/lib/dates";

const col = createColumnHelper<Container>();

interface Props {
  containers: Container[];
  onCreateTicket?: (container: Container) => void;
  onDeviceConfigSaved?: () => void | Promise<void>;
}

export function ContainersTable({ containers, onCreateTicket, onDeviceConfigSaved }: Props) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = [
    col.accessor("name", {
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => column.toggleSorting()}>
          Name <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: (info) => (
        <div>
          <p className="font-medium text-sm">{info.getValue()}</p>
          <p className="text-xs text-muted-foreground">{info.row.original.address ?? info.row.original.site_id}</p>
        </div>
      ),
    }),
    col.accessor("latest_state.fused_fill_pct", {
      header: "Fill",
      cell: (info) => {
        const pct = info.getValue() ?? 0;
        return (
          <div className="flex items-center gap-2 min-w-[80px]">
            <Progress value={pct} className="h-1.5 flex-1" />
            <span className="text-xs tabular-nums w-8 text-right">{pct.toFixed(0)}%</span>
          </div>
        );
      },
    }),
    col.accessor("latest_state.fill_state", {
      header: "State",
      cell: (info) => <FillStateBadge state={info.getValue()} />,
    }),
    col.accessor("latest_state.camera_state", {
      header: "Camera",
      cell: (info) => <CameraStateBadge state={info.getValue()} />,
    }),
    col.accessor("latest_state.flame_detected", {
      header: "Flame",
      cell: (info) =>
        info.getValue() ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600">
            Yes
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
    }),
    col.accessor("latest_state.device_status", {
      header: "Device",
      cell: (info) => <DeviceStatusBadge status={info.getValue()} />,
    }),
    col.accessor("latest_state.last_seen_at", {
      header: "Last Seen",
      cell: (info) => {
        const v = info.getValue();
        return v ? (
          <span className="text-xs text-muted-foreground">
            {formatApiDistanceToNow(v)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Never</span>
        );
      },
    }),
    col.display({
      id: "actions",
      cell: (info) => (
        <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
          {info.row.original.assigned_device_id && (
            <DeviceConfigDialog
              deviceId={info.row.original.assigned_device_id}
              onSaved={onDeviceConfigSaved}
              trigger={
                <Button variant="ghost" size="icon-sm" title="Configure device">
                  <Settings2 className="h-4 w-4" />
                </Button>
              }
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/containers/${info.row.original.container_id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateTicket?.(info.row.original)}>
                <Wrench className="mr-2 h-4 w-4" />
                Create ticket
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: containers,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id} className="py-2">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                No containers found.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => {
              const detailHref = `/dashboard/containers/${row.original.container_id}`;

              return (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => router.push(detailHref)}
                  onFocus={() => router.prefetch(detailHref)}
                  onMouseEnter={() => router.prefetch(detailHref)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
