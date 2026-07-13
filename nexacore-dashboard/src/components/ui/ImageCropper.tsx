"use client";

// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import ConfirmModal from "./ConfirmModal";
import Slider from "./Slider";
import { getCroppedImg } from "@/lib/crop-image";

export const imageCropperSpecs = {
  modal: {
    wrapper: "ConfirmModal size=lg",
    title: "Crop Photo",
    confirm: "Save button — triggers canvas crop + onCrop(blob)",
  },
  cropArea: {
    container:
      "aspect-square w-[350px] centered — bg-surface-tertiary rounded-lg",
    cropCircle: "300×300px fixed via cropSize prop",
    library: "react-easy-crop (Cropper component)",
  },
  zoom: {
    control: "Slider component — min=1, max=3, step=0.01",
    label: "Zoom",
  },
  output: {
    format: "JPEG 0.9 quality via canvas.toBlob()",
    size: "native crop dimensions (areaPixels width × height)",
    utility: "src/lib/crop-image.ts — getCroppedImg()",
    shape: "Circular crop area (round) — matches Avatar component",
  },
};

/**
 * Persisted crop data. Uses percentage-based area for position restoration
 * (layout-independent) and pixel area for canvas extraction.
 */
export type CropData = {
  /** Percentage-based crop area — used by initialCroppedAreaPercentages for restoration */
  areaPercent: { x: number; y: number; width: number; height: number };
  /** Pixel coordinates in the original image — used by getCroppedImg for canvas extraction */
  areaPixels: { x: number; y: number; width: number; height: number };
};

interface ImageCropperProps {
  open: boolean;
  imageSrc: string;
  onCrop: (blob: Blob, cropData: CropData) => void;
  onClose: () => void;
  initialCropData?: CropData;
  aspect?: number;
  cropShape?: "round" | "rect";
  loading?: boolean;
}

export default function ImageCropper({
  open,
  imageSrc,
  onCrop,
  onClose,
  aspect = 1,
  cropShape = "round",
  loading = false,
  initialCropData,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPercent, setCroppedAreaPercent] = useState<Area | null>(
    null,
  );
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((areaPercent: Area, areaPixels: Area) => {
    setCroppedAreaPercent(areaPercent);
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels || !croppedAreaPercent) return;
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
    const cropData: CropData = {
      areaPercent: croppedAreaPercent,
      areaPixels: croppedAreaPixels,
    };
    onCrop(blob, cropData);
  };

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Crop Photo"
      description="Drag to reposition and use the slider to zoom."
      confirmLabel="Save"
      size="lg"
      loading={loading}
    >
      <div className="mt-4 space-y-4">
        <div className="relative mx-auto aspect-square w-[350px] overflow-hidden rounded-lg bg-surface-tertiary">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              cropSize={{ width: 300, height: 300 }}
              showGrid={false}
              classes={{ cropAreaClassName: "cropper-crop-area" }}
              initialCroppedAreaPercentages={initialCropData?.areaPercent}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>
        <Slider
          label="Zoom"
          value={zoom}
          onChange={setZoom}
          min={1}
          max={3}
          step={0.01}
        />
      </div>
    </ConfirmModal>
  );
}
