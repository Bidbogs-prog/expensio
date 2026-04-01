'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="h-full flex justify-center items-center">
    <div className="px-20 py-40 text-center bg-purple-700/10 rounded-lg shadow-lg">
      <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm mb-4">{error.message}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
      >
        Try again
      </button>
    </div>
    </div>
   
  );
}