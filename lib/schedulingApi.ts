// src/lib/schedulingApi.ts
import { BACKEND_URL } from "./api-config";

type DayKey = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
const DAY_KEYS: DayKey[] = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

export interface UIAppointmentType {
    id: string;
    name: string;
    duration: number;
    price?: number;
    description?: string;
    category: string;
}

export interface UISpecialty {
    id?: string | number;
    name: string;
}

export type UIAvailability = Record<DayKey, { isWorking: boolean; startTime: string; endTime: string }>;

export interface UIStaffMember {
    id: string;
    name: string;
    role: string;
    specialties: UISpecialty[];
    availability: UIAvailability;
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
    DAY_KEYS.forEach(k => (obj[k] = { isWorking: false, startTime: "09:00", endTime: "17:00" }));
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
    specialties: { id?: number; name: string }[];
    availability: StaffAvailabilityDTO[];
    createdAt?: string;
    updatedAt?: string;
};

export function staffFromDTO(d: StaffDTO): UIStaffMember {
    // map array availability -> per-day object
    const avail = emptyWeek();
    (d.availability || []).forEach(a => {
        const key = dayOfWeekToKey(a.dayOfWeek);
        avail[key] = {
            isWorking: !!a.isActive,
            startTime: a.startTime ?? "09:00",
            endTime: a.endTime ?? "17:00",
        };
    });

    return {
        id: String(d.id),
        name: d.name,
        role: d.role,
        specialties: (d.specialties ?? []).map(s => ({ id: s.id, name: s.name })),
        availability: avail,
    };
}

export function staffToDTO(u: Partial<UIStaffMember>): Partial<StaffDTO> {
    const dto: Partial<StaffDTO> = {
        id: u.id,
        name: u.name!,
        role: u.role!,
        specialties: (u.specialties ?? []).map(s => ({ id: typeof s.id === "number" ? s.id : undefined, name: s.name })),
        availability: [],
    };

    if (u.availability) {
        dto.availability = Object.entries(u.availability).map(([k, v]) => ({
            id: null,
            staffId: 0, // server ignores on write
            dayOfWeek: keyToDayOfWeek(k as DayKey),
            isActive: !!v.isWorking,
            startTime: v.startTime,
            endTime: v.endTime,
        }));
    }
    return dto;
}

/* -------------------- Appointment Types -------------------- */

export async function getAppointmentTypes(): Promise<UIAppointmentType[]> {
    const res = await fetch(`${BACKEND_URL}/scheduling/appointment-types`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to fetch appointment types");
    const rows = await res.json();
    // Normalize field names
    return rows.map((r: any) => ({
        id: String(r.id),
        name: r.name ?? r.serviceName,
        duration: r.duration ?? r.durationMinutes,
        price: typeof r.price === "string" ? Number(r.price) : r.price,
        description: r.description ?? "",
        category: r.category ?? "General",
    }));
}

export async function addAppointmentType(payload: Partial<UIAppointmentType>): Promise<UIAppointmentType> {
    const res = await fetch(`${BACKEND_URL}/scheduling/appointment-types`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            name: payload.name,
            duration: payload.duration,
            price: payload.price ?? null,
            category: payload.category ?? null,
            description: payload.description ?? null,
        }),
    });
    if (!res.ok) throw new Error("Failed to add appointment type");
    const r = await res.json();
    return {
        id: String(r.id),
        name: r.name ?? r.serviceName,
        duration: r.duration ?? r.durationMinutes,
        price: typeof r.price === "string" ? Number(r.price) : r.price,
        description: r.description ?? "",
        category: r.category ?? "General",
    };
}

export async function updateAppointmentType(payload: Partial<UIAppointmentType>): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/scheduling/appointment-types`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
            id: payload.id,
            name: payload.name,
            duration: payload.duration,
            price: payload.price ?? null,
            category: payload.category ?? null,
            description: payload.description ?? null,
        }),
    });
    if (!res.ok) throw new Error("Failed to update appointment type");
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
        }),
    });
    if (!res.ok) throw new Error("Failed to add staff member");
    const dto: StaffDTO = await res.json();
    return staffFromDTO(dto);
}

export async function updateStaffMember(payload: Partial<UIStaffMember>): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/scheduling/staff-members`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
            id: payload.id,
            name: payload.name,
            role: payload.role,
            specialties: (payload.specialties ?? []).map(s => ({ id: s.id, name: s.name })),
            availability: staffToDTO(payload).availability, // array
        }),
    });
    if (!res.ok) throw new Error("Failed to update staff member");
}

export async function deleteStaffMember(id: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/scheduling/staff-members/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete staff member");
}
