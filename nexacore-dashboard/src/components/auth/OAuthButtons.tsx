import { Github } from 'lucide-react';
import GoogleIcon from '@/components/icons/GoogleIcon';

export default function OAuthButtons() {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* OR Divider */}
      <div className="flex h-[30px] w-full items-center gap-4">
        <div className="h-px flex-1 bg-content-primary/10" />
        <span className="text-xs text-content-tertiary">OR</span>
        <div className="h-px flex-1 bg-content-primary/10" />
      </div>

      {/* Google */}
      <button
        type="button"
        className="flex h-10 w-full items-center justify-center gap-2.5 rounded-md border border-border-default bg-transparent text-base font-medium text-content-primary transition-colors hover:bg-surface-subtle"
      >
        <GoogleIcon width={16} height={16} className="text-content-primary/50" />
        Continue with Google
      </button>

      {/* GitHub */}
      <button
        type="button"
        className="flex h-10 w-full items-center justify-center gap-2.5 rounded-md border border-border-default bg-transparent text-base font-medium text-content-primary transition-colors hover:bg-surface-subtle"
      >
        <Github size={16} className="text-content-primary/50" />
        Continue with GitHub
      </button>
    </div>
  );
}
