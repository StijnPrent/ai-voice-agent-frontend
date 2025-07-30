import {ReplyStyleEnum} from "@/enums/ReplyStyleEnum";
import {ReplyStyleDescriptionEnum} from "@/enums/ReplyStyleDescriptionEnum";

export interface Integration {
    key: string
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