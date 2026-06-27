import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ImageCropper from "@/components/ui/ImageCropper";

// Small inline SVG data URI used as the image to crop (self-contained).
const sampleImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%233b82f6"/><circle cx="200" cy="200" r="120" fill="%23ffffff"/></svg>',
  );

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
