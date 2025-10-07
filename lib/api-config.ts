export const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3002";

export function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
    };
}

/* ----------------------------- Appointment Types ----------------------------- */
export async function getAppointmentTypes() {
    const res = await fetch(`${BACKEND_URL}/scheduling/appointment-types`, {
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch appointment types");
    return res.json();
}

export async function addAppointmentType(payload: any) {
    const res = await fetch(`${BACKEND_URL}/scheduling/appointment-types`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to add appointment type");
    return res.json();
}

export async function updateAppointmentType(payload: any) {
    const res = await fetch(`${BACKEND_URL}/scheduling/appointment-types`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update appointment type");
}

export async function deleteAppointmentType(id: string) {
    const res = await fetch(`${BACKEND_URL}/scheduling/appointment-types/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete appointment type");
}

/* --------------------------------- Staff ---------------------------------- */
export async function getStaffMembers() {
    const res = await fetch(`${BACKEND_URL}/scheduling/staff-members`, {
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch staff members");
    return res.json();
}

export async function addStaffMember(payload: any) {
    const res = await fetch(`${BACKEND_URL}/scheduling/staff-members`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to add staff member");
    return res.json();
}

export async function updateStaffMember(payload: any) {
    const res = await fetch(`${BACKEND_URL}/scheduling/staff-members`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update staff member");
}

export async function deleteStaffMember(id: string) {
    const res = await fetch(`${BACKEND_URL}/scheduling/staff-members/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete staff member");
}