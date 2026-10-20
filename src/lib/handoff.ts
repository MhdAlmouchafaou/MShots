import type { CaptureInput } from './smart';

/**
 * Hand-off between the editor and the capture screens: when the editor asks for a new screen
 * image, it registers a target; capture screens (web / app / captures library) call
 * deliverCapture() and go back instead of creating a new project.
 */
type Target = (c: CaptureInput & { label?: string }) => void;
let target: Target | null = null;

export const setCaptureTarget = (t: Target | null) => (target = t);
export const hasCaptureTarget = () => !!target;

/** Returns true when an editor was waiting for this capture (the caller should router.back()). */
export function deliverCapture(c: CaptureInput & { label?: string }): boolean {
  const t = target;
  target = null;
  if (!t) return false;
  t(c);
  return true;
}
