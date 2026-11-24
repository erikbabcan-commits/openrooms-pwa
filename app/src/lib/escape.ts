/**
 * Escape HTML special characters to prevent XSS
 * React already escapes by default, but this is for extra safety
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize text input - trim and limit length
 */
export function sanitizeText(text: string, maxLength: number = 1000): string {
  return text.trim().slice(0, maxLength);
}

/**
 * Validate nickname - alphanumeric, underscores, hyphens, 1-50 chars
 */
export function validateNickname(nickname: string): boolean {
  const sanitized = nickname.trim();
  return sanitized.length >= 1 && sanitized.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(sanitized);
}

/**
 * Validate room name - alphanumeric, underscores, hyphens, 1-50 chars
 */
export function validateRoomName(name: string): boolean {
  const sanitized = name.trim();
  return sanitized.length >= 1 && sanitized.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(sanitized);
}
