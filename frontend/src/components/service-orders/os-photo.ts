export const OS_PHOTO_MAX_EDGE = 1600;
export const OS_PHOTO_TARGET_BYTES = 900 * 1024;

export function osPhotoDrawSize(width: number, height: number, maxEdge = OS_PHOTO_MAX_EDGE) {
  const scale = Math.min(1, maxEdge / Math.max(width, height, 1));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function withJpgName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") + ".jpg";
}

async function blobToBase64(blob: Blob) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("A foto não pôde ser lida."));
    reader.readAsDataURL(blob);
  });
  return dataUrl.includes(",") ? dataUrl.slice(dataUrl.indexOf(",") + 1) : dataUrl;
}

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
  if (!blob) {
    throw new Error("A foto não pôde ser reduzida para envio.");
  }
  return blob;
}

export async function readOsPhotoFile(
  file: File,
  emptyMessage = "A foto não pôde ser lida.",
): Promise<{ mimeType: string; contentBase64: string; fileName: string }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("A foto precisa ser JPEG, PNG ou WebP.");
  }

  try {
    const bitmap = await createImageBitmap(file);
    const size = osPhotoDrawSize(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error(emptyMessage);
    }
    context.drawImage(bitmap, 0, 0, size.width, size.height);
    bitmap.close();

    let quality = 0.82;
    let blob = await canvasToBlob(canvas, quality);
    while (blob.size > OS_PHOTO_TARGET_BYTES && quality > 0.5) {
      quality -= 0.08;
      blob = await canvasToBlob(canvas, quality);
    }

    return {
      mimeType: "image/jpeg",
      contentBase64: await blobToBase64(blob),
      fileName: withJpgName(file.name || "foto.jpg"),
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error(emptyMessage);
  }
}
