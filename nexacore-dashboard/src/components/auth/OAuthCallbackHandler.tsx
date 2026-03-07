'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import RingSpinner from '@/components/ui/RingSpinner';

export default function OAuthCallbackHandler() {
  const { handleOAuthCallback, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get('code');
    const urlError = searchParams.get('error');

    if (urlError) {
      const message = decodeURIComponent(urlError);
      const encoded = encodeURIComponent(message !== 'true' ? message : 'Authentication failed. Please try again.');
      router.replace(`/login?oauth_error=${encoded}`);
      return;
    }

    if (!code) {
      router.replace('/login?oauth_error=' + encodeURIComponent('Authentication failed. Please try again.'));
      return;
    }

    handleOAuthCallback(code).catch(() => {
      router.replace('/login?oauth_error=' + encodeURIComponent('Authentication failed. Please try again.'));
    });
  }, [searchParams, handleOAuthCallback, router]);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <RingSpinner size="xl" />
        <p className="text-sm text-content-primary/50">Completing sign in...</p>
      </div>
    </div>
  );
}
