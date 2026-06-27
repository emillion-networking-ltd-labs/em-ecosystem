import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Split } from "@/components/ui/Split";

const meta = {
  title: "Layout/Split",
  component: Split,
  tags: ["autodocs"],
  args: { ratio: "1-1", gap: "lg", align: "center", reverse: false },
  argTypes: {
    ratio: { control: "inline-radio", options: ["1-1", "5-7", "7-5"] },
    align: { control: "inline-radio", options: ["start", "center", "stretch"] },
  },
} satisfies Meta<typeof Split>;

export default meta;
type Story = StoryObj<typeof meta>;

const Media = () => (
  <div className="aspect-video w-full rounded-xl border border-border-default [background-image:var(--gradient-brand)] opacity-80" />
);

export const Default: Story = {
  render: (args) => (
    <Split {...args} media={<Media />}>
      <h2 className="text-display-3 font-display">Texto y media, repartidos</h2>
      <p className="mt-3 text-content-secondary">
        Apila en móvil; en escritorio reparte según el ratio. `reverse` alterna el orden visual
        sin cambiar el DOM (el contenido va primero para SEO/a11y).
      </p>
    </Split>
  ),
};

export const Reverse: Story = {
  args: { reverse: true, ratio: "5-7" },
  render: Default.render,
};
