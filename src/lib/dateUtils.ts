/**
 * Safely parses any date string from the backend, ensuring it is interpreted as UTC
 * even if it does not contain a timezone suffix (like Z or +00:00).
 */
export function parseUTCDate(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;

  let str = dateInput.trim();
  if (!str) return null;

  // Normalise space separator to 'T' for ISO 8601 compliance (e.g. YYYY-MM-DD HH:MM:SS)
  if (str.includes(' ') && !str.includes('T')) {
    str = str.replace(' ', 'T');
  }

  // Check if it already has a timezone indicator (Z or +HH:MM or -HH:MM or +HH or -HH or +HHMM or -HHMM)
  const hasTimezone = /[Zz]$|([+-]\d{2}:?\d{2})$|([+-]\d{2})$/.test(str);

  if (!hasTimezone) {
    // Append 'Z' to treat the naive datetime as UTC
    str = str + 'Z';
  }

  const date = new Date(str);
  return isNaN(date.getTime()) ? new Date(dateInput) : date;
}

/**
 * Formats a date string into a local date string (e.g., "Oct 27, 2023").
 */
export function formatToLocalDate(
  dateInput: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseUTCDate(dateInput);
  if (!date || isNaN(date.getTime())) return "";

  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return date.toLocaleDateString(undefined, defaultOptions);
}

/**
 * Formats a date string into a local datetime string (e.g., "Oct 27, 2023, 10:00 AM").
 */
export function formatToLocalDateTime(
  dateInput: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseUTCDate(dateInput);
  if (!date || isNaN(date.getTime())) return "";

  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return date.toLocaleString(undefined, defaultOptions);
}
