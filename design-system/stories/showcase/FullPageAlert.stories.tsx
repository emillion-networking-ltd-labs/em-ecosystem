import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { CircleX, CircleCheck } from "lucide-react";
import Button from "@/components/ui/Button";

// Full-page feedback screens (auth result: error / success) — the "Feedback / Alerts → full page"
// pattern from the dashboard. Not a single registry component: it's a composition of design-system
// primitives (Button + lucide icon) on a framed card. Hover to replay the icon animation
// (icon-error = pop-in + shake · icon-success = pop-in), now distributed via tokens.css.
function FullPageCard({ type }: { type: "error" | "success" }) {
  const [animKey, setAnimKey] = useState(0);
  const isError = type === "error";
  return (
    <div
      className="w-[280px] cursor-pointer overflow-hidden rounded-3xl border border-border-strong bg-surface-secondary shadow-card"
      onMouseEnter={() => setAnimKey((k) => k + 1)}
    >
      <div className="flex min-h-[200px] flex-col justify-center gap-2 border-b border-border-strong bg-surface-primary p-6">
        <div className="flex flex-col items-center gap-2">
          {isError ? (
            <CircleX key={`error-${animKey}`} size={48} strokeWidth={1.5} className="icon-error text-error" />
          ) : (
            <CircleCheck key={`success-${animKey}`} size={48} strokeWidth={1.5} className="icon-success text-success" />
          )}
          <p className="text-center text-body text-content-tertiary">
            {isError ? (
              <>
                Something went wrong!
                <br />
                Please try again.
              </>
            ) : (
              "Email verified!"
            )}
          </p>
          <Button variant="outline" size="md" fullWidth>
            {isError ? "Go to Sign In" : "Go to Dashboard"}
          </Button>
        </div>
      </div>
      <div className="h-14 w-full p-2" />
    </div>
  );
}

const meta: Meta = {
  title: "Showcase/FullPageAlert",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const Error: Story = { render: () => <FullPageCard type="error" /> };

export const Success: Story = { render: () => <FullPageCard type="success" /> };

// AllVariants — both feedback screens grouped, labelled by story name; hover each to replay the icon animation.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      {(["error", "success"] as const).map((type) => (
        <div key={type} className="flex flex-col gap-1.5">
          <span className="text-caption text-content-tertiary font-mono">
            {type === "error" ? "Error" : "Success"}
          </span>
          <FullPageCard type={type} />
        </div>
      ))}
    </div>
  ),
};
