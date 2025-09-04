/**
 * Calculate the number of days from campaign start date to current date or end date
 * @param startDate - Campaign start date
 * @param endDate - Campaign end date (optional)
 * @param status - Campaign status to determine if counting should stop
 * @returns Number of days ongoing, or null if calculation is not applicable
 */
export function calculateDaysOngoing(
  startDate: string | Date | null,
  endDate: string | Date | null,
  status?: string
): number | null {
  if (!startDate) return null;
  
  const start = new Date(startDate);
  const now = new Date();
  
  // If campaign is completed, cancelled, or closed, count up to end date
  const isCompleted = status && ['completed', 'cancelled', 'closed_with_refund'].includes(status);
  
  let endPoint: Date;
  if (isCompleted && endDate) {
    endPoint = new Date(endDate);
  } else {
    endPoint = now;
  }
  
  // Calculate days difference
  const timeDiff = endPoint.getTime() - start.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  // Return null if start date is in the future or if calculation doesn't make sense
  if (daysDiff < 0) return null;
  
  return daysDiff;
}

/**
 * Format the days ongoing display text
 * @param days - Number of days ongoing
 * @param status - Campaign status
 * @returns Formatted string for display
 */
export function formatDaysOngoing(days: number | null, status?: string): string {
  if (days === null) return '';
  
  const isCompleted = status && ['completed', 'cancelled', 'closed_with_refund'].includes(status);
  
  if (isCompleted) {
    return ` (${days} days from start date)`;
  } else {
    return ` (${days} days from start date and ongoing)`;
  }
}
