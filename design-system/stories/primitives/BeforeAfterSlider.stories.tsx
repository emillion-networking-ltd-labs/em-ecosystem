import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";

// Inline SVG data URIs so the story is self-contained (no external assets).
const beforeSrc =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="%239ca3af"/><text x="50%" y="50%" fill="white" font-size="40" text-anchor="middle" dominant-baseline="middle">Before</text></svg>',
  );
const afterSrc =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="%233b82f6"/><text x="50%" y="50%" fill="white" font-size="40" text-anchor="middle" dominant-baseline="middle">After</text></svg>',
  );

const meta = {
  title: "Primitives/BeforeAfterSlider",
  component: BeforeAfterSlider,
  tags: ["autodocs"],
  args: {
    before: { src: beforeSrc, alt: "Before" },
    after: { src: afterSrc, alt: "After" },
    orientation: "horizontal",
    initialPosition: 50,
    aspectRatio: "4/5",
  },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
    },
    aspectRatio: {
      control: "inline-radio",
      options: ["4/5", "1/1", "16/9", "3/4"],
    },
    objectFit: { control: "inline-radio", options: ["cover", "contain"] },
  },
} satisfies Meta<typeof BeforeAfterSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-64">
      <BeforeAfterSlider {...args} />
    </div>
  ),
};
