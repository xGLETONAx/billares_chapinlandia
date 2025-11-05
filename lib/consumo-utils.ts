// Generates codes like C-001, C-002, etc. that reset daily

interface ConsumoCounter {
  date: string
  counter: number
}

// In-memory storage for daily counters (resets on page refresh)
let dailyCounter: ConsumoCounter = {
  date: "",
  counter: 0,
}

/**
 * Generates the next consumption code for the current day
 * Format: C-001, C-002, etc.
 * Resets to C-001 each day
 */
export function generateNextConsumoCode(): string {
  const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

  // Reset counter if it's a new day
  if (dailyCounter.date !== today) {
    dailyCounter = {
      date: today,
      counter: 0,
    }
  }

  // Increment counter and generate code
  dailyCounter.counter += 1
  const paddedNumber = String(dailyCounter.counter).padStart(3, "0")

  return `C-${paddedNumber}`
}

/**
 * Gets the current counter for today (useful for testing/debugging)
 */
export function getCurrentDailyCounter(): number {
  const today = new Date().toISOString().split("T")[0]

  if (dailyCounter.date !== today) {
    return 0
  }

  return dailyCounter.counter
}

/**
 * Resets the daily counter (useful for testing)
 */
export function resetDailyCounter(): void {
  dailyCounter = {
    date: "",
    counter: 0,
  }
}

export { generateNextConsumoCode as generateDailyCode }
