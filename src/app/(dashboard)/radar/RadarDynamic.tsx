"use client";

import dynamic from "next/dynamic";
import { RadarSkeleton } from "@/components/ui/skeletons/SkeletonMedia";

const RadarClient = dynamic(() => import("./RadarClient"), {
  ssr: false,
  loading: () => <RadarSkeleton />,
});

export default function RadarDynamic({ nodes }: { nodes: any[] }) {
  return <RadarClient nodes={nodes} />;
}
