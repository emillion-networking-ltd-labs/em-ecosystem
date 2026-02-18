"use client";

interface PasswordStrengthProps {
  password: string;
}

const requirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
  {
    label: "One special character (@$!%*?&)",
    test: (p: string) => /[@$!%*?&]/.test(p),
  },
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  return (
    <div className="space-y-1.5 pt-1">
      <p className="text-xs font-medium text-content-secondary">
        Password requirements:
      </p>
      <ul className="space-y-1">
        {requirements.map((req) => {
          const met = req.test(password);
          return (
            <li
              key={req.label}
              className={`flex items-center gap-2 text-xs ${
                met ? "text-accent" : "text-content-tertiary"
              }`}
            >
              {met ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function isPasswordValid(password: string): boolean {
  return requirements.every((r) => r.test(password));
}
