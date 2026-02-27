'use client';

import ThemeProvider from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { PermissionsProvider } from '@/context/PermissionsContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PermissionsProvider>
          {children}
        </PermissionsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
