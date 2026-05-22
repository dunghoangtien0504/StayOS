import { Booking, Expense } from "./types";
import { startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, format } from "date-fns";

/**
 * Calculates revenue based on payments for bookings that check out within the period.
 * Accrual-based logic: Revenue is recognized when the stay is completed.
 */
export function getRevenueByPeriod(
  bookings: Booking[],
  start: Date,
  end: Date,
  propertyId?: string
): number {
  return bookings
    .filter((b) => {
      if (propertyId && b.propertyId !== propertyId) return false;
      
      // Use actualCheckOut if available, fallback to checkOut
      const checkoutDate = b.actualCheckOut || b.checkOut;
      return checkoutDate >= start && checkoutDate <= end;
    })
    .reduce((sum, b) => sum + b.amountPaid, 0);
}

/**
 * Calculates total expenses within a period.
 */
export function getExpenseByPeriod(
  expenses: Expense[],
  start: Date,
  end: Date,
  propertyId?: string
): number {
  return expenses
    .filter((e) => {
      if (propertyId && e.propertyId && e.propertyId !== propertyId) return false;
      return e.date >= start && e.date <= end;
    })
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Returns revenue and expense data for the last 12 months (or specific year).
 */
export function getYearlyStats(
  bookings: Booking[],
  expenses: Expense[],
  year: number,
  propertyId?: string
) {
  const stats = [];
  for (let month = 0; month < 12; month++) {
    const start = new Date(year, month, 1);
    const end = endOfMonth(start);
    
    const revenue = getRevenueByPeriod(bookings, start, end, propertyId);
    const expense = getExpenseByPeriod(expenses, start, end, propertyId);
    
    stats.push({
      month: month + 1,
      monthName: `T${month + 1}`,
      revenue,
      expense,
      profit: revenue - expense,
    });
  }
  return stats;
}

/**
 * Helper for last N months stats (common for charts).
 */
export function getLastNMonthsStats(
  bookings: Booking[],
  expenses: Expense[],
  n: number,
  propertyId?: string
) {
  const months = eachMonthOfInterval({
    start: subMonths(startOfMonth(new Date()), n - 1),
    end: startOfMonth(new Date()),
  });

  return months.map((month) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    
    const revenue = getRevenueByPeriod(bookings, start, end, propertyId);
    const expense = getExpenseByPeriod(expenses, start, end, propertyId);
    
    return {
      name: format(month, 'MM/yy'),
      revenue,
      expense,
      profit: revenue - expense,
    };
  });
}
