"use client";

import { ExpoBoard } from "@/components/kds/expo-board";
import { KdsNav } from "@/components/kds/kds-nav";
import { useBranch } from "@/hooks/use-branch";

export default function ExpoPage() {
  const { branchId } = useBranch();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Expo</h1>
        <p className="text-sm text-muted-foreground">
          Fire a held course, assemble the order when every station is ready, then pass it to the floor.
        </p>
      </div>
      <KdsNav />
      <ExpoBoard branchId={branchId} />
    </div>
  );
}
