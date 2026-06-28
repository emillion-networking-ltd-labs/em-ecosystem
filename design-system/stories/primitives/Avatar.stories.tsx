import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Avatar from "@/components/ui/Avatar";
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
const STATES = [
  { key: "image", label: "Image", props: { name: "Ada Lovelace", src: AVATAR_IMG, className: LOGO_FIT } },
  { key: "initials", label: "Initials", props: { name: "Ada Lovelace" } },
  { key: "icon", label: "Icon", props: {} },
] as const;

// Playground — use the size control (name → initials).
export const Default: Story = {};

// The 3 fallback-chain states (lg size).
export const Fallbacks: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-6">
      {STATES.map(({ key, label, props }) => (
        <div key={key} className="flex flex-col items-center gap-1.5">
          <Avatar size="lg" {...props} />
          <span className="text-caption text-content-tertiary">{label}</span>
        </div>
      ))}
    </div>
  ),
};

// The 3 sizes (initials), with px.
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-4">
      {SIZES.map(({ key, px }) => (
        <div key={key} className="flex flex-col items-center gap-1">
          <Avatar size={key} name="Ada Lovelace" />
          <span className="text-caption text-content-tertiary font-mono">
            {key} · {px}px{key === "md" ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};

// AllVariants — ALWAYS last: full state × size matrix (dashboard layout).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      {STATES.map(({ key, label, props }) => (
        <div key={key}>
          <p className="mb-2 text-caption text-content-tertiary font-mono">{label}</p>
          <div className="flex flex-wrap items-end gap-4">
            {SIZES.map(({ key: s, px }) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <Avatar size={s} {...props} />
                <span className="text-caption text-content-tertiary font-mono">
                  {s} · {px}px{s === "md" ? " (default)" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};
