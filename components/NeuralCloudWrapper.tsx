"use client";

import dynamic from "next/dynamic";

const NeuralCloud = dynamic(
  () => import("@/components/NeuralCloud").then((m) => m.NeuralCloud),
  { ssr: false, loading: () => <div className="h-full w-full bg-black" /> },
);

export function NeuralCloudWrapper() {
  return <NeuralCloud />;
}
