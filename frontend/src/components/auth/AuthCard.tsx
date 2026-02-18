interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-card bg-surface-elevated border border-border rounded-card px-6 py-8 sm:px-10 sm:py-12">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
          </div>
          <h1 className="text-2xl font-normal text-content-primary">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-base text-content-secondary">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
