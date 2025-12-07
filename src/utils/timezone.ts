export function getDefaultTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
}
