/**
 * Rate Limiting Service
 * Limits guest users to 5 scans per day
 */

const STORAGE_KEY = 'bitebuddy-scan-count';
const MAX_GUEST_SCANS = 5;

interface ScanRecord {
  count: number;
  date: string; // YYYY-MM-DD format
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current scan record from localStorage
 */
function getScanRecord(): ScanRecord {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { count: 0, date: getTodayDate() };
    }
    
    const record = JSON.parse(stored) as ScanRecord;
    
    // Reset if it's a new day
    if (record.date !== getTodayDate()) {
      return { count: 0, date: getTodayDate() };
    }
    
    return record;
  } catch {
    return { count: 0, date: getTodayDate() };
  }
}

/**
 * Save scan record to localStorage
 */
function saveScanRecord(record: ScanRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch (error) {
    console.error('Failed to save scan record:', error);
  }
}

/**
 * Check if user can scan (for guests only)
 */
export function canGuestScan(): boolean {
  const record = getScanRecord();
  return record.count < MAX_GUEST_SCANS;
}

/**
 * Get remaining scans for guest
 */
export function getRemainingScans(): number {
  const record = getScanRecord();
  return Math.max(0, MAX_GUEST_SCANS - record.count);
}

/**
 * Increment scan count (call after successful scan)
 */
export function incrementScanCount(): void {
  const record = getScanRecord();
  record.count += 1;
  saveScanRecord(record);
}

/**
 * Get scan limit info for display
 */
export function getScanLimitInfo(): {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
} {
  const record = getScanRecord();
  
  // Calculate reset time (midnight local time)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  return {
    used: record.count,
    limit: MAX_GUEST_SCANS,
    remaining: Math.max(0, MAX_GUEST_SCANS - record.count),
    resetsAt: tomorrow.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  };
}

/**
 * Check if user is a guest
 */
export function isGuestUser(): boolean {
  const userType = localStorage.getItem('userType');
  return userType === 'gast';
}
