import { requireOptionalNativeModule } from 'expo';

export type WebCaptureOptions = {
  url: string;
  /** CSS viewport width (e.g. 390 phone, 820 tablet, 1440 desktop). */
  width: number;
  /** CSS viewport height (visible area). */
  height: number;
  /** Device pixel ratio of the capture (1–3). */
  scale: number;
  /** Whole page (scrolls and stitches) or only the visible viewport. */
  fullPage: boolean;
  /** Wait after load before capturing (ms), for animations and lazy content. */
  delay: number;
  /** Max height of a full page capture in CSS px. */
  maxHeight: number;
  /** Ask the page for its dark theme (prefers-color-scheme). */
  dark: boolean;
  /** Mobile user agent (phones/tablets) or desktop one. */
  mobile: boolean;
};

export type Capture = {
  uri: string;
  width: number;
  height: number;
  date: number;
  /** Package of the app on screen when captured (when known). */
  app?: string | null;
  session?: string | null;
};

type Sub = { remove(): void };

type MShotsCore = {
  captureWeb(o: WebCaptureOptions): Promise<{ uri: string; width: number; height: number; title: string | null }>;
  /** Floating capture bubble over other apps (MediaProjection). */
  canDrawOverlays(): boolean;
  openOverlaySettings(): boolean;
  startBubble(session: string): Promise<boolean>;
  stopBubble(): boolean;
  bubbleRunning(): boolean;
  listCaptures(session: string | null): Promise<Capture[]>;
  deleteCaptures(uris: string[]): Promise<boolean>;
  /** Installs an APK (content:// or file://). 'permission' = the user must allow unknown sources first. */
  installApk(uri: string): Promise<'started' | 'permission'>;
  launchApp(pkg: string): boolean;
  apkInfo(uri: string): Promise<{ pkg: string; label: string; version: string; icon: string | null; installed: boolean } | null>;
  /** Unknown-sources permission granted for MShots. */
  canInstall(): boolean;
  isInstalled(pkg: string): boolean;
  addListener(event: 'onCapture', cb: (e: Capture) => void): Sub;
  addListener(event: 'onBubble', cb: (e: { running: boolean }) => void): Sub;
  addListener(event: 'onInstall', cb: (e: { ok: boolean; pkg: string | null; message: string | null }) => void): Sub;
};

export const Native = requireOptionalNativeModule<MShotsCore>('MShotsCore');
