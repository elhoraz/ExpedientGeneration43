"use client";

import dynamic from "next/dynamic";

const MajlisClient = dynamic(() => import("./MajlisClient"), {
  ssr: false,
});

export default function MajlisLoader(props: { currentUser: any; initialTopics: any[] }) {
  return <MajlisClient {...props} />;
}
