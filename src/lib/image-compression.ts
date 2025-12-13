import imageCompression from "browser-image-compression";

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,          // Max size 1MB
    maxWidthOrHeight: 1920,// Max dimension 1920px (Full HD)
    useWebWorker: true,    // Use web worker for performance
    fileType: "image/webp" // Convert to modern WebP format
  };

  try {
    const compressedFile = await imageCompression(file, options);
    // Create a new file object to preserve the original name but with .webp extension
    const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    return new File([compressedFile], newFileName, { type: "image/webp" });
  } catch (error) {
    console.error("Compression failed:", error);
    // Fallback to original file if compression fails
    return file; 
  }
}