'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 text-center shadow-medium">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/12 text-destructive ring-1 ring-destructive/20">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="font-display text-lg font-bold tracking-tight">Something went wrong</h2>
        <p className="mt-2 break-words text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={reset} className="mt-6 w-full">
          <RotateCcw className="h-4 w-4" />
          Try again
        </Button>
      </Card>
    </div>
  );
}
