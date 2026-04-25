"use client";

import dynamic from "next/dynamic";
import { Container, CleaningCrew } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

const CityMapClient = dynamic(() => import("./city-map-client"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full rounded-none" />,
});

interface Props {
  containers: Container[];
  crews?: CleaningCrew[];
  onContainerClick?: (container: Container) => void;
  height?: string;
}

export function OperationsMap({ containers, crews = [], onContainerClick, height = "400px" }: Props) {
  return (
    <div style={{ height, width: "100%", overflow: "hidden", position: "relative" }}>
      <CityMapClient
        containers={containers}
        crews={crews}
        onContainerClick={onContainerClick}
        height={height}
      />
    </div>
  );
}
