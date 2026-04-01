export function CrashTest() {
  throw new Error('Testing ErrorBoundary — this is intentional');
  return null;
}