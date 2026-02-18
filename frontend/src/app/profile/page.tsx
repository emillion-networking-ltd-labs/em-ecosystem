"use client";

import { ProtectedRoute } from "@/components/guards/ProtectedRoute";
import { NavBar } from "@/components/layout/NavBar";
import { useAuth } from "@/hooks/useAuth";

function ProfileContent() {
  const { user } = useAuth();

  if (!user) return null;

  const fields = [
    { label: "User ID", value: user.id },
    { label: "Email", value: user.email },
    { label: "Role", value: user.role },
    { label: "Provider", value: user.provider },
    {
      label: "Email verified",
      value: user.emailVerified ? "Yes" : "No",
    },
    {
      label: "Member since",
      value: new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
  ];

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-normal text-content-primary mb-8">
          Profile
        </h1>
        <div className="bg-surface-elevated border border-border rounded-card divide-y divide-border">
          {fields.map((field) => (
            <div
              key={field.label}
              className="flex items-center justify-between px-6 py-4"
            >
              <span className="text-sm text-content-secondary">
                {field.label}
              </span>
              <span className="text-sm font-medium text-content-primary">
                {field.value}
              </span>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
