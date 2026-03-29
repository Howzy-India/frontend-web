export interface AttendanceRecord {
  id: string;
  userEmail: string;
  date: string;
  punchInTime: string | null;
  punchOutTime: string | null;
  punchInLocation: { lat: number; lng: number } | null;
  punchOutLocation: { lat: number; lng: number } | null;
  punchInPhoto: string | null;
  punchOutPhoto: string | null;
  status: 'Working' | 'Completed';
}

export interface LocationLog {
  id: string;
  userEmail: string;
  timestamp: string;
  lat: number;
  lng: number;
}

export const getAttendanceRecords = (): AttendanceRecord[] => {
  const data = localStorage.getItem('howzy_attendance');
  return data ? JSON.parse(data) : [];
};

export const saveAttendanceRecord = (record: AttendanceRecord) => {
  const records = getAttendanceRecords();
  const existingIndex = records.findIndex(r => r.id === record.id);
  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.push(record);
  }
  localStorage.setItem('howzy_attendance', JSON.stringify(records));
};

export const getLocationLogs = (): LocationLog[] => {
  const data = localStorage.getItem('howzy_location_logs');
  return data ? JSON.parse(data) : [];
};

export const saveLocationLog = (log: LocationLog) => {
  const logs = getLocationLogs();
  logs.push(log);
  localStorage.setItem('howzy_location_logs', JSON.stringify(logs));
};

export const getTodayAttendance = (userEmail: string): AttendanceRecord | null => {
  const records = getAttendanceRecords();
  const today = new Date().toISOString().split('T')[0];
  return records.find(r => r.userEmail === userEmail && r.date === today) || null;
};
