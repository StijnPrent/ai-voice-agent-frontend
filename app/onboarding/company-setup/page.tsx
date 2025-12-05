"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle2, Circle, ExternalLink, Globe, Loader2, MapPin, Phone, Search, ShieldAlert, SkipForward, Sparkles } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CompanyProfile, CompanyProfilePrefill, OperatingDays } from "@/app/components/company-profile"
import {
  CompanySetupStatus,
  RequiredSetupField,
  SetupStatusIssue,
  ensureVoiceSettingsDefaults,
  fetchCompanySetupStatus,
} from "@/lib/company-setup"

type StepId = "lookup" | "industry" | "profile"

interface GooglePlace {
  id: string
  displayName?: { text?: string }
  formattedAddress?: string
  websiteUri?: string
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  googleMapsUri?: string
  regularOpeningHours?: {
    weekdayDescriptions?: string[]
  }
}

const DAY_KEYS: Record<string, keyof OperatingDays> = {
  maandag: "maandag",
  dinsdag: "dinsdag",
  woensdag: "woensdag",
  donderdag: "donderdag",
  vrijdag: "vrijdag",
  zaterdag: "zaterdag",
  zondag: "zondag",
}

const INDUSTRY_STORAGE_KEY = "companyIndustry"
const COMPANY_TYPE_STORAGE_KEY = "companyType"

function parseOpeningHours(weekdayDescriptions?: string[]): Partial<OperatingDays> {
  if (!Array.isArray(weekdayDescriptions)) return {}

  return weekdayDescriptions.reduce<Partial<OperatingDays>>((acc, entry) => {
    if (typeof entry !== "string") return acc

    const [rawDay, ...timeParts] = entry.split(":")
    const rawTimes = timeParts.join(":").trim()
    if (!rawDay || !rawTimes) return acc

    const dayKey = DAY_KEYS[rawDay.trim().toLowerCase()]
    if (!dayKey) return acc

    const lowerTimes = rawTimes.toLowerCase()
    const isClosed = lowerTimes.includes("gesloten") || lowerTimes.includes("closed")
    if (isClosed) {
      acc[dayKey] = { isOpen: false, openTime: "09:00", closeTime: "17:00" }
      return acc
    }

    const match = rawTimes.match(/(\d{1,2}:\d{2})\s*[\u2013-]\s*(\d{1,2}:\d{2})/)
    if (match) {
      acc[dayKey] = {
        isOpen: true,
        openTime: match[1],
        closeTime: match[2],
      }
    }

    return acc
  }, {})
}

function extractEmailFromToken(): string {
  if (typeof window === "undefined") return ""

  const token = localStorage.getItem("jwt")
  if (!token) return ""

  try {
    const [, payload] = token.split(".")
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
    const candidates = [decoded?.email, decoded?.user_email, decoded?.username, decoded?.preferred_username, decoded?.sub]
    const match = candidates.find((value) => typeof value === "string" && /\S+@\S+\.\S+/.test(value))
    return typeof match === "string" ? match : ""
  } catch {
    return ""
  }
}

interface TaskDescriptor {
  field: RequiredSetupField
  title: string
  description: string
}

const TASKS: TaskDescriptor[] = [
  {
    field: "companyName",
    title: "Vul je bedrijfsnaam in",
    description: "Deze naam verschijnt in rapportages en gesprekken met klanten.",
  },
  {
    field: "phoneNumber",
    title: "Voeg een hoofdtelefoonnummer toe",
    description: "Hiermee kan de voice agent klanten doorverbinden indien nodig.",
  },
  {
    field: "address",
    title: "Zorg voor een volledig adres",
    description: "Adresgegevens helpen bij het beantwoorden van klantvragen.",
  },
  {
    field: "businessHours",
    title: "Stel je openingstijden in",
    description: "De AI gebruikt openingstijden om beschikbaarheid te communiceren.",
  },
]

function buildTaskState(status: CompanySetupStatus | null) {
  const missing =
    status?.missingFields?.filter((field): field is RequiredSetupField =>
      ["companyName", "contactEmail", "phoneNumber", "address", "businessHours"].includes(field as RequiredSetupField)
    ) || TASKS.map((task) => task.field)

  return TASKS.map((task) => ({
    ...task,
    completed: !missing.includes(task.field),
  }))
}

const ISSUE_MESSAGES: Record<Exclude<SetupStatusIssue, RequiredSetupField>, string> = {
  auth: "Je sessie is verlopen. Log opnieuw in om verder te gaan.",
  network: "We konden je bedrijfsstatus niet ophalen. Controleer je verbinding en probeer opnieuw.",
  unknown: "Niet alle vereiste gegevens konden worden gecontroleerd. Werk je bedrijfsprofiel bij en probeer opnieuw.",
}

function mapPlaceToPrefill(place: GooglePlace): CompanyProfilePrefill {
  const phone = place.internationalPhoneNumber || place.nationalPhoneNumber || ""
  const operatingDays = parseOpeningHours(place.regularOpeningHours?.weekdayDescriptions)

  return {
    name: place.displayName?.text || "",
    phone,
    website: place.websiteUri || "",
    address: place.formattedAddress || "",
    operatingDays: Object.keys(operatingDays).length ? operatingDays : undefined,
  }
}

interface IndustryOption {
  id: string
  title: string
  description: string
  tag?: string
}

const INDUSTRY_OPTIONS: IndustryOption[] = [
  {
    id: "ecommerce",
    title: "E-commerce",
    description: "Verkoop je vooral producten online of via platforms.",
    tag: "Geen afspraken nodig",
  },
  {
    id: "appointments",
    title: "Afspraken",
    description: "Je plant vooral afspraken (salons, praktijken, services).",
    tag: "Afspraken & reminders",
  },
  {
    id: "both",
    title: "Beide",
    description: "Je verkoopt producten én werkt met afspraken.",
    tag: "Hybrid",
  },
]

function IndustrySelectionStep({
  selectedIndustry,
  onSelect,
}: {
  selectedIndustry: string | null
  onSelect: (value: string) => void
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="text-[#081245]">
        <CardTitle>Stap 2 - Kies je branche</CardTitle>
        <CardDescription>We passen de onboarding en standaardinstellingen aan op je keuze.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRY_OPTIONS.map((option, index) => {
            const isSelected = selectedIndustry === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelect(option.id)}
                style={{ animationDelay: `${index * 80}ms` }}
                className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition duration-200 ease-out shadow-sm ${
                  isSelected
                    ? "border-sky-200 bg-gradient-to-br from-sky-50 to-white ring-2 ring-sky-200 shadow-md"
                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                } animate-[bubbleIn_0.35s_ease_forwards] opacity-0`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-[#081245]">{option.title}</p>
                    <p className="text-sm text-slate-600 leading-snug">{option.description}</p>
                  </div>
                </div>
                {isSelected ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                    <CheckCircle2 className="h-4 w-4" />
                    Geselecteerd
                  </div>
                ) : (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 group-hover:bg-slate-200">
                    <span>Kies deze</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <p className="text-sm text-slate-500">
          Deze keuze helpt ons om de juiste pagina&apos;s, integraties en presets te tonen. Je kunt dit later in je instellingen wijzigen.
        </p>
        <style jsx global>{`
          @keyframes bubbleIn {
            from {
              opacity: 0;
              transform: translateY(8px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
      </CardContent>
    </Card>
  )
}

interface GoogleBusinessLookupStepProps {
  onSelect: (place: GooglePlace, prefill: CompanyProfilePrefill) => void
  onSkip: () => void
  selectedPlaceId?: string | null
}

interface PlaceSuggestion {
  id: string
  primaryText: string
  secondaryText?: string
}

function GoogleBusinessLookupStep({ onSelect, onSkip, selectedPlaceId }: GoogleBusinessLookupStepProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GooglePlace[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
  const fieldMask =
    "places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.internationalPhoneNumber,places.id,places.googleMapsUri,places.regularOpeningHours.weekdayDescriptions"

  const fetchPlacesByText = useCallback(
    async (text: string) => {
      const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey || "",
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify({
          textQuery: text,
          languageCode: "nl",
        }),
      })

      if (!response.ok) {
        throw new Error("We konden geen zoekresultaten ophalen. Probeer het opnieuw of sla deze stap over.")
      }

      const payload = await response.json()
      const places = Array.isArray(payload?.places) ? (payload.places as GooglePlace[]) : []
      return places.slice(0, 6)
    },
    [apiKey, fieldMask]
  )

  const performSearch = async (event?: React.FormEvent) => {
    event?.preventDefault()
    if (!query.trim()) {
      setError("Typ een bedrijfsnaam of adres")
      return
    }
    if (!apiKey) {
      setError("Voeg een NEXT_PUBLIC_GOOGLE_PLACES_API_KEY toe om Google Business resultaten op te halen.")
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const places = await fetchPlacesByText(query.trim())
      setResults(places)
      if (places.length === 0) {
        setError("Geen resultaten gevonden. Pas je zoekopdracht aan of ga door met handmatig invullen.")
      }
    } catch (err: any) {
      setResults([])
      setError(err?.message || "Zoeken is mislukt. Probeer het later opnieuw.")
    } finally {
      setIsSearching(false)
    }
  }

  const fetchPlaceDetails = useCallback(
    async (placeId: string) => {
      const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        headers: {
          "X-Goog-Api-Key": apiKey || "",
          "X-Goog-FieldMask": fieldMask.replace(/places\./g, ""),
        },
      })

      if (!response.ok) {
        throw new Error("Kon bedrijfsgegevens niet ophalen. Probeer opnieuw of gebruik handmatige invoer.")
      }

      return (await response.json()) as GooglePlace
    },
    [apiKey, fieldMask]
  )

  useEffect(() => {
    const trimmed = query.trim()
    if (!apiKey || trimmed.length < 3) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    setIsSuggesting(true)

    const timer = setTimeout(async () => {
      try {
        const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask":
              "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
          },
          body: JSON.stringify({
            input: trimmed,
            languageCode: "nl",
          }),
        })

        if (!response.ok) {
          throw new Error("Geen suggesties beschikbaar")
        }

        const payload = await response.json()
        const nextSuggestions: PlaceSuggestion[] = Array.isArray(payload?.suggestions)
          ? payload.suggestions
              .map((item: any) => {
                const prediction = item?.placePrediction
                const toText = (value: any) => (typeof value === "string" ? value : value?.text || "")
                const primary = toText(prediction?.text)
                const secondary = toText(prediction?.structuredFormat?.secondaryText)

                if (!prediction?.placeId || !primary) return null
                return {
                  id: prediction.placeId as string,
                  primaryText: primary,
                  secondaryText: secondary,
                }
              })
              .filter(Boolean)
              .slice(0, 6)
          : []

        setSuggestions(nextSuggestions)
      } catch {
        setSuggestions([])
      } finally {
        setIsSuggesting(false)
      }
    }, 250)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [apiKey, query])

  const handleSuggestionSelect = useCallback(
    async (suggestion: PlaceSuggestion) => {
      if (!apiKey) {
        setError("Voeg een NEXT_PUBLIC_GOOGLE_PLACES_API_KEY toe om Google Business resultaten op te halen.")
        return
      }

      setQuery(suggestion.primaryText)
      setSuggestions([])
      setIsSearching(true)
      setError(null)

      try {
        const place = await fetchPlaceDetails(suggestion.id)
        const prefill = mapPlaceToPrefill(place)
        setResults([place])
        onSelect(place, prefill)
      } catch (err: any) {
        setError(err?.message || "We konden dit bedrijf niet ophalen. Probeer opnieuw.")
      } finally {
        setIsSearching(false)
      }
    },
    [apiKey, fetchPlaceDetails, onSelect]
  )

  useEffect(() => {
    return () => {
      setSuggestions([])
    }
  }, [])

  return (
    <Card className="shadow-sm">
      <CardHeader className="text-[#081245]">
        <CardTitle>Stap 1 - Zoek je bedrijf</CardTitle>
        <CardDescription>
          Gebruik Google Business om je bedrijfsgegevens automatisch te vullen. Geen match? Sla over en vul het profiel handmatig in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={performSearch} className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Zoek op bedrijfsnaam of adres"
              className="flex-1"
            />
            <Button type="submit" className="gap-2">
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Zoeken
            </Button>
          </div>
          {(isSuggesting || suggestions.length > 0) && (
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              {isSuggesting && (
                <div className="px-4 py-2 text-sm text-slate-500">Suggesties ophalen...</div>
              )}
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => void handleSuggestionSelect(suggestion)}
                  className="flex w-full items-start gap-2 border-t border-slate-100 px-4 py-2 text-left hover:bg-slate-50 first:border-t-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{suggestion.primaryText}</p>
                    {suggestion.secondaryText ? (
                      <p className="text-xs text-slate-500">{suggestion.secondaryText}</p>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">Selecteer het juiste bedrijf om velden vooraf in te vullen.</p>
            <Button type="button" variant="ghost" size="sm" className="gap-2 text-slate-700" onClick={onSkip}>
              <SkipForward className="h-4 w-4" />
              Sla stap over
            </Button>
          </div>
        </form>

        {error && (
          <Alert variant="destructive">
            <ShieldAlert className="h-5 w-5" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {results.length === 0 && !isSearching ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              <p className="font-medium text-[#081245]">Nog niets geselecteerd</p>
              <p className="mt-1">
                Zoek op bedrijfsnaam of adres om de belangrijkste velden automatisch in te vullen. Dit bespaart tijd bij het instellen van je profiel.
              </p>
            </div>
          ) : null}

          {results.map((place) => {
            const isSelected = selectedPlaceId === place.id
            const prefill = mapPlaceToPrefill(place)

            return (
              <div
                key={place.id}
                className={`rounded-xl border bg-white p-4 shadow-sm transition ${isSelected ? "border-emerald-200 ring-1 ring-emerald-200" : "border-slate-200 hover:border-slate-300"
                  }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-[#081245]">{place.displayName?.text || "Onbekend bedrijf"}</p>
                      {isSelected && (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Geselecteerd
                        </Badge>
                      )}
                    </div>
                    {place.formattedAddress && (
                      <p className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {place.formattedAddress}
                      </p>
                    )}
                    {(prefill.phone || prefill.website) && (
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        {prefill.phone && (
                          <span className="inline-flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-400" />
                            {prefill.phone}
                          </span>
                        )}
                        {prefill.website && (
                          <span className="inline-flex items-center gap-2">
                            <Globe className="h-4 w-4 text-slate-400" />
                            {prefill.website.replace(/^https?:\/\//, "")}
                          </span>
                        )}
                        {place.googleMapsUri && (
                          <a
                            href={place.googleMapsUri}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-500"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Maps
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant={isSelected ? "secondary" : "default"}
                    className="shrink-0 gap-2"
                    onClick={() => onSelect(place, prefill)}
                  >
                    {isSelected ? "Gebruikt" : "Gebruik gegevens"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default function CompanySetupOnboardingPage() {
  const router = useRouter()
  const loginEmail = useMemo(() => extractEmailFromToken(), [])
  const [status, setStatus] = useState<CompanySetupStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingProgress, setIsCheckingProgress] = useState(false)
  const [profileDirty, setProfileDirty] = useState(false)
  const [currentStep, setCurrentStep] = useState<StepId>("lookup")
  const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null)
  const [prefillData, setPrefillData] = useState<CompanyProfilePrefill | null>(null)
  const [lookupSkipped, setLookupSkipped] = useState(false)
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [progressMessage, setProgressMessage] = useState<{ variant: "success" | "warning" | "error"; text: string } | null>(null)
  const [saveProfileFn, setSaveProfileFn] = useState<(() => Promise<boolean>) | null>(null)

  const resolvedPrefillData = useMemo<CompanyProfilePrefill | undefined>(() => {
    if (prefillData) {
      return {
        ...prefillData,
        email: prefillData.email || loginEmail || "",
      }
    }

    return loginEmail ? { email: loginEmail } : undefined
  }, [loginEmail, prefillData])

  const taskStates = useMemo(() => buildTaskState(status), [status])
  const allTasksCompleted = taskStates.every((task) => task.completed)
  const lookupCompleted = lookupSkipped || !!selectedPlace
  const industryCompleted = Boolean(selectedIndustry)

  const refreshStatus = useCallback(
    async (bypassCache = false) => {
      const next = await fetchCompanySetupStatus({ bypassCache })
      setStatus(next)
      return next
    },
    []
  )

  // Load any previously stored industry choice (e.g., after login)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(INDUSTRY_STORAGE_KEY)
      const storedType = localStorage.getItem(COMPANY_TYPE_STORAGE_KEY)
      if (stored) setSelectedIndustry(stored)
      if (storedType) {
        document.documentElement.dataset.companyType = storedType
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const initialise = async () => {
      const next = await refreshStatus(true)
      if (cancelled) return

      setIsLoading(false)

      if (!next.needsSetup) {
        try {
          await ensureVoiceSettingsDefaults()
        } finally {
          if (!cancelled) {
            router.replace("/")
          }
        }
      }
    }

    void initialise()

    return () => {
      cancelled = true
    }
  }, [refreshStatus, router])

  const handleCheckProgress = useCallback(async () => {
    setIsCheckingProgress(true)
    setProgressMessage(null)

    try {
      if (!industryCompleted) {
        setProgressMessage({
          variant: "warning",
          text: "Kies eerst je branche zodat we de juiste ervaring tonen.",
        })
        setCurrentStep("industry")
        return
      }

      if (profileDirty && saveProfileFn) {
        const saved = await saveProfileFn()
        if (!saved) {
          setProgressMessage({
            variant: "warning",
            text: "We konden je wijzigingen niet opslaan. Controleer de velden en probeer opnieuw.",
          })
          setCurrentStep("profile")
          return
        }
      }

      const next = await refreshStatus(true)

      if (!next.needsSetup) {
        try {
          if (selectedIndustry) {
            localStorage.setItem(COMPANY_TYPE_STORAGE_KEY, selectedIndustry)
            document.documentElement.dataset.companyType = selectedIndustry
          }
        } catch {
          /* ignore */
        }
        await ensureVoiceSettingsDefaults()
        router.replace("/")
        return
      }

      const missingTasks = buildTaskState(next).filter((task) => !task.completed).map((task) => task.title)
      const message =
        missingTasks.length > 0
          ? `Vul nog aan: ${missingTasks.join(", ")}.`
          : "We konden niet bevestigen dat alle gegevens compleet zijn. Probeer het opnieuw na opslaan."

      setProgressMessage({ variant: "warning", text: message })
      setCurrentStep("profile")
    } catch (error) {
      setProgressMessage({
        variant: "error",
        text: "Voortgang kon niet gecontroleerd worden. Probeer het opnieuw of controleer je verbinding.",
      })
    } finally {
      setIsCheckingProgress(false)
    }
  }, [industryCompleted, profileDirty, refreshStatus, router, saveProfileFn])

  const handlePlaceSelected = useCallback((place: GooglePlace, prefill: CompanyProfilePrefill) => {
    setSelectedPlace(place)
    setPrefillData(prefill)
    setLookupSkipped(false)
    setCurrentStep("industry")
  }, [])

  const handleSkipLookup = useCallback(() => {
    setLookupSkipped(true)
    setCurrentStep("industry")
  }, [])

  const steps = [
    {
      id: "lookup" as StepId,
      title: "Zoek via Google",
      description: "Haal bedrijfsgegevens automatisch op.",
      complete: lookupCompleted,
    },
    {
      id: "industry" as StepId,
      title: "Kies je branche",
      description: "Gebruik deze keuze om je setup te personaliseren.",
      complete: industryCompleted,
    },
    {
      id: "profile" as StepId,
      title: "Controleer en vul aan",
      description: "Sla het bedrijfsprofiel op.",
      complete: allTasksCompleted,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl space-y-8 px-4">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            <Sparkles className="h-4 w-4" />
            Onboarding
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#081245]">Rond je onboarding af in drie stappen</h1>
            <p className="max-w-3xl text-slate-600">
              Zoek je bedrijf via Google Business, kies je branche en controleer daarna het profiel. Als de zoekopdracht niets oplevert, sla je stap 1 over en vul je het profiel handmatig in.
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <Card className="shadow-sm">
            <CardHeader className="text-[#081245]">
              <CardTitle>Onboarding stappen</CardTitle>
              <CardDescription>Kies een stap om door te gaan. Je kunt altijd terug.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3">
                {steps.map((step, index) => {
                  const isActive = currentStep === step.id
                  const isComplete = step.complete

                  return (
                    <li key={step.id}>
                      <button
                        type="button"
                        className={`w-full rounded-lg border p-4 text-left transition ${isActive
                            ? "border-blue-200 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        onClick={() => setCurrentStep(step.id)}
                      >
                        <div className="flex items-start gap-3">
                          {isComplete ? (
                            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
                          ) : (
                            <Circle className="mt-0.5 h-5 w-5 text-slate-300" />
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[#081245]">
                                {index + 1}. {step.title}
                              </p>
                              {isComplete && (
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                  Klaar
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">{step.description}</p>
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ol>
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckProgress}
                disabled={isCheckingProgress || isLoading}
              >
                {isCheckingProgress ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opslaan en controleren...
                  </>
                ) : allTasksCompleted ? (
                  "Start met CallingBird"
                ) : profileDirty ? (
                  "Opslaan en controleren"
                ) : (
                  "Voortgang controleren"
                )}
              </Button>

              {progressMessage && (
                <Alert variant={progressMessage.variant === "error" ? "destructive" : "default"}>
                  <AlertDescription className={progressMessage.variant === "warning" ? "text-amber-800" : undefined}>
                    {progressMessage.text}
                  </AlertDescription>
              </Alert>
            )}

            {selectedPlace && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-800">Gekozen bedrijf</p>
                <p className="text-sm text-emerald-900">{selectedPlace.displayName?.text || "Onbekend"}</p>
                {selectedPlace.formattedAddress && (
                  <p className="text-xs text-emerald-900/80">{selectedPlace.formattedAddress}</p>
                )}
                {selectedIndustry && (
                  <p className="mt-1 text-xs text-emerald-900/80">
                    Voorkeurs-ervaring: <span className="font-semibold">{selectedIndustry}</span>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

          <div className="space-y-6">
            {currentStep === "lookup" && (
              <GoogleBusinessLookupStep
                onSelect={handlePlaceSelected}
                onSkip={handleSkipLookup}
                selectedPlaceId={selectedPlace?.id}
              />
            )}

            {currentStep === "industry" && (
              <IndustrySelectionStep
                selectedIndustry={selectedIndustry}
                onSelect={(value) => {
                  setSelectedIndustry(value)
                  try {
                    localStorage.setItem(INDUSTRY_STORAGE_KEY, value)
                    localStorage.setItem(COMPANY_TYPE_STORAGE_KEY, value)
                    document.documentElement.dataset.companyType = value
                  } catch {
                    /* ignore */
                  }
                  setCurrentStep("profile")
                }}
              />
            )}

            {currentStep === "profile" && (
              <div className="space-y-6">
                <div className="">

                  <Card className="shadow-sm">
                    <CardHeader className="text-[#081245]">
                      <CardTitle>Stap 3 - Bedrijfsprofiel</CardTitle>
                      <CardDescription>
                        Controleer de vooringevulde gegevens en vul ontbrekende velden aan. Sla daarna het profiel op.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                      ) : (
                        <CompanyProfile
                          prefillData={resolvedPrefillData}
                          onDirtyChange={setProfileDirty}
                          onSaveReady={setSaveProfileFn}
                          showSaveButton={false}
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
