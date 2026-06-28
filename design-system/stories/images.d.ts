// Importar imágenes en stories. @storybook/nextjs-vite emula Next.js → devuelve StaticImageData
// ({src,...}); fuera de Next sería un string con la URL. Tipamos ambos.
declare module "*.png" {
  const src: { src: string; height?: number; width?: number; blurDataURL?: string } | string;
  export default src;
}
declare module "*.svg" {
  const src: { src: string; height?: number; width?: number } | string;
  export default src;
}
declare module "*.jpeg" {
  const src: { src: string; height?: number; width?: number; blurDataURL?: string } | string;
  export default src;
}
declare module "*.jpg" {
  const src: { src: string; height?: number; width?: number; blurDataURL?: string } | string;
  export default src;
}
