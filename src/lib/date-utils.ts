/**
 * Date and Time Formatting Utilities
 * Provides consistent date/time formatting across the application
 * All dates are formatted with English numerals
 */

/**
 * Format date to DD/MM/YYYY
 * @param date - Date object, string, or timestamp
 * @returns Formatted date string (e.g., "29/11/2025")
 */
export const formatDate = (date: Date | string | number): string => {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Format time to HH:MM
 * @param date - Date object, string, or timestamp
 * @returns Formatted time string (e.g., "14:30")
 */
export const formatTime = (date: Date | string | number): string => {
  const d = new Date(date)
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

/**
 * Format date and time to DD/MM/YYYY HH:MM
 * @param date - Date object, string, or timestamp
 * @returns Formatted date-time string (e.g., "29/11/2025 14:30")
 */
export const formatDateTime = (date: Date | string | number): string => {
  return `${formatDate(date)} ${formatTime(date)}`
}

/**
 * Format date and time with seconds to DD/MM/YYYY HH:MM:SS
 * @param date - Date object, string, or timestamp
 * @returns Formatted date-time string (e.g., "29/11/2025 14:30:45")
 */
export const formatDateTimeWithSeconds = (
  date: Date | string | number
): string => {
  const d = new Date(date)
  const seconds = String(d.getSeconds()).padStart(2, "0")
  return `${formatDateTime(date)}:${seconds}`
}

/**
 * Format date to YYYY-MM-DD (for input fields)
 * @param date - Date object, string, or timestamp
 * @returns Formatted date string (e.g., "2025-11-29")
 */
export const formatDateForInput = (date: Date | string | number): string => {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${year}-${month}-${day}`
}

/**
 * Get relative time (e.g., "منذ 5 دقائق", "منذ ساعتين")
 * @param date - Date object, string, or timestamp
 * @returns Relative time string in Arabic
 */
export const getRelativeTime = (date: Date | string | number): string => {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "الآن"
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`
  if (diffHours < 24) return `منذ ${diffHours} ساعة`
  if (diffDays < 7) return `منذ ${diffDays} يوم`

  return formatDate(date)
}

/**
 * Format date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range string (e.g., "01/11/2025 - 29/11/2025")
 */
export const formatDateRange = (
  startDate: Date | string | number,
  endDate: Date | string | number
): string => {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

/**
 * Check if date is today
 * @param date - Date to check
 * @returns True if date is today
 */
export const isToday = (date: Date | string | number): boolean => {
  const d = new Date(date)
  const today = new Date()
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
}

/**
 * Check if date is yesterday
 * @param date - Date to check
 * @returns True if date is yesterday
 */
export const isYesterday = (date: Date | string | number): boolean => {
  const d = new Date(date)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  )
}

/**
 * Get day name in Arabic
 * @param date - Date object, string, or timestamp
 * @returns Day name in Arabic (e.g., "الجمعة")
 */
export const getDayName = (date: Date | string | number): string => {
  const d = new Date(date)
  const days = [
    "الأحد",
    "الاثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ]
  return days[d.getDay()]
}

/**
 * Get month name in Arabic
 * @param date - Date object, string, or timestamp
 * @returns Month name in Arabic (e.g., "نوفمبر")
 */
export const getMonthName = (date: Date | string | number): string => {
  const d = new Date(date)
  const months = [
    "يناير",
    "فبراير",
    "مارس",
    "إبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ]
  return months[d.getMonth()]
}

/**
 * Format date with day and month names
 * @param date - Date object, string, or timestamp
 * @returns Formatted date string (e.g., "الجمعة 29 نوفمبر 2025")
 */
export const formatDateWithNames = (date: Date | string | number): string => {
  const d = new Date(date)
  const day = d.getDate()
  return `${getDayName(date)} ${day} ${getMonthName(date)} ${d.getFullYear()}`
}
