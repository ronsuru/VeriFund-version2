// Utility functions for standardized ID display formatting

/**
 * Formats a UUID to show first 8 and last 4 characters with ellipsis
 * Example: "dcfec0eb-1321-4eb2-b22b-290199a5a6a4" -> "dcfec0eb...a6a4"
 */
export function formatDisplayId(id: string): string {
  if (!id || id.length < 12) return id;
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

/**
 * Copies an ID to clipboard
 */
export function copyIdToClipboard(id: string): void {
  navigator.clipboard.writeText(id);
}