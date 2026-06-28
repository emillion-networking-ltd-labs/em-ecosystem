import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";
// Two FREE internet images (Lorem Picsum, landscape with no people), downloaded into the catalog
// (not distributed via em-ui). Same scene B&W → color = a real before/after. @storybook/nextjs-vite
// resolves the image to StaticImageData ({src,...}) → we take `.src` (guarded in case it's a string).
import beforeImg from "../assets/sample-before.jpg"; // B&W
import afterImg from "../assets/sample-after.jpg"; // color

const beforeSrc = typeof beforeImg === "string" ? beforeImg : beforeImg.src;
const afterSrc = typeof afterImg === "string" ? afterImg : afterImg.src;

const meta = {
  title: "Primitives/BeforeAfterSlider",
  component: BeforeAfterSlider,
  tags: ["autodocs"],
  args: {
    before: { src: beforeSrc, alt: "Before (black and white)" },
    after: { src: afterSrc, alt: "After (color)" },
    orientation: "horizontal",
    initialPosition: 50,
    aspectRatio: "4/5",
  },
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    aspectRatio: { control: "inline-radio", options: ["4/5", "1/1", "16/9", "3/4"] },
    objectFit: { control: "inline-radio", options: ["cover", "contain"] },
  },
} satisfies Meta<typeof BeforeAfterSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

// Playground — use the controls (orientation, aspect ratio, object-fit).
export const Default: Story = {
  render: (args) => (
    <div className="w-64">
      <BeforeAfterSlider {...args} />
    </div>
  ),
};

// Vertical — the divider drags top to bottom (Default already covers horizontal).
export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div className="w-64">
      <BeforeAfterSlider {...args} />
    </div>
  ),
};

// With labels: before.label (clipped with the BEFORE image) + after.label (inverse clip).
export const WithLabels: Story = {
  render: () => (
    <div className="w-64">
      <BeforeAfterSlider
        before={{
          src: beforeSrc,
          alt: "Before",
          label: (
            <div className="absolute left-3 top-3 rounded-md bg-surface-inverse px-2 py-0.5 text-caption text-content-inverse">
              BEFORE
            </div>
          ),
        }}
        after={{
          src: afterSrc,
          alt: "After",
          label: (
            <div className="absolute bottom-3 right-3 rounded-md bg-surface-inverse px-2 py-0.5 text-caption text-content-inverse">
              AFTER
            </div>
          ),
        }}
        aspectRatio="4/5"
      />
    </div>
  ),
};

const media = {
  before: { src: beforeSrc, alt: "Before" },
  after: { src: afterSrc, alt: "After" },
};

// AllVariants — ALWAYS last: orientations + aspect ratios.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">orientation</p>
        <div className="flex flex-wrap gap-4">
          {(["horizontal", "vertical"] as const).map((o) => (
            <div key={o} className="flex flex-col gap-1.5">
              <span className="text-caption text-content-tertiary">{o}</span>
              <div className="w-56">
                <BeforeAfterSlider {...media} orientation={o} aspectRatio="4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">aspect ratio</p>
        <div className="flex flex-wrap items-start gap-4">
          {(["4/5", "1/1", "16/9", "3/4"] as const).map((ratio) => (
            <div key={ratio} className="flex flex-col gap-1.5">
              <span className="text-caption text-content-tertiary">{ratio}</span>
              <div className="w-48">
                <BeforeAfterSlider {...media} aspectRatio={ratio} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};
