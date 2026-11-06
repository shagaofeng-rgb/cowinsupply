import images from "@/data/storefrontImages.json";

// Match the source URL, rather than the product ID, so a new CMS image is
// never hidden behind an older thumbnail.
export function storefrontPicture(source, image, sizes) {
  const variants = Object.hasOwn(images, source) ? images[source] : null;
  if (!variants?.length) return image;
  const srcset = variants.map(([width, path]) => `${path} ${width}w`).join(", ");
  return `<picture><source type="image/webp" srcset="${srcset}" sizes="${sizes}">${image}</picture>`;
}
