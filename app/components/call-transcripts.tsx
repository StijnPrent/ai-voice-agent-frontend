"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  Clock,
  Loader2,
  PhoneCall,
  RefreshCcw,
  Search,
} from "lucide-react"

import { BACKEND_URL, authHeaders } from "@/lib/api-config"
import { cn } from "@/lib/utils"

interface PhoneNumberEntry {
  number: string
  lastCallSid?: string | null
  lastSeenAt?: string | null
  totalCalls?: number | null
}

interface CallSummary {
  callSid: string
  fromNumber: string
  startedAt: string | null
  endedAt: string | null
  vapiCallId?: string | null
}

interface CallMessage {
  role: string
  content: string
  startTime: number | null
}

interface CallTranscriptData {
  callSid: string
  fromNumber: string
  vapiCallId: string | null
  startedAt: string | null
  endedAt: string | null
  messages: CallMessage[]
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function normalisePhoneNumbers(payload: unknown): PhoneNumberEntry[] {
  const source = Array.isArray((payload as any)?.phoneNumbers)
    ? (payload as any).phoneNumbers
    : Array.isArray(payload)
      ? payload
      : []

  const entries: PhoneNumberEntry[] = []

  for (const item of source) {
    if (isNonEmptyString(item)) {
      entries.push({ number: item.trim() })
      continue
    }

    if (item && typeof item === "object") {
      const phoneNumber =
        isNonEmptyString((item as any).phoneNumber)
          ? (item as any).phoneNumber
          : isNonEmptyString((item as any).number)
            ? (item as any).number
            : undefined

      if (!phoneNumber) {
        continue
      }

      const normalised: PhoneNumberEntry = {
        number: phoneNumber.trim(),
      }

      const lastCallSid =
        isNonEmptyString((item as any).lastCallSid)
          ? (item as any).lastCallSid
          : isNonEmptyString((item as any).callSid)
            ? (item as any).callSid
            : undefined

      if (lastCallSid) {
        normalised.lastCallSid = lastCallSid
      }

      const lastSeenAt =
        isNonEmptyString((item as any).lastSeenAt)
          ? (item as any).lastSeenAt
          : isNonEmptyString((item as any).startedAt)
            ? (item as any).startedAt
            : isNonEmptyString((item as any).createdAt)
              ? (item as any).createdAt
              : undefined

      if (lastSeenAt) {
        normalised.lastSeenAt = lastSeenAt
      }

      const totalCalls =
        typeof (item as any).totalCalls === "number"
          ? (item as any).totalCalls
          : typeof (item as any).count === "number"
            ? (item as any).count
            : undefined

      if (typeof totalCalls === "number" && Number.isFinite(totalCalls)) {
        normalised.totalCalls = totalCalls
      }

      entries.push(normalised)
    }
  }

  const uniqueByNumber = new Map<string, PhoneNumberEntry>()
  for (const entry of entries) {
    if (!uniqueByNumber.has(entry.number)) {
      uniqueByNumber.set(entry.number, entry)
      continue
    }
    const existing = uniqueByNumber.get(entry.number)!
    uniqueByNumber.set(entry.number, {
      number: entry.number,
      lastCallSid: entry.lastCallSid ?? existing.lastCallSid,
      lastSeenAt: entry.lastSeenAt ?? existing.lastSeenAt,
      totalCalls: entry.totalCalls ?? existing.totalCalls,
    })
  }

  return Array.from(uniqueByNumber.values())
}

function normaliseCallSummaries(payload: unknown, fallbackNumber: string): CallSummary[] {
  const source = Array.isArray((payload as any)?.calls)
    ? (payload as any).calls
    : Array.isArray(payload)
      ? payload
      : []

  const summaries: CallSummary[] = []

  for (const item of source) {
    if (!item || typeof item !== "object") continue

    const callSid =
      isNonEmptyString((item as any).callSid)
        ? (item as any).callSid
        : isNonEmptyString((item as any).sid)
          ? (item as any).sid
          : undefined

    if (!callSid) continue

    const fromNumber =
      isNonEmptyString((item as any).fromNumber)
        ? (item as any).fromNumber
        : isNonEmptyString((item as any).from)
          ? (item as any).from
          : fallbackNumber

    const startedAt =
      isNonEmptyString((item as any).startedAt)
        ? (item as any).startedAt
        : isNonEmptyString((item as any).startTime)
          ? (item as any).startTime
          : null

    const endedAt =
      isNonEmptyString((item as any).endedAt)
        ? (item as any).endedAt
        : isNonEmptyString((item as any).endTime)
          ? (item as any).endTime
          : null

    const vapiCallId =
      isNonEmptyString((item as any).vapiCallId)
        ? (item as any).vapiCallId
        : isNonEmptyString((item as any).vapi_call_id)
          ? (item as any).vapi_call_id
          : undefined

    summaries.push({
      callSid,
      fromNumber,
      startedAt,
      endedAt,
      vapiCallId: vapiCallId ?? null,
    })
  }

  return summaries.sort((a, b) => {
    const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0
    const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0
    return bTime - aTime
  })
}

function normaliseTranscript(payload: unknown): CallTranscriptData | null {
  if (!payload || typeof payload !== "object") return null

  const callSid = isNonEmptyString((payload as any).callSid)
    ? (payload as any).callSid
    : null

  if (!callSid) return null

  const startedAt =
    isNonEmptyString((payload as any).startedAt)
      ? (payload as any).startedAt
      : null

  const endedAt =
    isNonEmptyString((payload as any).endedAt)
      ? (payload as any).endedAt
      : null

  const fromNumber =
    isNonEmptyString((payload as any).fromNumber)
      ? (payload as any).fromNumber
      : ""

  const vapiCallId =
    isNonEmptyString((payload as any).vapiCallId)
      ? (payload as any).vapiCallId
      : null

  const sourceMessages = Array.isArray((payload as any).messages)
    ? (payload as any).messages
    : []

  const messages: CallMessage[] = sourceMessages
    .map((message: any) => {
      const role = isNonEmptyString(message?.role) ? message.role : "unknown"
      const contentCandidate = isNonEmptyString(message?.content)
        ? message.content
        : isNonEmptyString(message?.message)
          ? message.message
          : isNonEmptyString(message?.originalMessage)
            ? message.originalMessage
            : ""

      const startTime =
        typeof message?.startTime === "number"
          ? message.startTime
          : typeof message?.startTime === "string" && !Number.isNaN(Number(message.startTime))
            ? Number(message.startTime)
            : null

      if (!contentCandidate && startTime === null) {
        return null
      }

      return {
        role,
        content: contentCandidate,
        startTime,
      }
    })
    .filter((message): message is CallMessage => Boolean(message))
    .sort((a, b) => {
      const aValue = typeof a.startTime === "number" ? a.startTime : Number.POSITIVE_INFINITY
      const bValue = typeof b.startTime === "number" ? b.startTime : Number.POSITIVE_INFINITY
      return aValue - bValue
    })

  return {
    callSid,
    fromNumber,
    vapiCallId,
    startedAt,
    endedAt,
    messages,
  }
}

function formatDate(value: string | null, fallback = "Onbekend tijdstip") {
  if (!value) return fallback
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return fallback
  return format(parsed, "dd MMM yyyy HH:mm")
}

function formatRelative(value: string | null) {
  if (!value) return ""
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ""
  return formatDistanceToNow(parsed, { addSuffix: true })
}

function formatDuration(startedAt: string | null, endedAt: string | null) {
  if (!startedAt || !endedAt) return "Onbekende duur"
  const start = new Date(startedAt)
  const end = new Date(endedAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Onbekende duur"
  const totalMs = Math.max(0, end.getTime() - start.getTime())
  const minutes = Math.floor(totalMs / 60000)
  const seconds = Math.floor((totalMs % 60000) / 1000)
  const minutePart = minutes > 0 ? `${minutes}m ` : ""
  return `${minutePart}${seconds.toString().padStart(2, "0")}s`
}

function formatOffset(seconds: number | null) {
  if (seconds === null || Number.isNaN(seconds)) return null
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `+${mins}:${secs.toString().padStart(2, "0")}`
  }
  return `+${seconds.toFixed(1)}s`
}

const roleLabels: Record<string, string> = {
  assistant: "Agent",
  user: "Beller",
  system: "Systeem",
}

export function CallTranscripts() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberEntry[]>([])
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string | null>(null)
  const [phoneFilter, setPhoneFilter] = useState("")
  const [numbersLoading, setNumbersLoading] = useState(false)
  const [numbersError, setNumbersError] = useState<string | null>(null)

  const [callSummaries, setCallSummaries] = useState<CallSummary[]>([])
  const [callsLoading, setCallsLoading] = useState(false)
  const [callsError, setCallsError] = useState<string | null>(null)

  const [selectedCallSid, setSelectedCallSid] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<CallTranscriptData | null>(null)
  const [transcriptLoading, setTranscriptLoading] = useState(false)
  const [transcriptError, setTranscriptError] = useState<string | null>(null)

  const loadPhoneNumbers = useCallback(async () => {
    setNumbersLoading(true)
    setNumbersError(null)
    try {
      const response = await fetch(`${BACKEND_URL}/calls/phone-numbers?limit=50`, {
        headers: authHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Kon telefoonnummers niet laden (status ${response.status})`)
      }

      const payload = await response.json()
      const entries = normalisePhoneNumbers(payload).filter((entry) => entry.number.length > 0)

      setPhoneNumbers(entries)
      setSelectedPhoneNumber((prev) => {
        if (prev && entries.some((entry) => entry.number === prev)) {
          return prev
        }
        return entries[0]?.number ?? null
      })
    } catch (error: any) {
      console.error("Failed to fetch phone numbers", error)
      setNumbersError(error?.message ?? "Onbekende fout bij het ophalen van telefoonnummers")
      setPhoneNumbers([])
      setSelectedPhoneNumber(null)
    } finally {
      setNumbersLoading(false)
    }
  }, [])

  const loadCallSummaries = useCallback(
    async (phoneNumber: string) => {
      setCallsLoading(true)
      setCallsError(null)
      setCallSummaries([])
      setSelectedCallSid(null)
      setTranscript(null)
      setTranscriptError(null)

      try {
        const response = await fetch(
          `${BACKEND_URL}/calls?phoneNumber=${encodeURIComponent(phoneNumber)}`,
          {
            headers: authHeaders(),
          },
        )

        if (response.status === 404) {
          const fallback = phoneNumbers.find((entry) => entry.number === phoneNumber)
          if (fallback?.lastCallSid) {
            setCallSummaries([
              {
                callSid: fallback.lastCallSid,
                fromNumber: phoneNumber,
                startedAt: fallback.lastSeenAt ?? null,
                endedAt: null,
                vapiCallId: null,
              },
            ])
            setSelectedCallSid(fallback.lastCallSid)
          } else {
            setCallsError("Geen gesprekken gevonden voor dit nummer")
          }
          return
        }

        if (!response.ok) {
          throw new Error(`Kon gesprekken niet laden (status ${response.status})`)
        }

        const payload = await response.json()
        const summaries = normaliseCallSummaries(payload, phoneNumber)

        if (summaries.length === 0) {
          const fallback = phoneNumbers.find((entry) => entry.number === phoneNumber)
          if (fallback?.lastCallSid) {
            summaries.push({
              callSid: fallback.lastCallSid,
              fromNumber: phoneNumber,
              startedAt: fallback.lastSeenAt ?? null,
              endedAt: null,
              vapiCallId: null,
            })
          }
        }

        setCallSummaries(summaries)
        setSelectedCallSid(summaries[0]?.callSid ?? null)
      } catch (error: any) {
        console.error("Failed to fetch call summaries", error)
        setCallsError(error?.message ?? "Onbekende fout bij het ophalen van gesprekken")
      } finally {
        setCallsLoading(false)
      }
    },
    [phoneNumbers],
  )

  const loadTranscript = useCallback(async (callSid: string) => {
    setTranscriptLoading(true)
    setTranscriptError(null)
    try {
      const response = await fetch(`${BACKEND_URL}/calls/${encodeURIComponent(callSid)}`, {
        headers: authHeaders(),
      })

      if (response.status === 404) {
        setTranscript(null)
        setTranscriptError("Geen transcript gevonden voor dit gesprek")
        return
      }

      if (response.status === 409) {
        setTranscript(null)
        setTranscriptError("Er is geen transcript beschikbaar voor dit gesprek")
        return
      }

      if (!response.ok) {
        throw new Error(`Kon transcript niet ophalen (status ${response.status})`)
      }

      const payload = await response.json()
      const normalised = normaliseTranscript(payload)

      if (!normalised) {
        setTranscriptError("Het transcript bevat geen bruikbare informatie")
        setTranscript(null)
        return
      }

      setTranscript(normalised)
    } catch (error: any) {
      console.error("Failed to fetch transcript", error)
      setTranscriptError(error?.message ?? "Onbekende fout bij het ophalen van het transcript")
      setTranscript(null)
    } finally {
      setTranscriptLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPhoneNumbers()
  }, [loadPhoneNumbers])

  useEffect(() => {
    if (selectedPhoneNumber) {
      loadCallSummaries(selectedPhoneNumber)
    }
  }, [selectedPhoneNumber, loadCallSummaries])

  useEffect(() => {
    if (selectedCallSid) {
      loadTranscript(selectedCallSid)
    } else {
      setTranscript(null)
      setTranscriptError(null)
    }
  }, [selectedCallSid, loadTranscript])

  const filteredPhoneNumbers = useMemo(() => {
    if (!phoneFilter.trim()) return phoneNumbers
    const normalisedFilter = phoneFilter.trim().toLowerCase()
    return phoneNumbers.filter((entry) =>
      entry.number.toLowerCase().includes(normalisedFilter),
    )
  }, [phoneFilter, phoneNumbers])

  const activeCall = useMemo(
    () => callSummaries.find((call) => call.callSid === selectedCallSid) ?? null,
    [callSummaries, selectedCallSid],
  )

  const activeNumberMeta = useMemo(
    () => phoneNumbers.find((entry) => entry.number === selectedPhoneNumber) ?? null,
    [phoneNumbers, selectedPhoneNumber],
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="border-muted">
        <CardHeader className="space-y-1">
          <CardTitle>Telefoonnummers</CardTitle>
          <CardDescription>Selecteer een beller om gesprekken te bekijken</CardDescription>
          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={loadPhoneNumbers}
              disabled={numbersLoading}
            >
              {numbersLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Vernieuwen
            </Button>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={phoneFilter}
                onChange={(event) => setPhoneFilter(event.target.value)}
                placeholder="Zoek op telefoonnummer"
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {numbersError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fout bij laden</AlertTitle>
              <AlertDescription>{numbersError}</AlertDescription>
            </Alert>
          )}

          <ScrollArea className="h-[420px] pr-2">
            <div className="space-y-2">
              {numbersLoading && (
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`phone-skeleton-${index}`}
                    className="rounded-lg border border-dashed border-muted bg-muted/40 p-4"
                  >
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-2 h-3 w-24" />
                  </div>
                ))
              )}

              {!numbersLoading && filteredPhoneNumbers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Geen telefoonnummers gevonden. Probeer een andere zoekterm of vernieuw de lijst.
                </p>
              )}

              {!numbersLoading &&
                filteredPhoneNumbers.map((entry) => {
                  const isActive = entry.number === selectedPhoneNumber
                  return (
                    <button
                      key={entry.number}
                      onClick={() => setSelectedPhoneNumber(entry.number)}
                      className={cn(
                        "w-full rounded-xl border p-4 text-left transition",
                        isActive
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-transparent bg-background hover:border-muted hover:bg-muted/40",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PhoneCall className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                          <span className="font-medium tracking-tight">
                            {entry.number}
                          </span>
                        </div>
                        {typeof entry.totalCalls === "number" && entry.totalCalls > 0 && (
                          <Badge variant={isActive ? "default" : "secondary"}>
                            {entry.totalCalls} gesprekken
                          </Badge>
                        )}
                      </div>
                      {entry.lastSeenAt && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Laatste gesprek {formatRelative(entry.lastSeenAt)}
                        </p>
                      )}
                    </button>
                  )
                })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-muted">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Gespreksgeschiedenis</CardTitle>
              <CardDescription>
                Bekijk alle vastgelegde gesprekken voor {selectedPhoneNumber ?? "dit nummer"}
              </CardDescription>
            </div>
            {selectedPhoneNumber && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadCallSummaries(selectedPhoneNumber)}
                disabled={callsLoading}
              >
                {callsLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="mr-2 h-4 w-4" />
                )}
                Vernieuw gesprekken
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {callsError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Kon gesprekken niet laden</AlertTitle>
                <AlertDescription>{callsError}</AlertDescription>
              </Alert>
            )}

            <ScrollArea className="h-[260px] pr-2">
              <div className="space-y-3">
                {callsLoading && (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`call-skeleton-${index}`}
                      className="rounded-xl border border-dashed border-muted bg-muted/30 p-4"
                    >
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="mt-2 h-3 w-32" />
                    </div>
                  ))
                )}

                {!callsLoading && callSummaries.length === 0 && (
                  <div className="rounded-xl border border-dashed border-muted bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                    Geen gesprekken gevonden voor dit nummer.
                  </div>
                )}

                {!callsLoading &&
                  callSummaries.map((call) => {
                    const isActive = call.callSid === selectedCallSid
                    return (
                      <button
                        key={call.callSid}
                        onClick={() => setSelectedCallSid(call.callSid)}
                        className={cn(
                          "w-full rounded-xl border p-4 text-left transition",
                          isActive
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:bg-muted/40",
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">
                              {formatDate(call.startedAt, "Datum onbekend")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Call SID: {call.callSid}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{formatDuration(call.startedAt, call.endedAt)}</span>
                          </div>
                        </div>
                        {call.vapiCallId && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Vapi call ID: {call.vapiCallId}
                          </p>
                        )}
                      </button>
                    )
                  })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Transcript</CardTitle>
              <CardDescription>
                Volledige weergave van het gesprek tussen agent en beller
              </CardDescription>
            </div>
            {selectedCallSid && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadTranscript(selectedCallSid)}
                disabled={transcriptLoading}
              >
                {transcriptLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="mr-2 h-4 w-4" />
                )}
                Vernieuw transcript
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedCallSid == null && (
              <div className="rounded-xl border border-dashed border-muted bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                Selecteer een gesprek om het transcript te bekijken.
              </div>
            )}

            {selectedCallSid && transcriptError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Transcript niet beschikbaar</AlertTitle>
                <AlertDescription>{transcriptError}</AlertDescription>
              </Alert>
            )}

            {selectedCallSid && !transcriptError && (
              <>
                <div className="grid gap-4 rounded-xl border border-muted bg-muted/20 p-4 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Van</p>
                    <p className="font-medium text-foreground">
                      {activeCall?.fromNumber ?? transcript?.fromNumber ?? selectedPhoneNumber ?? "Onbekend"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Gestart op</p>
                    <p className="font-medium text-foreground">{formatDate(activeCall?.startedAt ?? transcript?.startedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Beëindigd op</p>
                    <p className="font-medium text-foreground">{formatDate(activeCall?.endedAt ?? transcript?.endedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Duur</p>
                    <p className="font-medium text-foreground">{formatDuration(activeCall?.startedAt ?? transcript?.startedAt ?? null, activeCall?.endedAt ?? transcript?.endedAt ?? null)}</p>
                  </div>
                  {transcript?.vapiCallId && (
                    <div className="sm:col-span-2 lg:col-span-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Vapi call ID</p>
                      <p className="font-medium text-foreground break-all">{transcript.vapiCallId}</p>
                    </div>
                  )}
                </div>

                <ScrollArea className="h-[360px] pr-2">
                  <div className="space-y-4">
                    {transcriptLoading && (
                      Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={`transcript-skeleton-${index}`}
                          className="flex justify-start"
                        >
                          <div className="w-full max-w-xl rounded-2xl border border-dashed border-muted bg-muted/30 p-4">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="mt-2 h-4 w-full" />
                          </div>
                        </div>
                      ))
                    )}

                    {!transcriptLoading && transcript?.messages.length === 0 && (
                      <div className="rounded-xl border border-dashed border-muted bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                        Er zijn geen transcriptregels voor dit gesprek.
                      </div>
                    )}

                    {!transcriptLoading &&
                      transcript?.messages.map((message, index) => {
                        const isAgent = message.role === "assistant"
                        const isSystem = message.role === "system"
                        const offset = formatOffset(message.startTime)

                        return (
                          <div
                            key={`${message.role}-${index}-${message.startTime ?? "na"}`}
                            className={cn(
                              "flex",
                              isAgent ? "justify-end" : "justify-start",
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-xl rounded-2xl border px-4 py-3 text-sm shadow-sm",
                                isAgent && "border-primary/30 bg-primary/10 text-primary-foreground",
                                !isAgent && !isSystem && "border-muted bg-background",
                                isSystem && "border-dashed border-muted bg-muted/40 text-muted-foreground",
                              )}
                            >
                              <div className="flex items-center justify-between gap-3 text-xs">
                                <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                                  {roleLabels[message.role] ?? message.role}
                                </span>
                                {offset && <span className="text-muted-foreground/80">{offset}</span>}
                              </div>
                              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                                {message.content || "(geen inhoud)"}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </ScrollArea>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CallTranscripts

