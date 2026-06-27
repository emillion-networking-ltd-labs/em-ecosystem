import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Button from "@/components/ui/Button";

const meta = {
  title: "Primitives/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Continuar", variant: "primary", size: "md" },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "danger", "link", "link-underline"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Outline: Story = { args: { variant: "outline" } };
export const Danger: Story = { args: { variant: "danger", children: "Eliminar" } };
export const Loading: Story = { args: { loading: true } };

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {(["primary", "secondary", "outline", "danger", "link"] as const).map((v) => (
        <Button key={v} variant={v}>
          {v}
        </Button>
      ))}
    </div>
  ),
};
