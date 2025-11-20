// src/lib/schedulingApi.ts
import { BACKEND_URL } from "./api";

type DayKey = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
const DAY_KEYS: DayKey[] = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

export interface AppointmentCategory {
    id?: number;
    name: string;
    description?: string | null;
    color?: string | null;
    [key: string]: unknown;
}

export interface UIAppointmentType {
    id: string;
    name: string;
    duration: number;
    price?: number;
    description?: string;
    categoryId?: number | null;
    category?: AppointmentCategory | null;
}

export type AppointmentTypeForm = Partial<UIAppointmentType> & {
    newCategoryName?: string;
};

export interface UISpecialty {
    id?: string | number;
    name: string;
}

export interface UITimeBlock {
    startTime: string;
    endTime: string;
}

export type UIAvailability = Record<DayKey, { isWorking: boolean; blocks: UITimeBlock[] }>;

export interface UIStaffMember {
    id: string;
    name: string;
    role: string;
    specialties: UISpecialty[];
    availability: UIAvailability;
    googleCalendarId: string | null;
    googleCalendarSummary: string | null;
    phorestStaffId?: string | null;
    // no isActive on model; compute as: Object.values(availability).some(d => d.isWorking)
}

/* ---------------------- Helpers ---------------------- */

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
    };
}

// Build an empty 7-day availability object
export function emptyWeek(): UIAvailability {
    const obj = {} as UIAvailability;
    DAY_KEYS.forEach(k => (obj[k] = { isWorking: false, blocks: [{ startTime: "09:00", endTime: "17:00" }] }));
    return obj;
}

function dayOfWeekToKey(n: number): DayKey {
    return DAY_KEYS[((n % 7) + 7) % 7];
}
function keyToDayOfWeek(k: DayKey): number {
    return DAY_KEYS.indexOf(k);
}

/* ------------- DTO <-> UI mapping for Staff ------------- */

// DTO coming from backend (StaffMemberModel.toJSON())
type StaffAvailabilityDTO = {
    id: number | null;
    staffId: number;
    dayOfWeek: number;
    isActive: boolean;
    startTime: string | null;
    endTime: string | null;
};
type StaffDTO = {
    id: number | string;
    companyId: string;
    name: string;
    role: string;
    googleCalendarId?: string | null;
    googleCalendarSummary?: string | null;
    phorestStaffId?: string | null;
    specialties: { id?: number; name: string }[];
    availability: StaffAvailabilityDTO[];
    createdAt?: string;
    updatedAt?: string;
};

export function staffFromDTO(d: StaffDTO): UIStaffMember {
    // map array availability -> per-day object with time blocks
    const avail = emptyWeek();
    (d.availability || []).forEach(a => {
        const key = dayOfWeekToKey(a.dayOfWeek);
        if (!a.isActive) {
            if (!avail[key]) {
                avail[key] = { isWorking: false, blocks: [{ startTime: "09:00", endTime: "17:00" }] };
            } else {
                avail[key].isWorking = false;
            }
            return;
        }
        const block = {
            startTime: a.startTime ?? "09:00",
            endTime: a.endTime ?? "17:00",
        };
        if (!avail[key]) {
            avail[key] = { isWorking: true, blocks: [block] };
        } else {
            const entry = avail[key];
            entry.isWorking = true;
            entry.blocks = [...(entry.blocks ?? []), block];
        }
    });

    return {
        id: String(d.id),
        name: d.name,
        role: d.role,
        specialties: (d.specialties ?? []).map(s => ({ id: s.id, name: s.name })),
        availability: avail,
        googleCalendarId: d.googleCalendarId ?? null,
        googleCalendarSummary: d.googleCalendarSummary ?? null,
        phorestStaffId: d.phorestStaffId ?? null,
    };
}

export function staffToDTO(u: Partial<UIStaffMember>): Partial<StaffDTO> {
    const dto: Partial<StaffDTO> = {
        id: u.id,
        name: u.name!,
        role: u.role!,
        specialties: (u.specialties ?? []).map(s => ({ id: typeof s.id === "number" ? s.id : undefined, name: s.name })),
        availability: [],
        googleCalendarId: u.googleCalendarId ?? null,
        googleCalendarSummary: u.googleCalendarSummary ?? null,
        phorestStaffId: u.phorestStaffId ?? null,
    };

    if (u.availability) {
        dto.availability = [];
        Object.entries(u.availability).forEach(([k, v]) => {
            const dayOfWeek = keyToDayOfWeek(k as DayKey);
            if (!v.isWorking || (v.blocks ?? []).length === 0) {
                dto.availability!.push({
                    id: null,
                    staffId: 0,
                dayOfWeek,
                    isActive: false,
                    startTime: null,
                    endTime: null,
                });
                return;
            }
            (v.blocks ?? []).forEach(block => {
                dto.availability!.push({
                    id: null,
                    staffId: 0,
                    dayOfWeek,
                    isActive: true,
                    startTime: block.startTime,
                    endTime: block.endTime,
                });
            });
        });
    }
    return dto;
}

/* -------------------- Appointment Types -------------------- */

function parseCategoryId(raw: unknown): number | null {
    if (typeof raw === "number") return raw;
    if (typeof raw === "string" && raw.trim()) {
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function normalizeCategory(raw: unknown, fallbackId?: number | null): AppointmentCategory | null {
    if (!raw && fallbackId == null) return null;
    if (raw && typeof raw === "object") {
        const candidate = raw as Record<string, unknown>;
        const id = parseCategoryId(candidate.id ?? fallbackId ?? null);
        const computedName =
            typeof candidate.name === "string" ? candidate.name :
            typeof candidate.label === "string" ? candidate.label :
            typeof candidate.title === "string" ? candidate.title :
            typeof candidate.displayName === "string" ? candidate.displayName :
            fallbackId != null ? "Overig" :
            "Overig";
        return {
            ...candidate,
            id: id ?? undefined,
            name: computedName,
            description: typeof candidate.description === "string" ? candidate.description : candidate.description ?? null,
            color: typeof candidate.color === "string" ? candidate.color : candidate.color ?? null,
        } as AppointmentCategory;
    }
    if (typeof raw === "string" && raw.trim()) {
        return {
            id: fallbackId ?? undefined,
            name: raw.trim(),
        };
    }
    if (fallbackId != null) {
        return {
            id: fallbackId,
            name: "Overig",
        };
    }
    return null;
}

function normalizeAppointmentType(row: any): UIAppointmentType {
    const categoryId =
        parseCategoryId(row.categoryId ?? row.category?.id ?? null);
    const rawCategory = row.category ?? row.categoryLabel ?? row.categoryName ?? null;
    const category = normalizeCategory(rawCategory, categoryId ?? null);
    return {
        id: String(row.id),
        name: row.name ?? row.serviceName ?? "",
        duration: row.duration ?? row.durationMinutes ?? 0,
        price: typeof row.price === "string" ? Number(row.price) : row.price,
        description: row.description ?? "",
        categoryId,
        category,
    };
}

function appendCategoryFields(body: Record<string, unknown>, payload: AppointmentTypeForm) {
    const newCategory = payload.newCategoryName?.trim();
    if (newCategory) {
        body.newCategoryName = newCategory;
        return;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "categoryId")) {
        body.categoryId = payload.categoryId;
    }
}

export async function getAppointmentTypes(): Promise<UIAppointmentType[]> {
    const res = await fetch(`${BACKEND_URL}/scheduling/appointment-types`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to fetch appointment types");
    const rows = await res.json();
    // Normalize field names
    return rows.map((r: any) => normalizeAppointmentType(r));
}

export async function addAppointmentType(payload: AppointmentTypeForm): Promise<UIAppointmentType> {
    const body: Record<string, unknown> = {
        name: payload.name,
        duration: payload.duration,
        price: payload.price ?? null,
        description: payload.description ?? null,
    };
    appendCategoryFields(body, payload);
    console.log("Adding appointment type with body:", body);
    const res = await fetch(`${BACKEND_URL}/scheduling/appointment-types`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Failed to add appointment type");
    const r = await res.json();
    return normalizeAppointmentType(r);
}

export async function updateAppointmentType(payload: AppointmentTypeForm & { id?: string }): Promise<UIAppointmentType> {
    if (!payload.id) throw new Error("Missing appointment type id");
    const body: Record<string, unknown> = {
        id: payload.id,
        name: payload.name,
        duration: payload.duration,
        price: payload.price ?? null,
        description: payload.description ?? null,
    };
    appendCategoryFields(body, payload);
    const res = await fetch(`${BACKEND_URL}/scheduling/appointment-types`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Failed to update appointment type");
    const r = await res.json();
    return normalizeAppointmentType(r);
}

export async function getAppointmentCategories(): Promise<AppointmentCategory[]> {
    const res = await fetch(`${BACKEND_URL}/scheduling/appointment-categories`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to fetch appointment categories");
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    return rows
        .map((row: any) => normalizeCategory(row, parseCategoryId(row.id ?? row.categoryId ?? null)))
        .filter((cat): cat is AppointmentCategory => cat !== null);
}

export async function deleteAppointmentType(id: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/scheduling/appointment-types/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete appointment type");
}

/* --------------------------- Staff --------------------------- */

export async function getStaffMembers(): Promise<UIStaffMember[]> {
    const res = await fetch(`${BACKEND_URL}/scheduling/staff-members`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to fetch staff members");
    const rows: StaffDTO[] = await res.json();
    return rows.map(staffFromDTO);
}

export async function addStaffMember(payload: Partial<UIStaffMember>): Promise<UIStaffMember> {
    const res = await fetch(`${BACKEND_URL}/scheduling/staff-members`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            name: payload.name,
            role: payload.role,
            specialties: (payload.specialties ?? []).map(s => ({ name: s.name })),
            availability: staffToDTO(payload).availability, // array
            googleCalendarId: payload.googleCalendarId ?? null,
            googleCalendarSummary: payload.googleCalendarSummary ?? null,
            phorestStaffId: payload.phorestStaffId ?? null,
        }),
    });
    if (!res.ok) throw new Error("Failed to add staff member");
    const dto: StaffDTO = await res.json();
    return staffFromDTO(dto);
}

export async function updateStaffMember(payload: Partial<UIStaffMember>): Promise<UIStaffMember> {
    const res = await fetch(`${BACKEND_URL}/scheduling/staff-members`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
            id: payload.id,
            name: payload.name,
            role: payload.role,
            specialties: (payload.specialties ?? []).map(s => ({ id: s.id, name: s.name })),
            availability: staffToDTO(payload).availability, // array
            googleCalendarId: payload.googleCalendarId ?? null,
            googleCalendarSummary: payload.googleCalendarSummary ?? null,
            phorestStaffId: payload.phorestStaffId ?? null,
        }),
    });
    if (!res.ok) throw new Error("Failed to update staff member");
    const dto: StaffDTO = await res.json();
    return staffFromDTO(dto);
}

export async function deleteStaffMember(id: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/scheduling/staff-members/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete staff member");
}

/* --------------------------- Google Calendars --------------------------- */

export interface GoogleCalendar {
    id: string;
    summary: string | null;
    displayName?: string | null;
    summaryOverride?: string | null;
    description?: string | null;
    timeZone?: string | null;
    primary?: boolean;
    selected?: boolean;
    accessRole?: string;
    backgroundColor?: string;
}

export async function getGoogleCalendars(): Promise<GoogleCalendar[]> {
    const res = await fetch(`${BACKEND_URL}/google/calendars`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to fetch Google calendars");
    const body = await res.json();
    const calendars = Array.isArray(body?.calendars) ? body.calendars : body;
    if (!Array.isArray(calendars)) {
        return [];
    }
    return calendars.map((c: any) => ({
        id: String(c.id),
        summary: typeof c.summary === "string" ? c.summary : null,
        displayName: typeof c.displayName === "string" ? c.displayName : null,
        summaryOverride: typeof c.summaryOverride === "string" ? c.summaryOverride : null,
        description: c.description ?? null,
        timeZone: c.timeZone ?? null,
        primary: Boolean(c.primary),
        selected: Boolean(c.selected),
        accessRole: c.accessRole,
        backgroundColor: c.backgroundColor,
    }));
}
