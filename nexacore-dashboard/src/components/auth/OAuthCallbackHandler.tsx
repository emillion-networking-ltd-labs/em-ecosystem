'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import RingSpinner from '@/components/ui/RingSpinner';

export default function OAuthCallbackHandler() {
  const { handleOAuthCallback, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const processed = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const urlError = searchParams.get('error');

    if (urlError) {
      setError('Authentication failed. Please try again.');
      setTimeout(() => router.replace('/login?error=oauth_failed'), 2000);
      return;
    }

    if (!accessToken || !refreshToken) {
      router.replace('/login?error=oauth_failed');
      return;
    }

    handleOAuthCallback(accessToken, refreshToken).catch(() => {
      router.replace('/login?error=oauth_failed');
    });
  }, [searchParams, handleOAuthCallback, router]);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {error ? (
          <p className="text-sm text-error">{error}</p>
        ) : (
          <>
            <RingSpinner size="xl" />
            <p className="text-sm text-content-primary/50">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  );
}
