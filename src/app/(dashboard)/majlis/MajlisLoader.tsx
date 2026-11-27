"use client";

import dynamic from "next/dynamic";
import { MajlisSkeleton } from "@/components/ui/skeletons/SkeletonMedia";

const MajlisClient = dynamic(() => import("./MajlisClient"), {
  ssr: false,
  loading: () => <MajlisSkeleton />,
});

export default function MajlisLoader(props: { currentUser: any; initialTopics: any[] }) {
  return <MajlisClient {...props} />;
}
