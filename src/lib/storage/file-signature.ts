export function matchesFileSignature(type: string, bytes: Uint8Array): boolean {
  const starts = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  switch (type) {
    case "image/png": return starts(137, 80, 78, 71, 13, 10, 26, 10);
    case "image/jpeg": return starts(255, 216, 255);
    case "image/webp": return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "image/avif": return ascii(4, 8) === "ftyp" && /avif|avis/.test(ascii(8, 32));
    case "application/pdf": return ascii(0, 5) === "%PDF-";
    case "video/mp4": case "video/quicktime": return ascii(4, 8) === "ftyp";
    case "video/webm": return starts(26, 69, 223, 163);
    default: return false;
  }
}
