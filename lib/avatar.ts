export const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}
