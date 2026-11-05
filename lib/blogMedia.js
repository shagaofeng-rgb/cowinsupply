import { assetUrl } from "@/lib/interiorRendering";

// Existing publisher images reviewed against the articles that reference them.
// New URLs stay attached to their articles. This does not change stored posts.
const reviewedImages = {
  "85b754a6c11290538277a0ffbc4e05be.jpg": ["angle-grinders", "Circular saw, drill and angle grinder"],
  "b186a0b3e756115774bb360abbab1878.png": ["jig-saws-curve-saws", "Orange and black jig saw"],
  "7f73179d3decf9ccbb47ab36ab1674a4.jpg": ["angle-grinders", "Workshop power tools including angle grinders"],
  "8adb3e8cc7520420328d43223b45c3ca.png": ["cordless-drills", "Yellow cordless drill"],
  "e4851d83d00bb626d5b9f2603874b255.png": ["laser-measuring-tapes", "Digital laser measuring tape"],
  "4654cbdec3730c478f29a809b308fb04.png": ["wall-chasers", "KFT-K230 wall chaser"],
  "7612249e131b2d91c7de97bd816d8591.jpg": ["cordless-drills", "Compact cordless drill"],
  "3c15066e6ea0df98d64aa918250bf22c.jpg": ["cordless-drills", "Yellow cordless drill"],
  "81d2b48e86387143888e31049a7d7c10.jpg": ["cordless-drills", "Blue cordless drill"],
  "357425085fea08af67c23088916ff30e.png": ["wall-chasers", "KFT-K190 wall slotting machine"],
  "fb2a07eceaa9762850e27ebffdca1010.jpg": ["angle-grinders", "Assortment of workshop power tools"],
  "9fb1a46643abbc2cf145e96c91dc500b.jpg": ["angle-grinders", "Angle grinder cutting a metal sheet"],
  "2770c62a18a8fd0cc739e774fca0dcbb.jpg": ["angle-grinders", "Cordless angle grinder"],
  "042a5bee57104e5498dfb8bdaadcb675.png": ["wall-chasers", "KFT-K210 wall chaser"],
  "389f82bc6bf9e0189e6a0c92fe59d61e.jpg": ["angle-grinders", "Angle grinder in use"]
};
const contextPhotos = {
  "angle-grinders": { src: "https://laikegeo.oss-cn-shanghai.aliyuncs.com/uploads/20260806/9fb1a46643abbc2cf145e96c91dc500b.jpg", alt: "Angle grinder cutting a metal sheet" },
  "wall-chasers": { src: "/cowin-assets/product-wallchaser-6000w.jpg", alt: "Cowin Supply KFT-K230 wall chaser", product: true },
  "laser-measuring-tapes": { src: "/cowin-assets/product-laser-tape.webp", alt: "Cowin Supply 3-in-1 laser measuring tape", product: true }
};

function reviewed(src) {
  const filename = String(src).match(/^https:\/\/laikegeo\.oss-cn-shanghai\.aliyuncs\.com\/uploads\/\d+\/([a-f0-9]+\.(?:png|jpg))(?:[?#].*)?$/i)?.[1];
  return filename ? reviewedImages[filename] : undefined;
}

export function blogCover(post, topic) {
  const src = assetUrl(post.image);
  const photo = reviewed(src);
  if (photo && topic && photo[0] !== topic) {
    const substitute = contextPhotos[topic];
    return substitute ? { ...substitute, context: true } : { src: "", alt: "" };
  }
  return { src, alt: photo?.[1] || post.coverImageAlt || post.title };
}

export function showBlogImage(src, topic, cover) {
  const photo = reviewed(src);
  return src !== cover.src && (!photo || !topic || photo[0] === topic);
}
