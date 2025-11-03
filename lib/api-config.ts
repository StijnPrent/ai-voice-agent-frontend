import { BACKEND_URL } from "./api";

export function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
    };
}

/* -------------------------------- Call Logs -------------------------------- */
export async function getCallPhoneNumbers(limit = 50) {
    const url = new URL(`${BACKEND_URL}/calls/phone-numbers`);
    if (typeof limit === "number" && Number.isFinite(limit)) {
        const normalisedLimit = Math.min(200, Math.max(1, Math.floor(limit)));
        url.searchParams.set("limit", String(normalisedLimit));
    }

    const res = await fetch(url.toString(), {
        headers: authHeaders(),
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch call phone numbers (status ${res.status})`);
    }

    return res.json();
}

export async function getCallsForPhoneNumber(phoneNumber: string, limit = 50) {
    if (!phoneNumber || !phoneNumber.trim()) {
        throw new Error("Phone number is required");
    }

    const url = new URL(`${BACKEND_URL}/calls/by-phone-number`);
    url.searchParams.set("phoneNumber", phoneNumber.trim());

    if (typeof limit === "number" && Number.isFinite(limit)) {
        const normalisedLimit = Math.min(200, Math.max(1, Math.floor(limit)));
        url.searchParams.set("limit", String(normalisedLimit));
    }

    const res = await fetch(url.toString(), {
        headers: authHeaders(),
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch calls for phone number (status ${res.status})`);
    }

    return res.json();
}

export async function getCallTranscript(callSid: string) {
    if (!callSid) {
        throw new Error("Call SID is required");
    }

    return fetch(`${BACKEND_URL}/calls/${encodeURIComponent(callSid)}`, {
        headers: authHeaders(),
    });
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