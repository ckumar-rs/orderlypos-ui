type Detector = {
  detect: (source: ImageBitmapSource) => Promise<{ rawValue: string }[]>;
};

export function hasBarcodeDetector() {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

export async function scanBarcodeFromVideo(video: HTMLVideoElement): Promise<string | null> {
  const Ctor = (
    window as Window & {
      BarcodeDetector?: new (opts?: { formats?: string[] }) => Detector;
    }
  ).BarcodeDetector;
  if (!Ctor) return null;
  const detector = new Ctor();
  const codes = await detector.detect(video);
  return codes[0]?.rawValue?.trim() || null;
}

export async function openCameraStream() {
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } },
    audio: false,
  });
}
