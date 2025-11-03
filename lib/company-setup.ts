import { BACKEND_URL } from "@/lib/api"
import { VoiceId } from "@/enums/VoiceId"
import { ReplyStyleEnum } from "@/enums/ReplyStyleEnum"
import { ReplyStyleDescriptionEnum } from "@/enums/ReplyStyleDescriptionEnum"

export type RequiredSetupField =
  | "companyName"
  | "contactEmail"
  | "phoneNumber"
  | "address"
  | "businessHours"

export type SetupStatusIssue = RequiredSetupField | "auth" | "network" | "unknown"

export interface CompanySetupStatus {
  needsSetup: boolean
  missingFields: SetupStatusIssue[]
}

interface FetchOptions {
  bypassCache?: boolean
}

export const DEFAULT_VOICE_SETTINGS = {
  welcomePhrase: "Goeiedag, hoe kan ik u helpen?",
  talkingSpeed: 1,
  voiceId: VoiceId.Melanie,
}

const DEFAULT_REPLY_STYLE = {
  name: ReplyStyleEnum.Professional,
  description: ReplyStyleDescriptionEnum.Professional,
}

function resolveAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null
  }
  return localStorage.getItem("jwt")
}

function buildUrl(path: string, bypassCache?: boolean) {
  if (!bypassCache) {
    return `${BACKEND_URL}${path}`
  }
  const cacheBuster = `t=${Date.now()}`
  const separator = path.includes("?") ? "&" : "?"
  return `${BACKEND_URL}${path}${separator}${cacheBuster}`
}

export async function fetchCompanySetupStatus(options: FetchOptions = {}): Promise<CompanySetupStatus> {
  const token = resolveAuthToken()
  if (!token) {
    return {
      needsSetup: true,
      missingFields: ["auth"],
    }
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  }

  const { bypassCache = false } = options

  try {
    const [detailsRes, contactRes, hoursRes] = await Promise.all([
      fetch(buildUrl("/company/details", bypassCache), { headers }),
      fetch(buildUrl("/company/contact", bypassCache), { headers }),
      fetch(buildUrl("/company/hours", bypassCache), { headers }),
    ])

    const missingFields = new Set<SetupStatusIssue>()

    if (!detailsRes.ok) {
      missingFields.add("unknown")
    }
    if (!contactRes.ok) {
      missingFields.add("unknown")
    }
    if (!hoursRes.ok) {
      missingFields.add("unknown")
    }

    const details = detailsRes.ok ? await detailsRes.json() : null
    const contact = contactRes.ok ? await contactRes.json() : null
    const hours = hoursRes.ok ? await hoursRes.json() : []

    const requiredIssues: RequiredSetupField[] = []

    const hasCompanyName = typeof details?.name === "string" && details.name.trim().length > 0
    if (!hasCompanyName) {
      requiredIssues.push("companyName")
    }

    const contactEmail =
      typeof contact?.contact_email === "string" && contact.contact_email.trim().length > 0
        ? contact.contact_email
        : typeof contact?.email === "string" && contact.email.trim().length > 0
          ? contact.email
          : ""
    if (!contactEmail) {
      requiredIssues.push("contactEmail")
    }

    const hasPhone = typeof contact?.phone === "string" && contact.phone.trim().length > 0
    if (!hasPhone) {
      requiredIssues.push("phoneNumber")
    }

    const hasAddress = typeof contact?.address === "string" && contact.address.trim().length > 0
    if (!hasAddress) {
      requiredIssues.push("address")
    }

    const hasBusinessHours = Array.isArray(hours) && hours.some((item: any) => item?.isOpen)
    if (!hasBusinessHours) {
      requiredIssues.push("businessHours")
    }

    requiredIssues.forEach((issue) => missingFields.add(issue))

    return {
      needsSetup: requiredIssues.length > 0,
      missingFields: Array.from(missingFields),
    }
  } catch (error) {
    console.warn("Failed to evaluate company setup status", error)
    return {
      needsSetup: true,
      missingFields: ["network"],
    }
  }
}

export async function ensureVoiceSettingsDefaults(): Promise<void> {
  const token = resolveAuthToken()
  if (!token) {
    return
  }

  const authHeaders: HeadersInit = {
    Authorization: `Bearer ${token}`,
  }

  try {
    const voiceRes = await fetch(buildUrl("/voice-settings/settings", true), {
      headers: authHeaders,
    })

    const voicePayload = voiceRes.ok
      ? await voiceRes
          .json()
          .catch(() => null)
      : null

    const hasValidVoicePayload =
      typeof voicePayload?.voiceId === "string" &&
      typeof voicePayload?.welcomePhrase === "string" &&
      voicePayload.welcomePhrase.trim().length > 0 &&
      typeof voicePayload?.talkingSpeed === "number"

    const shouldSeedVoiceDefaults = !hasValidVoicePayload
    const shouldCreateVoiceDefaults =
      !voiceRes.ok || !voicePayload || !hasValidVoicePayload

    if (shouldSeedVoiceDefaults) {
      await fetch(`${BACKEND_URL}/voice-settings/settings`, {
        method: shouldCreateVoiceDefaults ? "POST" : "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(DEFAULT_VOICE_SETTINGS),
      })
    }

    const replyRes = await fetch(buildUrl("/voice-settings/reply-style", true), {
      headers: authHeaders,
    })

    const replyPayload = replyRes.ok
      ? await replyRes
          .json()
          .catch(() => null)
      : null

    const hasValidReplyPayload =
      typeof replyPayload?.name === "string" && replyPayload.name.trim().length > 0

    const shouldSeedReplyDefaults = !hasValidReplyPayload
    const shouldCreateReplyDefaults =
      !replyRes.ok || !replyPayload || !hasValidReplyPayload

    if (shouldSeedReplyDefaults) {
      await fetch(`${BACKEND_URL}/voice-settings/reply-style`, {
        method: shouldCreateReplyDefaults ? "POST" : "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(DEFAULT_REPLY_STYLE),
      })
    }
  } catch (error) {
    console.warn("Failed to ensure default voice settings", error)
  }
}
