type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Extract the cropped region from an image and return it as a JPEG Blob.
 * Uses the official react-easy-crop pattern: draw full image first,
 * then extract the crop region at its native pixel size.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CropArea,
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  // Step 1: Draw the full original image onto a canvas
  const fullCanvas = document.createElement("canvas");
  fullCanvas.width = image.naturalWidth;
  fullCanvas.height = image.naturalHeight;
  const fullCtx = fullCanvas.getContext("2d");
  if (!fullCtx) throw new Error("Canvas 2D context not available");
  fullCtx.drawImage(image, 0, 0);

  // Step 2: Extract the crop region into a second canvas
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = pixelCrop.width;
  cropCanvas.height = pixelCrop.height;
  const cropCtx = cropCanvas.getContext("2d");
  if (!cropCtx) throw new Error("Canvas 2D context not available");

  cropCtx.drawImage(
    fullCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    cropCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/jpeg",
      0.9,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
