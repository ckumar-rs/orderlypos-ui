"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  hasBarcodeDetector,
  openCameraStream,
  scanBarcodeFromVideo,
} from "@/lib/camera-barcode";

export function BarcodeScannerDialog({
  open,
  onOpenChange,
  onDetected,
  onTimeout,
  onUnavailable,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (code: string) => void;
  onTimeout: () => void;
  onUnavailable: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onDetectedRef = useRef(onDetected);
  const onTimeoutRef = useRef(onTimeout);
  const onUnavailableRef = useRef(onUnavailable);
  const onOpenChangeRef = useRef(onOpenChange);
  onDetectedRef.current = onDetected;
  onTimeoutRef.current = onTimeout;
  onUnavailableRef.current = onUnavailable;
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const started = Date.now();

    const stop = () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      const video = videoRef.current;
      if (video) video.srcObject = null;
    };

    const run = async () => {
      if (!hasBarcodeDetector()) {
        onOpenChangeRef.current(false);
        onUnavailableRef.current();
        return;
      }
      try {
        const stream = await openCameraStream();
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();
        const tick = async () => {
          if (cancelled) return;
          const code = await scanBarcodeFromVideo(video);
          if (code) {
            stop();
            onOpenChangeRef.current(false);
            onDetectedRef.current(code);
            return;
          }
          if (Date.now() - started > 20_000) {
            stop();
            onOpenChangeRef.current(false);
            onTimeoutRef.current();
            return;
          }
          requestAnimationFrame(() => void tick());
        };
        void tick();
      } catch {
        if (!cancelled) {
          onOpenChangeRef.current(false);
          onUnavailableRef.current();
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
      stop();
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan barcode</DialogTitle>
          <DialogDescription>
            Point the camera at the dish barcode. The till adds the match when it reads a code.
          </DialogDescription>
        </DialogHeader>
        <video
          ref={videoRef}
          className="aspect-[4/3] w-full rounded-lg bg-black object-cover"
          muted
          playsInline
          autoPlay
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
