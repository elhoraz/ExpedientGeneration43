"use client";

import dynamic from "next/dynamic";
import { PhotoboothSkeleton } from "@/components/ui/Skeleton";

const PhotoboothClient = dynamic(() => import("./PhotoboothClient"), {
  ssr: false,
  loading: () => <PhotoboothSkeleton />,
});

export default function PhotoboothDynamic() {
  return <PhotoboothClient />;
}
