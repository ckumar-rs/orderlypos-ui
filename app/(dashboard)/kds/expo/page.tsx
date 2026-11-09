"use client";

import { ExpoBoard } from "@/components/kds/expo-board";
import { useBranch } from "@/hooks/use-branch";

export default function ExpoPage() {
  const { branchId } = useBranch();
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Fire a held course, assemble the order when every station is ready, then pass it to the floor.
      </p>
      <ExpoBoard branchId={branchId} />
    </div>
  );
}
