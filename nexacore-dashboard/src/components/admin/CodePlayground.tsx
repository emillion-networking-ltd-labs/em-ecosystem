"use client";

import { useState } from "react";
import { LiveProvider, LiveEditor, LivePreview, LiveError } from "react-live";

/* ===== Scope: all UI components available in the playground ===== */
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import Avatar from "@/components/ui/Avatar";
import Toggle from "@/components/ui/Toggle";
import Checkbox from "@/components/ui/Checkbox";
import Tooltip from "@/components/ui/Tooltip";
import Divider from "@/components/ui/Divider";
import Slider from "@/components/ui/Slider";
import Tabs from "@/components/ui/Tabs";
import Select from "@/components/ui/Select";
import Calendar from "@/components/ui/Calendar";
import Pagination from "@/components/ui/Pagination";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

const scope = {
  Button,
  Input,
  Badge,
  Spinner,
  Avatar,
  Toggle,
  Checkbox,
  Tooltip,
  Divider,
  Slider,
  Tabs,
  Select,
  Calendar,
  Pagination,
  Breadcrumbs,
  useState,
};

const defaultCode = `<div className="flex flex-wrap items-center gap-4">
  <Button variant="primary" size="md" fullWidth={false}>
    Primary
  </Button>
  <Badge variant="success">Active</Badge>
  <Avatar name="Jane Doe" size="md" />
  <Tooltip content="Hello!">
    <Badge variant="info">Hover me</Badge>
  </Tooltip>
</div>`;

const examples = [
  {
    label: "Buttons",
    code: `<div className="flex flex-wrap gap-3">
  <Button variant="primary" size="sm" fullWidth={false}>Primary</Button>
  <Button variant="secondary" size="sm" fullWidth={false}>Secondary</Button>
  <Button variant="outline" size="sm" fullWidth={false}>Outline</Button>
  <Button variant="danger" size="sm" fullWidth={false}>Danger</Button>
  <Button variant="primary" size="sm" fullWidth={false} loading>Loading</Button>
</div>`,
  },
  {
    label: "Form Elements",
    code: `<div className="space-y-3 max-w-xs">
  <Input label="Email" placeholder="you@example.com" />
  <Input label="Password" type="password" error="Required" />
</div>`,
  },
  {
    label: "Badges & Avatars",
    code: `<div className="flex items-center gap-3">
  <Avatar name="Alice B" size="lg" />
  <div>
    <p className="text-body font-normal text-content-primary">Alice Brown</p>
    <div className="flex gap-2 mt-1">
      <Badge variant="success">Admin</Badge>
      <Badge variant="info">MFA</Badge>
    </div>
  </div>
</div>`,
  },
  {
    label: "Interactive",
    code: `() => {
  const [on, setOn] = useState(false);
  const [checked, setChecked] = useState(true);
  const [val, setVal] = useState(50);
  return (
    <div className="space-y-4">
      <Toggle checked={on} onChange={setOn} label={on ? "On" : "Off"} />
      <Checkbox checked={checked} onChange={setChecked} label="Accept terms" />
      <Slider value={val} onChange={setVal} label="Opacity" showValue />
    </div>
  );
}`,
  },
];

export default function CodePlayground() {
  const [code, setCode] = useState(defaultCode);

  return (
    <div className="card-flat space-y-6">
      {/* Example Templates */}
      <div className="flex flex-wrap gap-2">
        <span className="text-caption text-content-tertiary self-center mr-1">
          Examples:
        </span>
        {examples.map((ex) => (
          <Button
            key={ex.label}
            variant="outline"
            size="sm"
            fullWidth={false}
            onClick={() => setCode(ex.code)}
          >
            {ex.label}
          </Button>
        ))}
      </div>

      {/* Live Editor */}
      <LiveProvider
        code={code}
        scope={scope}
        noInline={code.trim().startsWith("()")}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Editor */}
          <div className="rounded-xl border border-border-strong overflow-hidden">
            <div className="px-4 py-2 bg-surface-secondary border-b border-border-strong">
              <span className="text-caption font-semibold text-content-primary">
                Editor
              </span>
            </div>
            <LiveEditor
              onChange={setCode}
              className="font-mono! text-body! bg-surface-primary! p-4! min-h-[200px]!"
            />
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-border-strong overflow-hidden">
            <div className="px-4 py-2 bg-surface-secondary border-b border-border-strong">
              <span className="text-caption font-semibold text-content-primary">
                Preview
              </span>
            </div>
            <div className="p-4 min-h-[200px] bg-surface-primary">
              <LivePreview />
              <LiveError className="mt-2 text-caption text-error font-mono p-2 bg-error-bg rounded-md" />
            </div>
          </div>
        </div>
      </LiveProvider>
    </div>
  );
}
