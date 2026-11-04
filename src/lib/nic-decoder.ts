// Sri Lanka NIC Decoder - extracts DOB, age, gender from old (9-digit) and new (12-digit) NIC

export interface NICInfo {
  dateOfBirth: Date;
  age: number;
  gender: 'Male' | 'Female';
  valid: boolean;
  format: 'old' | 'new';
}

export function decodeNIC(nic: string): NICInfo | null {
  if (!nic) return null;
  const cleaned = nic.trim().toUpperCase();

  // Old format: 9 digits + V/X
  const oldMatch = cleaned.match(/^(\d{2})(\d{3})\d{4}[VX]$/);
  if (oldMatch) {
    const year = 1900 + parseInt(oldMatch[1], 10);
    let dayOfYear = parseInt(oldMatch[2], 10);
    let gender: 'Male' | 'Female' = 'Male';
    if (dayOfYear > 500) {
      dayOfYear -= 500;
      gender = 'Female';
    }
    const dob = dayOfYearToDate(year, dayOfYear);
    if (!dob) return null;
    return { dateOfBirth: dob, age: calcAge(dob), gender, valid: true, format: 'old' };
  }

  // New format: 12 digits
  const newMatch = cleaned.match(/^(\d{4})(\d{3})\d{5}$/);
  if (newMatch) {
    const year = parseInt(newMatch[1], 10);
    let dayOfYear = parseInt(newMatch[2], 10);
    let gender: 'Male' | 'Female' = 'Male';
    if (dayOfYear > 500) {
      dayOfYear -= 500;
      gender = 'Female';
    }
    const dob = dayOfYearToDate(year, dayOfYear);
    if (!dob) return null;
    return { dateOfBirth: dob, age: calcAge(dob), gender, valid: true, format: 'new' };
  }

  return null;
}

function dayOfYearToDate(year: number, day: number): Date | null {
  if (day < 1 || day > 366) return null;
  const d = new Date(year, 0, 1);
  d.setDate(day);
  if (d.getFullYear() !== year) return null;
  return d;
}

function calcAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}