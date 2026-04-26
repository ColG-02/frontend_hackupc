"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const ContainerLocationPickerClient = dynamic(
  () => import("./container-location-picker-client"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[280px] w-full rounded-lg" />,
  }
);

interface Props {
  lat: number;
  lng: number;
  onChange: (point: { lat: number; lng: number }) => void;
  height?: string;
}

export function ContainerLocationPicker(props: Props) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <ContainerLocationPickerClient {...props} />
    </div>
  );
}
