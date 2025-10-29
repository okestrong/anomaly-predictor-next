/**
 * Format bytes to human-readable string
 * @param bytes - Byte value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.23 GB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  if (!bytes || isNaN(bytes) || !isFinite(bytes)) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  return `${size.toFixed(dm)} ${sizes[i]}`;
}

/**
 * Convert GB to bytes
 * @param gb - Gigabyte value
 * @returns Byte value
 */
export function gbToBytes(gb: number): number {
  return gb * 1024 * 1024 * 1024;
}

/**
 * Convert TB to bytes
 * @param tb - Terabyte value
 * @returns Byte value
 */
export function tbToBytes(tb: number): number {
  return tb * 1024 * 1024 * 1024 * 1024;
}

/**
 * Convert bytes to GB
 * @param bytes - Byte value
 * @returns Gigabyte value
 */
export function bytesToGb(bytes: number): number {
  return bytes / (1024 * 1024 * 1024);
}

/**
 * Convert bytes to TB
 * @param bytes - Byte value
 * @returns Terabyte value
 */
export function bytesToTb(bytes: number): number {
  return bytes / (1024 * 1024 * 1024 * 1024);
}

/**
 * Format bandwidth (bytes per second) to human-readable string
 * @param bytesPerSecond - Bytes per second value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.23 GB/s")
 */
export function formatBandwidth(bytesPerSecond: number, decimals: number = 2): string {
  if (bytesPerSecond === 0) return '0 B/s';
  if (!bytesPerSecond || isNaN(bytesPerSecond) || !isFinite(bytesPerSecond)) return '0 B/s';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s', 'PB/s'];

  const i = Math.floor(Math.log(Math.abs(bytesPerSecond)) / Math.log(k));
  const size = bytesPerSecond / Math.pow(k, i);

  return `${size.toFixed(dm)} ${sizes[i]}`;
}

/**
 * Format number with thousand separators
 * @param value - Number value
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string (e.g., "1,234,567")
 */
export function formatNumber(value: number, decimals: number = 0): string {
  if (!value || isNaN(value) || !isFinite(value)) return '0';

  return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format percentage
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string (e.g., "75.5%")
 */
export function formatPercent(value: number, decimals: number = 1): string {
  if (!value || isNaN(value) || !isFinite(value)) return '0%';

  return `${value.toFixed(decimals)}%`;
}
