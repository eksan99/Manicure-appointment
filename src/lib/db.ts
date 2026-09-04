import fs from "fs";
import path from "path";
import { createClient, type Client } from "@libsql/client";
import type { Appointment, AppointmentStatus } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

let client: Client | null = null;
let schemaPromise: Promise<void> | null = null;

function getClient(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url) {
    client = authToken ? createClient({ url, authToken }) : createClient({ url });
  } else {
    // Local development fallback: a plain libSQL file in ./data.
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    client = createClient({ url: "file:./data/local.db" });
  }

  return client;
}

function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const db = getClient();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS appointments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_name TEXT NOT NULL,
          contact TEXT NOT NULL,
          date TEXT NOT NULL,
          slot TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      await db.execute(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_active_slot
          ON appointments(date, slot)
          WHERE status IN ('pending', 'confirmed')
      `);
    })();
  }
  return schemaPromise;
}

export async function getActiveBookedSlots(date: string): Promise<string[]> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: `SELECT slot FROM appointments
          WHERE date = ? AND status IN ('pending', 'confirmed')`,
    args: [date],
  });
  return result.rows.map((row) => String(row.slot));
}

export async function createAppointment(input: {
  customer_name: string;
  contact: string;
  date: string;
  slot: string;
}): Promise<Appointment> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: `INSERT INTO appointments (customer_name, contact, date, slot, status)
          VALUES (?, ?, ?, ?, 'pending')`,
    args: [input.customer_name, input.contact, input.date, input.slot],
  });

  const id = Number(result.lastInsertRowid);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Failed to create booking: no row id returned");
  }

  const appointment = await getAppointmentById(id);
  if (!appointment) {
    throw new Error("Failed to create booking");
  }
  return appointment;
}

export async function getAppointmentById(id: number): Promise<Appointment | null> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: `SELECT * FROM appointments WHERE id = ?`,
    args: [id],
  });
  return (result.rows[0] as unknown as Appointment) ?? null;
}

export async function findAppointmentsByContact(
  contact: string
): Promise<Appointment[]> {
  await ensureSchema();
  const normalized = contact.trim();
  if (!normalized) return [];

  const result = await getClient().execute({
    sql: `SELECT * FROM appointments
          WHERE contact = ?
          ORDER BY date DESC, slot DESC, id DESC
          LIMIT 20`,
    args: [normalized],
  });
  return result.rows as unknown as Appointment[];
}

export async function listAppointments(filters?: {
  date?: string;
  status?: AppointmentStatus | "all";
}): Promise<Appointment[]> {
  await ensureSchema();

  const clauses: string[] = [];
  const args: string[] = [];

  if (filters?.date) {
    clauses.push("date = ?");
    args.push(filters.date);
  }
  if (filters?.status && filters.status !== "all") {
    clauses.push("status = ?");
    args.push(filters.status);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await getClient().execute({
    sql: `SELECT * FROM appointments ${where}
          ORDER BY date ASC, slot ASC, id ASC`,
    args,
  });
  return result.rows as unknown as Appointment[];
}

export async function updateAppointmentStatus(
  id: number,
  status: AppointmentStatus
): Promise<Appointment | null> {
  await ensureSchema();

  const existing = await getAppointmentById(id);
  if (!existing) return null;

  await getClient().execute({
    sql: `UPDATE appointments
          SET status = ?, updated_at = datetime('now')
          WHERE id = ?`,
    args: [status, id],
  });

  return getAppointmentById(id);
}
