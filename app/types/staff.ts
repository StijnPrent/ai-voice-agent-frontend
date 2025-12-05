import type { UIAvailability } from "@/lib/schedulingApi"

export interface NewStaffMemberForm {
    name: string
    role: string
    specialties: string
    availability: UIAvailability
    googleCalendarId: string | null
    googleCalendarSummary: string | null
}

export interface StaffDraft extends NewStaffMemberForm {
    id?: string
}
