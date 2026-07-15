import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";
import { DemoCard } from "../_kit";
// Two FREE internet images (Lorem Picsum, landscape with no people), downloaded into the catalog
// (not distributed via em-ui). Same scene B&W → color = a real before/after. @storybook/nextjs-vite
// resolves the image to StaticImageData ({src,...}) → we take `.src` (guarded in case it's a string).
import beforeImg from "../assets/sample-before.jpg"; // B&W
import afterImg from "../assets/sample-after.jpg"; // color

const beforeSrc = typeof beforeImg === "string" ? beforeImg : beforeImg.src;
const afterSrc = typeof afterImg === "string" ? afterImg : afterImg.src;

const meta = {
  title: "Migration/BeforeAfterSlider",
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
  render: (args) => (
    <DemoCard>
      <div className="w-64">
        <BeforeAfterSlider {...args} />
      </div>
    </DemoCard>
  ),
} satisfies Meta<typeof BeforeAfterSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

// No design-variant axis — orientation, aspect ratio and object-fit are parameters (on the controls); the
// meaningful cases (vertical, with labels) are their own stories. So there is no AllVariants.

// Default — playground: drag the divider; try orientation / aspect ratio / object-fit from the controls.
export const Default: Story = {};

// Vertical — the divider drags top to bottom (Default already covers horizontal).
export const Vertical: Story = { args: { orientation: "vertical" } };

// With labels: before.label (clipped with the BEFORE image) + after.label (inverse clip).
export const WithLabels: Story = {
  render: () => (
    <DemoCard>
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
    </DemoCard>
  ),
};
