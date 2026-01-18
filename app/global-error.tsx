'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="mb-6 text-muted-foreground">
              {error.message || 'An unexpected error occurred'}
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={
                  () => reset()
                }
                className="w-full"
              >
                Try Again
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Go Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}