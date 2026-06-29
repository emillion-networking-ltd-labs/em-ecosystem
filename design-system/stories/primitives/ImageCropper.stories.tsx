import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ImageCropper from "@/components/ui/ImageCropper";
import Button from "@/components/ui/Button";
// Real free image (Picsum, no people) so the crop region is appreciable. nextjs-vite resolves it to
// StaticImageData ({src,...}) → take `.src` (guarded in case it's a string).
import sampleImg from "../assets/sample-after.jpg";

const sampleImage = typeof sampleImg === "string" ? sampleImg : sampleImg.src;

const meta = {
  title: "Primitives/ImageCropper",
  component: ImageCropper,
  tags: ["autodocs"],
  args: {
    open: true,
    imageSrc: sampleImage,
    onCrop: () => {},
    onClose: () => {},
  },
} satisfies Meta<typeof ImageCropper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    return (
      <ImageCropper
        {...args}
        open={open}
        onClose={() => setOpen(false)}
        onCrop={() => setOpen(false)}
      />
    );
  },
};

// cropShape: union real "round" | "rect". round es el default (recorte circular,
// como el Avatar). Estado controlado vía useState (open).
export const Rectangular: Story = {
  args: { cropShape: "rect" },
  render: (args) => {
    const [open, setOpen] = useState(true);
    return (
      <ImageCropper
        {...args}
        open={open}
        onClose={() => setOpen(false)}
        onCrop={() => setOpen(false)}
      />
    );
  },
};

const CROP_SHAPES = [
  { key: "round", label: "round (default)" },
  { key: "rect", label: "rect" },
] as const;

// AllVariants — ALWAYS last: each crop shape (round · rect), opened by its own trigger.
export const AllVariants: Story = {
  render: () => {
    const [openShape, setOpenShape] = useState<"round" | "rect" | null>(null);
    const close = () => setOpenShape(null);
    return (
      <div className="flex flex-col gap-3">
        <p className="text-caption text-content-tertiary font-mono">open each crop shape →</p>
        <div className="flex flex-wrap items-center gap-3">
          {CROP_SHAPES.map(({ key, label }) => (
            <Button
              key={key}
              variant="outline"
              size="md"
              fullWidth={false}
              onClick={() => setOpenShape(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        <ImageCropper
          open={openShape === "round"}
          imageSrc={sampleImage}
          cropShape="round"
          onClose={close}
          onCrop={close}
        />
        <ImageCropper
          open={openShape === "rect"}
          imageSrc={sampleImage}
          cropShape="rect"
          onClose={close}
          onCrop={close}
        />
      </div>
    );
  },
};
