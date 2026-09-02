export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export type Appointment = {
  id: number;
  customer_name: string;
  contact: string;
  date: string;
  slot: string;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
};

export const WEEKDAY_SLOTS = [
  "11:00",
  "12:30",
  "14:00",
  "15:30",
  "17:00",
  "18:30",
] as const;

export const SATURDAY_SLOTS = [
  "11:30",
  "13:00",
  "14:30",
  "16:00",
  "17:30",
] as const;

export const BOOKING_WINDOW_DAYS = 21;
export const SERVICE_MINUTES = 90;
