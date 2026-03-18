"use client";

import { useState } from "react";
import { Mail, Search, Star, Trash2, Edit, Copy, Archive } from "lucide-react";
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
import ErrorAlert from "@/components/ui/ErrorAlert";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

/* ===== Section Wrapper ===== */

function ShowcaseSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card space-y-4" id={`showcase-${title.toLowerCase()}`}>
      <h3 className="text-heading-sm text-content-primary">{title}</h3>
      {children}
    </div>
  );
}

function VariantRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-caption text-content-tertiary font-mono">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

/* ===== Atom Showcases ===== */

function ButtonShowcase() {
  return (
    <ShowcaseSection title="Button">
      <VariantRow label="variants">
        <Button variant="primary" size="md" fullWidth={false}>
          Primary
        </Button>
        <Button variant="secondary" size="md" fullWidth={false}>
          Secondary
        </Button>
        <Button variant="outline" size="md" fullWidth={false}>
          Outline
        </Button>
        <Button variant="danger" size="md" fullWidth={false}>
          Danger
        </Button>
      </VariantRow>
      <VariantRow label="sizes">
        <Button variant="primary" size="sm" fullWidth={false}>
          Small
        </Button>
        <Button variant="primary" size="md" fullWidth={false}>
          Medium
        </Button>
        <Button variant="primary" size="lg" fullWidth={false}>
          Large
        </Button>
      </VariantRow>
      <VariantRow label="states">
        <Button variant="primary" size="md" fullWidth={false} loading>
          Loading
        </Button>
        <Button variant="primary" size="md" fullWidth={false} disabled>
          Disabled
        </Button>
      </VariantRow>
    </ShowcaseSection>
  );
}

function InputShowcase() {
  return (
    <ShowcaseSection title="Input">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <Input label="Default" placeholder="Type here..." />
        <Input
          label="With icon"
          placeholder="Search..."
          leftIcon={<Search size={16} />}
        />
        <Input label="Password" type="password" placeholder="Enter password" />
        <Input
          label="Error state"
          placeholder="Invalid"
          error="This field is required"
        />
        <Input label="Disabled" placeholder="Cannot edit" disabled />
      </div>
    </ShowcaseSection>
  );
}

function BadgeShowcase() {
  return (
    <ShowcaseSection title="Badge">
      <VariantRow label="variants (sm)">
        <Badge variant="default">Default</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="error">Error</Badge>
        <Badge variant="info">Info</Badge>
      </VariantRow>
      <VariantRow label="variants (md)">
        <Badge variant="default" size="md">
          Default
        </Badge>
        <Badge variant="success" size="md">
          Success
        </Badge>
        <Badge variant="warning" size="md">
          Warning
        </Badge>
        <Badge variant="error" size="md">
          Error
        </Badge>
        <Badge variant="info" size="md">
          Info
        </Badge>
      </VariantRow>
    </ShowcaseSection>
  );
}

function SpinnerShowcase() {
  return (
    <ShowcaseSection title="Spinner">
      <VariantRow label="sizes">
        <Spinner size="sm" />
        <Spinner size="md" />
      </VariantRow>
    </ShowcaseSection>
  );
}

function AvatarShowcase() {
  return (
    <ShowcaseSection title="Avatar">
      <VariantRow label="sizes (image)">
        <Avatar size="xs" src="https://i.pravatar.cc/64?u=1" name="Jane Doe" />
        <Avatar
          size="sm"
          src="https://i.pravatar.cc/64?u=2"
          name="John Smith"
        />
        <Avatar
          size="md"
          src="https://i.pravatar.cc/64?u=3"
          name="Alice Brown"
        />
        <Avatar
          size="lg"
          src="https://i.pravatar.cc/64?u=4"
          name="Bob Wilson"
        />
      </VariantRow>
      <VariantRow label="initials fallback">
        <Avatar size="xs" name="Jane Doe" />
        <Avatar size="sm" name="John Smith" />
        <Avatar size="md" name="Alice Brown" />
        <Avatar size="lg" name="Bob Wilson" />
      </VariantRow>
      <VariantRow label="icon fallback">
        <Avatar size="xs" />
        <Avatar size="sm" />
        <Avatar size="md" />
        <Avatar size="lg" />
      </VariantRow>
    </ShowcaseSection>
  );
}

function ToggleShowcase() {
  const [values, setValues] = useState({
    a: false,
    b: true,
    c: false,
    d: true,
  });
  return (
    <ShowcaseSection title="Toggle">
      <VariantRow label="states (md)">
        <Toggle
          checked={values.a}
          onChange={(v) => setValues((s) => ({ ...s, a: v }))}
          label="Off"
        />
        <Toggle
          checked={values.b}
          onChange={(v) => setValues((s) => ({ ...s, b: v }))}
          label="On"
        />
        <Toggle checked={false} disabled label="Disabled off" />
        <Toggle checked={true} disabled label="Disabled on" />
      </VariantRow>
      <VariantRow label="sizes">
        <Toggle
          size="sm"
          checked={values.c}
          onChange={(v) => setValues((s) => ({ ...s, c: v }))}
          label="Small"
        />
        <Toggle
          size="md"
          checked={values.d}
          onChange={(v) => setValues((s) => ({ ...s, d: v }))}
          label="Medium"
        />
      </VariantRow>
    </ShowcaseSection>
  );
}

function CheckboxShowcase() {
  const [values, setValues] = useState({ a: false, b: true, c: false });
  return (
    <ShowcaseSection title="Checkbox">
      <VariantRow label="states">
        <Checkbox
          checked={values.a}
          onChange={(v) => setValues((s) => ({ ...s, a: v }))}
          label="Unchecked"
        />
        <Checkbox
          checked={values.b}
          onChange={(v) => setValues((s) => ({ ...s, b: v }))}
          label="Checked"
        />
        <Checkbox
          indeterminate
          checked={values.c}
          onChange={(v) => setValues((s) => ({ ...s, c: v }))}
          label="Indeterminate"
        />
        <Checkbox checked={false} disabled label="Disabled" />
        <Checkbox checked={true} disabled label="Disabled checked" />
      </VariantRow>
    </ShowcaseSection>
  );
}

function TooltipShowcase() {
  return (
    <ShowcaseSection title="Tooltip">
      <VariantRow label="positions">
        <Tooltip content="Tooltip on top" position="top">
          <Button variant="outline" size="sm" fullWidth={false}>
            Top
          </Button>
        </Tooltip>
        <Tooltip content="Tooltip on bottom" position="bottom">
          <Button variant="outline" size="sm" fullWidth={false}>
            Bottom
          </Button>
        </Tooltip>
        <Tooltip content="Tooltip on left" position="left">
          <Button variant="outline" size="sm" fullWidth={false}>
            Left
          </Button>
        </Tooltip>
        <Tooltip content="Tooltip on right" position="right">
          <Button variant="outline" size="sm" fullWidth={false}>
            Right
          </Button>
        </Tooltip>
      </VariantRow>
    </ShowcaseSection>
  );
}

function DividerShowcase() {
  return (
    <ShowcaseSection title="Divider">
      <div className="max-w-md space-y-2">
        <p className="text-body-sm text-content-secondary">Content above</p>
        <Divider />
        <p className="text-body-sm text-content-secondary">Content below</p>
      </div>
    </ShowcaseSection>
  );
}

function SliderShowcase() {
  const [v1, setV1] = useState(35);
  const [v2, setV2] = useState(70);
  return (
    <ShowcaseSection title="Slider">
      <div className="max-w-md space-y-4">
        <Slider value={v1} onChange={setV1} label="Volume" showValue />
        <Slider
          value={v2}
          onChange={setV2}
          min={0}
          max={200}
          step={10}
          label="Budget"
          showValue
        />
        <Slider value={50} onChange={() => {}} label="Disabled" disabled />
      </div>
    </ShowcaseSection>
  );
}

/* ===== Molecule Showcases ===== */

function TabsShowcase() {
  const [active, setActive] = useState("tab1");
  return (
    <ShowcaseSection title="Tabs">
      <VariantRow label="default">
        <Tabs
          tabs={[
            { label: "Overview", value: "tab1" },
            { label: "Members", value: "tab2" },
            { label: "Settings", value: "tab3" },
          ]}
          activeTab={active}
          onChange={setActive}
        />
      </VariantRow>
      <VariantRow label="full width">
        <div className="w-full max-w-md">
          <Tabs
            tabs={[
              { label: "Day", value: "d" },
              { label: "Week", value: "w" },
              { label: "Month", value: "m" },
            ]}
            activeTab="w"
            onChange={() => {}}
            fullWidth
          />
        </div>
      </VariantRow>
    </ShowcaseSection>
  );
}

function SelectShowcase() {
  const [val, setVal] = useState("");
  return (
    <ShowcaseSection title="Select">
      <div className="max-w-xs">
        <Select
          options={[
            { label: "Edit", value: "edit", icon: <Edit size={14} /> },
            { label: "Duplicate", value: "dup", icon: <Copy size={14} /> },
            { label: "Archive", value: "arch", icon: <Archive size={14} /> },
            {
              label: "Delete",
              value: "del",
              icon: <Trash2 size={14} />,
              variant: "danger",
            },
          ]}
          value={val}
          onChange={setVal}
          placeholder="Choose action..."
        />
      </div>
    </ShowcaseSection>
  );
}

function CalendarShowcase() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return (
    <ShowcaseSection title="Calendar">
      <Calendar value={date} onChange={setDate} />
      {date && (
        <p className="text-caption text-content-secondary">
          Selected: {date.toLocaleDateString()}
        </p>
      )}
    </ShowcaseSection>
  );
}

function PaginationShowcase() {
  const [page, setPage] = useState(1);
  return (
    <ShowcaseSection title="Pagination">
      <Pagination currentPage={page} totalPages={12} onPageChange={setPage} />
    </ShowcaseSection>
  );
}

function ErrorAlertShowcase() {
  return (
    <ShowcaseSection title="ErrorAlert">
      <div className="max-w-md">
        <ErrorAlert message="Something went wrong. Please try again." />
      </div>
    </ShowcaseSection>
  );
}

function BreadcrumbsShowcase() {
  return (
    <ShowcaseSection title="Breadcrumbs">
      <Breadcrumbs
        items={[
          { label: "Home", href: "#" },
          { label: "Projects", href: "#" },
          { label: "Settings" },
        ]}
      />
    </ShowcaseSection>
  );
}

/* ===== Exports ===== */

export function AtomShowcase() {
  return (
    <div className="space-y-6">
      <ButtonShowcase />
      <InputShowcase />
      <BadgeShowcase />
      <SpinnerShowcase />
      <AvatarShowcase />
      <ToggleShowcase />
      <CheckboxShowcase />
      <TooltipShowcase />
      <DividerShowcase />
      <SliderShowcase />
    </div>
  );
}

export function MoleculeShowcase() {
  return (
    <div className="space-y-6">
      <TabsShowcase />
      <SelectShowcase />
      <CalendarShowcase />
      <PaginationShowcase />
      <ErrorAlertShowcase />
      <BreadcrumbsShowcase />
    </div>
  );
}
