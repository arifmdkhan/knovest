import { formatDistanceToNow } from "date-fns";

export function formatShortDistanceToNow(date: Date) {
  const fullDistance = formatDistanceToNow(date, { addSuffix: true });
  
  // Direct regex replacement for all cases
  let short = fullDistance;
  
  // Handle "less than a minute ago" → "now"
  if (short === "less than a minute ago") return "now";
  
  // Extract number and unit, then map to short form
  const match = short.match(/(\d+) (minute|hour|day|week|month|year)s? ago/);
  if (match) {
    const [, num, unit] = match;
    const unitMap: Record<string, string> = {
      minute: "m",
      hour: "h",
      day: "d",
      week: "w",
      month: "mo",  // Distinct from minutes
      year: "y",
    };
    const shortUnit = unitMap[unit] || unit[0];
    return `${num}${shortUnit} ago`;
  }
  
  // Handle "about 1 minute ago" → "1m ago"
  const aboutMatch = short.match(/about (\d+) (minute|hour|week|month|year)s? ago/);
  if (aboutMatch) {
    const [, num, unit] = aboutMatch;
    const unitMap: Record<string, string> = {
      minute: "m",
      hour: "h",
      week: "w",
      month: "mo",
      year: "y",
    };
    const shortUnit = unitMap[unit] || unit[0];
    return `${num}${shortUnit} ago`;
  }
  
  // Fallback for exact "1 minute ago" etc. (already handled above)
  // For "about a minute ago" → "1m ago"
  if (short === "about a minute ago") return "1m ago";
  
  // If no match, return original
  return short;
}