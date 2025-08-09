import {ReplyStyleEnum} from "@/enums/ReplyStyleEnum";
import {ReplyStyleDescriptionEnum} from "@/enums/ReplyStyleDescriptionEnum";

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"

export interface Integration {
    id: string
    name: string
    description: string
    category: string
    logo: string
    status: "connected" | "disconnected" | "error"
    lastSync: string | null
}

export interface VoiceSettings {
    id: number,
    companyId: number,
    welcomePhrase: string,
    talkingSpeed: number,
    voiceId: string,
    createdAt: Date,
    updatedAt: Date
}

export interface ReplyStyle {
    id: number,
    companyId: number,
    name: ReplyStyleEnum,
    description: ReplyStyleDescriptionEnum,
    createdAt: Date,
    updatedAt: Date,
}

export interface Update {
    update: string;
    createdAt: Date;
    status: string;
}
export interface OperatingDays extends Record<DayKey, boolean> {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
}

export interface CompanyData {
    name: string
    industry: string
    size: string
    website: string
    phone: string
    email: string
    address: string
    description: string
    founded: string
    openingTime: string
    closingTime: string
    operatingDays: OperatingDays
}

export interface CustomInfoField {
    id: string
    value: string
    persistedId?: number
}