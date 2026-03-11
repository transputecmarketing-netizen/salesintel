/**
 * Get the current fiscal quarter based on a fiscal year end month.
 * Most companies use calendar year (Dec end) or Jan/Mar/Jun/Sep fiscal years.
 */
export function getFiscalQuarter(date: Date = new Date(), fiscalYearEndMonth: number = 12): {
  quarter: number;
  fiscalYear: number;
  label: string;
  startDate: Date;
  endDate: Date;
} {
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();

  // Calculate fiscal month (1 = first month of fiscal year)
  const fiscalStartMonth = (fiscalYearEndMonth % 12) + 1;
  let fiscalMonth = month - fiscalStartMonth + 1;
  if (fiscalMonth <= 0) fiscalMonth += 12;

  const quarter = Math.ceil(fiscalMonth / 3);

  // Fiscal year
  let fiscalYear = year;
  if (month < fiscalStartMonth) {
    fiscalYear = year; // Same calendar year
  } else {
    fiscalYear = fiscalYearEndMonth === 12 ? year : year + 1;
  }

  // Quarter start and end dates
  const quarterStartFiscalMonth = (quarter - 1) * 3 + 1;
  let startMonth = ((fiscalStartMonth - 1 + quarterStartFiscalMonth - 1) % 12) + 1;
  let startYear = year;
  if (startMonth > month && fiscalStartMonth > 1) startYear = year - 1;
  if (fiscalStartMonth > 1 && startMonth < fiscalStartMonth && month >= fiscalStartMonth) {
    startYear = year;
  }

  const startDate = new Date(startYear, startMonth - 1, 1);
  const endDate = new Date(startYear, startMonth + 2, 0); // Last day of 3rd month

  return {
    quarter,
    fiscalYear,
    label: `FY${fiscalYear} Q${quarter}`,
    startDate,
    endDate,
  };
}

/**
 * Detect likely fiscal year end month from company filings or earnings dates.
 */
export function detectFiscalYearEnd(earningsDates: Date[]): number {
  if (earningsDates.length === 0) return 12; // Default to calendar year

  // Group by month and find the most common quarter-end month
  const monthCounts: Record<number, number> = {};
  for (const date of earningsDates) {
    const month = date.getMonth() + 1;
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  }

  // Earnings reports come ~1-2 months after quarter end
  // So find the most common reporting month and subtract 1-2
  const sortedMonths = Object.entries(monthCounts)
    .sort((a, b) => b[1] - a[1]);

  if (sortedMonths.length === 0) return 12;

  // Typical quarterly patterns
  const reportMonth = parseInt(sortedMonths[0][0]);
  const quarterEndMonth = ((reportMonth - 2 + 11) % 12) + 1;

  // Map to fiscal year end
  const fyEndMonth = ((quarterEndMonth + 2) % 12) || 12;

  return fyEndMonth;
}

/**
 * Get the start and end dates for a calendar quarter.
 */
export function getCalendarQuarter(year: number, quarter: number): {
  start: Date;
  end: Date;
  label: string;
} {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0); // Last day of quarter

  return {
    start,
    end,
    label: `Q${quarter} ${year}`,
  };
}

/**
 * Get the current calendar quarter.
 */
export function getCurrentQuarter(date: Date = new Date()): {
  year: number;
  quarter: number;
  label: string;
} {
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  return {
    year: date.getFullYear(),
    quarter,
    label: `Q${quarter} ${date.getFullYear()}`,
  };
}

/**
 * Calculate the number of business days between two dates.
 */
export function businessDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Add business days to a date.
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;

  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }

  return result;
}

/**
 * Get a relative date description for display.
 */
export function getRelativeDateLabel(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return 'Last week';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return 'Last month';
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  if (diffDays < 730) return 'Last year';
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Determine the optimal outreach window based on business patterns.
 * Avoids Mondays (catch-up day) and Fridays (wind-down).
 * Prefers Tuesday-Thursday, 9-11 AM local time.
 */
export function getNextOutreachWindow(
  fromDate: Date = new Date(),
  timezone: string = 'America/New_York'
): Date {
  const result = new Date(fromDate);

  // Move to next business day if weekend
  while (result.getDay() === 0 || result.getDay() === 6) {
    result.setDate(result.getDate() + 1);
  }

  // Skip Monday and Friday
  if (result.getDay() === 1) result.setDate(result.getDate() + 1); // Mon -> Tue
  if (result.getDay() === 5) result.setDate(result.getDate() + 4); // Fri -> Tue

  // Set to 9:30 AM
  result.setHours(9, 30, 0, 0);

  return result;
}

/**
 * Parse a date string in various formats and return a Date.
 */
export function parseFlexibleDate(input: string): Date | null {
  // Try ISO format first
  const isoDate = new Date(input);
  if (!isNaN(isoDate.getTime())) return isoDate;

  // Try common US format: MM/DD/YYYY
  const usMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    return new Date(parseInt(usMatch[3]), parseInt(usMatch[1]) - 1, parseInt(usMatch[2]));
  }

  // Try: YYYY-MM-DD
  const isoShortMatch = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoShortMatch) {
    return new Date(parseInt(isoShortMatch[1]), parseInt(isoShortMatch[2]) - 1, parseInt(isoShortMatch[3]));
  }

  // Try: "Month DD, YYYY"
  const longMatch = input.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (longMatch) {
    const parsed = new Date(`${longMatch[1]} ${longMatch[2]}, ${longMatch[3]}`);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

/**
 * Format a date range for display.
 */
export function formatDateRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString('en-US', opts)} - ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}, ${end.getFullYear()}`;
  }

  const fullOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${start.toLocaleDateString('en-US', fullOpts)} - ${end.toLocaleDateString('en-US', fullOpts)}`;
}
