import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ImageCropper from "@/components/ui/ImageCropper";
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
