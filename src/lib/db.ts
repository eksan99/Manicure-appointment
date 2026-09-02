import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import type { Appointment, AppointmentStatus } from "./types";

const DATA_DIR =
  process.env.DATA_DIR?.trim() || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "appointments.db");

let db: Database.Database | null = null;

function ensureSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      contact TEXT NOT NULL,
      date TEXT NOT NULL,
      slot TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_active_slot
      ON appointments(date, slot)
      WHERE status IN ('pending', 'confirmed');
  `);
}

export function getDb(): Database.Database {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  ensureSchema(db);
  return db;
}

export function getActiveBookedSlots(date: string): string[] {
  const rows = getDb()
    .prepare(
      `SELECT slot FROM appointments
       WHERE date = ? AND status IN ('pending', 'confirmed')`
    )
    .all(date) as { slot: string }[];
  return rows.map((r) => r.slot);
}

export function createAppointment(input: {
  customer_name: string;
  contact: string;
  date: string;
  slot: string;
}): Appointment {
  const result = getDb()
    .prepare(
      `INSERT INTO appointments (customer_name, contact, date, slot, status)
       VALUES (@customer_name, @contact, @date, @slot, 'pending')`
    )
    .run(input);

  return getAppointmentById(Number(result.lastInsertRowid))!;
}

export function getAppointmentById(id: number): Appointment | null {
  const row = getDb()
    .prepare(`SELECT * FROM appointments WHERE id = ?`)
    .get(id) as Appointment | undefined;
  return row ?? null;
}

export function findAppointmentsByContact(contact: string): Appointment[] {
  const normalized = contact.trim();
  if (!normalized) return [];

  return getDb()
    .prepare(
      `SELECT * FROM appointments
       WHERE contact = ?
       ORDER BY date DESC, slot DESC, id DESC
       LIMIT 20`
    )
    .all(normalized) as Appointment[];
}

export function listAppointments(filters?: {
  date?: string;
  status?: AppointmentStatus | "all";
}): Appointment[] {
  const clauses: string[] = [];
  const params: Record<string, string> = {};

  if (filters?.date) {
    clauses.push("date = @date");
    params.date = filters.date;
  }
  if (filters?.status && filters.status !== "all") {
    clauses.push("status = @status");
    params.status = filters.status;
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return getDb()
    .prepare(
      `SELECT * FROM appointments ${where}
       ORDER BY date ASC, slot ASC, id ASC`
    )
    .all(params) as Appointment[];
}

export function updateAppointmentStatus(
  id: number,
  status: AppointmentStatus
): Appointment | null {
  const existing = getAppointmentById(id);
  if (!existing) return null;

  getDb()
    .prepare(
      `UPDATE appointments
       SET status = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(status, id);

  return getAppointmentById(id);
}
