import { Github } from 'lucide-react';
import GoogleIcon from '@/components/icons/GoogleIcon';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function OAuthButtons() {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* OR Divider */}
      <div className="flex h-[30px] w-full items-center gap-4">
        <div className="h-px flex-1 bg-content-primary/10" />
        <span className="text-xs leading-[18px] text-content-tertiary">OR</span>
        <div className="h-px flex-1 bg-content-primary/10" />
      </div>

      {/* Google — full page redirect to backend OAuth initiation */}
      <a
        href={`${API_BASE_URL}/auth/google`}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border-default bg-transparent px-6 py-2.5 text-base font-medium text-content-primary transition-colors hover:bg-surface-subtle"
      >
        <GoogleIcon width={16} height={16} className="text-content-primary/50" />
        Continue with Google
      </a>

      {/* GitHub — full page redirect to backend OAuth initiation */}
      <a
        href={`${API_BASE_URL}/auth/github`}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border-default bg-transparent px-6 py-2.5 text-base font-medium text-content-primary transition-colors hover:bg-surface-subtle"
      >
        <Github size={16} className="text-content-primary/50" />
        Continue with GitHub
      </a>
    </div>
  );
}
