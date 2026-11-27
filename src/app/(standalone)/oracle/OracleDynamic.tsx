"use client";

import dynamic from "next/dynamic";
import { OracleSkeleton } from "@/components/ui/skeletons/SkeletonMedia";

const OracleClient = dynamic(() => import("./OracleClient"), {
  ssr: false,
  loading: () => <OracleSkeleton />,
});

export default function OracleDynamic({
  userId,
  initialVisions,
  userProfile,
}: {
  userId: string;
  initialVisions: any[];
  userProfile: any;
}) {
  return (
    <OracleClient
      userId={userId}
      initialVisions={initialVisions}
      userProfile={userProfile}
    />
  );
}
