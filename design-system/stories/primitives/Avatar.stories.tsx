import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Avatar from "@/components/ui/Avatar";
import { DemoCard, Variants, Sizes } from "../_kit";
// EMillion logo (the same `em-icon.png` NexaCore uses in NavBar/AuthLayout) as the sample image for
// the "Image" state. Copied into the catalog (stories/assets, not distributed via em-ui).
// @storybook/nextjs-vite resolves the image to StaticImageData ({src,...}); Avatar expects a string
// → we take `.src` (guarded in case the import is already a string in another environment).
import emIcon from "../assets/em-icon.png";
const AVATAR_IMG = typeof emIcon === "string" ? emIcon : emIcon.src;

const meta = {
  title: "Primitives/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  args: { name: "Ada Lovelace", size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
  render: (args) => (
    <DemoCard>
      <Avatar {...args} />
    </DemoCard>
  ),
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

const SIZES = [
  { key: "lg", px: "64" },
  { key: "md", px: "40" },
  { key: "sm", px: "32" },
] as const;

// Fallback chain: image (src) → initials (name) → User icon (no src/name).
// The "Image" state uses the EM logo (a mark, not a photo): Avatar uses `object-cover` (crops, for
// photos), so for the logo we force `object-contain` + padding on the <img> via an arbitrary variant
// so it shows whole and centered inside the circle.
const LOGO_FIT = "[&_img]:object-contain [&_img]:p-1.5";
const CONTENT = [
  { key: "image", label: "Image", props: { name: "Ada Lovelace", src: AVATAR_IMG, className: LOGO_FIT } },
  { key: "initials", label: "Initials", props: { name: "Ada Lovelace" } },
  { key: "icon", label: "Icon", props: {} },
] as const;

// Default — playground: use the size control (name → initials).
export const Default: Story = {};

// ── CONTENT — what renders INSIDE (the fallback chain image → initials → icon) · grouped overview ──
// It is a content axis, not a design variant: which child shows depends on the props present, not on style.
// Shown at the DEFAULT size (md) — a non-size overview always uses the default size; sizes live in AllSizes.
export const Content: Story = {
  render: () => (
    <Variants
      items={CONTENT.map(({ label, props }) => ({
        label,
        node: <Avatar {...props} />,
      }))}
    />
  ),
};

// ── OVERVIEW (ALWAYS last) — the grouped overview above (Content) sits right before this ──
// AllSizes — the 3 sizes (initials), with px. Last (no AllVariants: Avatar has no design-variant axis).
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map(({ key, px }) => ({
        label: `${key} · ${px}px${key === "md" ? " (default)" : ""}`,
        node: <Avatar size={key} name="Ada Lovelace" />,
      }))}
    />
  ),
};
