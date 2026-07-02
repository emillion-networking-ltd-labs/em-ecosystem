import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Split } from "@/components/ui/Split";

const meta = {
  title: "Layout/Split",
  component: Split,
  tags: ["autodocs"],
  args: { ratio: "1-1", gap: "lg", align: "center", reverse: false },
  argTypes: {
    ratio: { control: "inline-radio", options: ["1-1", "5-7", "7-5"] },
    gap: { control: "inline-radio", options: ["md", "lg", "xl"] },
    align: { control: "inline-radio", options: ["start", "center", "stretch"] },
  },
} satisfies Meta<typeof Split>;

export default meta;
type Story = StoryObj<typeof meta>;

// Ratios — content-to-media split on desktop.
const RATIOS = [
  { ratio: "7-5", label: "content 7 / media 5" },
  { ratio: "1-1", label: "content 1 / media 1" },
  { ratio: "5-7", label: "content 5 / media 7" },
] as const;
const Media = () => (
  <div className="aspect-video w-full rounded-xl border border-border-default [background-image:var(--gradient-brand)] opacity-80" />
);

const Content = () => (
  <>
    <h2 className="text-display-3 font-display">Text and media, split</h2>
    <p className="mt-3 text-content-secondary">
      Stacks on mobile; on desktop it splits by the ratio. <code>reverse</code> flips the visual
      order without changing the DOM (content stays first for SEO/a11y).
    </p>
  </>
);

// Playground — two panels that stack on mobile and split on desktop.
export const Default: Story = {
  render: (args) => (
    <Split {...args} media={<Media />}>
      <Content />
    </Split>
  ),
};

// Reverse — media on the left visually; the DOM keeps content → media.
export const Reverse: Story = {
  args: { reverse: true, ratio: "5-7" },
  render: Default.render,
};

// Ratios — the three content/media proportions.
export const Ratios: Story = {
  render: () => (
    <div className="space-y-8">
      {RATIOS.map(({ ratio, label }) => (
        <div key={ratio} className="space-y-1.5">
          <span className="text-caption text-content-secondary font-mono">
            ratio=&quot;{ratio}&quot; · {label}
            {ratio === "1-1" ? " (default)" : ""}
          </span>
          <Split ratio={ratio} media={<Media />}>
            <Content />
          </Split>
        </div>
      ))}
    </div>
  ),
};
