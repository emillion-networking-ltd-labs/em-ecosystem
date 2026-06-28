import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import DataTable, { type ColumnDef } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";

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
  title: "Primitives/DataTable",
  component: DataTable,
  tags: ["autodocs"],
  args: {
    data,
    columns,
    keyExtractor: (row: Row) => row.id,
  },
  // Constrain in the catalog so the table sizes sensibly instead of stretching the full-bleed canvas.
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DataTable<Row>>;

export default meta;
type Story = StoryObj<typeof meta>;

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

// AllVariants — ALWAYS last: the three states together (with data / loading / empty).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">with data</p>
        <DataTable data={data} columns={columns} keyExtractor={(row) => row.id} />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">loading</p>
        <DataTable
          data={[]}
          columns={columns}
          keyExtractor={(row) => row.id}
          loading
          loadingRows={3}
        />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">empty</p>
        <DataTable
          data={[]}
          columns={columns}
          keyExtractor={(row) => row.id}
          emptyMessage="No users match your filters."
        />
      </div>
    </div>
  ),
};
