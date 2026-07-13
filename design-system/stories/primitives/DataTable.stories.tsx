import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import DataTable, { type ColumnDef } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import { DemoCard } from "../_kit";

interface Row {
  id: string;
  name: string;
  role: "Admin" | "User";
  status: "Active" | "Locked";
}

const data: Row[] = [
  { id: "1", name: "Alice Brown", role: "Admin", status: "Active" },
  { id: "2", name: "Bob Wilson", role: "User", status: "Active" },
  { id: "3", name: "Carol Davis", role: "Admin", status: "Locked" },
  { id: "4", name: "David Lee", role: "User", status: "Active" },
];

// A cell can render any node — here Role and Status use Badge (status combined with Badge,
// same as the dashboard's DataTable showcase).
const columns: ColumnDef<Row>[] = [
  { key: "name", label: "Name", render: (row) => row.name },
  {
    key: "role",
    label: "Role",
    render: (row) => (
      <Badge variant={row.role === "Admin" ? "info" : "default"}>{row.role}</Badge>
    ),
  },
  {
    key: "status",
    label: "Status",
    align: "right",
    render: (row) => (
      <Badge variant={row.status === "Active" ? "success" : "error"}>
        {row.status}
      </Badge>
    ),
  },
];

const meta = {
  title: "Migration/DataTable",
  component: DataTable,
  tags: ["autodocs"],
  args: {
    data,
    columns,
    keyExtractor: (row: Row) => row.id,
  },
  // Fixed, uniform width for the three states, centered in the card (the table is w-full inside).
  render: (args) => (
    <DemoCard>
      <div className="w-[560px] max-w-full">
        <DataTable {...args} />
      </div>
    </DemoCard>
  ),
} satisfies Meta<typeof DataTable<Row>>;

export default meta;
type Story = StoryObj<typeof meta>;

// No design-variant/size axis — its axes are states (with data / loading / empty), each its own story.
// So there is no AllVariants.

// With data — cells can hold any content (Role/Status rendered as Badge).
export const Default: Story = {};

// Loading — skeleton rows while data loads.
export const Loading: Story = {
  args: { data: [], loading: true, loadingRows: 3 },
};

// Empty — custom message when there are no rows.
export const Empty: Story = {
  args: { data: [], emptyMessage: "No users match your filters." },
};
