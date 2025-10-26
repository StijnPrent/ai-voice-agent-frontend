'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Bird, BarChart3, Building2, Plug, Phone, User, Activity,
  CirclePlus, RefreshCcw, CheckCircle, Clock, Settings, Calendar, PhoneCall,
  ArrowUpRight, ArrowDownRight, Minus, AlertTriangle
} from "lucide-react"
import { CompanyProfile } from "@/app/components/company-profile"
import { IntegrationsManager } from "./components/integrations-manager"
import { VoiceAgentSettings }    from "./components/voice-agent-settings"
import { CallTranscripts }        from "./components/call-transcripts"
import { BACKEND_URL } from "@/lib/api-config"
import { cn } from "@/lib/utils"
import type { Update } from "@/lib/types/types"
import OverviewSkeleton from "@/components/skeletons/OverviewSkeleton";
import Appointments from "@/app/components/appointments";

type StatIdentifier = "avgDuration" | "totalDuration" | "callVolume"
type StatTrend = "up" | "down" | "flat"

interface OverviewStatConfig {
  id: StatIdentifier
  title: string
  icon: typeof Clock
  accent: string
  iconColor: string
}

interface OverviewStat extends OverviewStatConfig {
  value: string
  helper: string
  trend: StatTrend
  isDemo?: boolean
}

interface RawCallMetrics {
  averageCallDurationSeconds?: unknown
  previousAverageCallDurationSeconds?: unknown
  totalCallDurationSeconds?: unknown
  previousTotalCallDurationSeconds?: unknown
  totalCalls?: unknown
  previousTotalCalls?: unknown
}

const STAT_ORDER: StatIdentifier[] = ["avgDuration", "totalDuration", "callVolume"]

const STAT_CONFIG: Record<StatIdentifier, OverviewStatConfig> = {
  avgDuration: {
    id: "avgDuration",
    title: "Gemiddelde gespreksduur",
    icon: Clock,
    accent: "from-blue-50 via-white to-blue-100",
    iconColor: "text-blue-600",
  },
  totalDuration: {
    id: "totalDuration",
    title: "Totale beltijd (maand)",
    icon: Activity,
    accent: "from-emerald-50 via-white to-emerald-100",
    iconColor: "text-emerald-600",
  },
  callVolume: {
    id: "callVolume",
    title: "Gesprekken deze maand",
    icon: PhoneCall,
    accent: "from-purple-50 via-white to-purple-100",
    iconColor: "text-purple-600",
  },
}

const PLACEHOLDER_STATS: OverviewStat[] = STAT_ORDER.map((id) => ({
  ...STAT_CONFIG[id],
  value: "—",
  helper: "Live data wordt geladen...",
  trend: "flat",
}))

const DEMO_STATS: OverviewStat[] = [
  {
    ...STAT_CONFIG.avgDuration,
    value: "4m 12s",
    helper: "+22s t.o.v. vorige maand (demo)",
    trend: "up",
    isDemo: true,
  },
  {
    ...STAT_CONFIG.totalDuration,
    value: "28u 14m",
    helper: "+3u 10m t.o.v. vorige maand (demo)",
    trend: "up",
    isDemo: true,
  },
  {
    ...STAT_CONFIG.callVolume,
    value: "1.248",
    helper: "+5.0% t.o.v. vorige maand (demo)",
    trend: "up",
    isDemo: true,
  },
]

function normaliseNumber(value: unknown): number | null {
  const numberValue = typeof value === "string" && value.trim() !== "" ? Number(value) : value
  if (typeof numberValue !== "number" || Number.isNaN(numberValue) || !Number.isFinite(numberValue)) {
    return null
  }
  return numberValue
}

function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  if (hours) {
    return `${hours}u ${minutes}m`
  }
  if (minutes) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

function formatDurationDifference(diffSeconds: number): string {
  const rounded = Math.round(diffSeconds)
  if (Math.abs(rounded) < 1) {
    return "±0s"
  }

  const sign = rounded > 0 ? "+" : "-"
  const absolute = Math.abs(rounded)
  const hours = Math.floor(absolute / 3600)
  const minutes = Math.floor((absolute % 3600) / 60)
  const seconds = absolute % 60

  const parts: string[] = []

  if (hours) {
    parts.push(`${hours}u`)
    if (minutes) parts.push(`${minutes}m`)
  } else if (minutes) {
    parts.push(`${minutes}m`)
    if (seconds) parts.push(`${seconds}s`)
  } else {
    parts.push(`${seconds}s`)
  }

  return `${sign}${parts.join(" ")}`
}

function formatPercentChange(current: number, previous: number): string {
  if (previous === 0) {
    return `${current > 0 ? "+" : ""}${new Intl.NumberFormat('nl-NL').format(current)} nieuwe`
  }

  const change = ((current - previous) / Math.abs(previous)) * 100
  if (!Number.isFinite(change)) {
    return "±0%"
  }
  return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('nl-NL').format(Math.round(value))
}

function determineTrend(current: number, previous: number | null): StatTrend {
  if (previous === null) {
    return "flat"
  }
  const delta = current - previous
  if (Math.abs(delta) <= 0.5) {
    return "flat"
  }
  return delta > 0 ? "up" : "down"
}

function buildStatsFromPayload(payload: RawCallMetrics): OverviewStat[] {
  const averageDuration = normaliseNumber(payload?.averageCallDurationSeconds)
  const previousAverageDuration = normaliseNumber(payload?.previousAverageCallDurationSeconds)
  const totalDuration = normaliseNumber(payload?.totalCallDurationSeconds)
  const previousTotalDuration = normaliseNumber(payload?.previousTotalCallDurationSeconds)
  const totalCalls = normaliseNumber(payload?.totalCalls)
  const previousTotalCalls = normaliseNumber(payload?.previousTotalCalls)

  if (averageDuration === null || totalDuration === null || totalCalls === null) {
    throw new Error("Incomplete metrics payload")
  }

  const statsById: Record<StatIdentifier, OverviewStat> = {
    avgDuration: {
      ...STAT_CONFIG.avgDuration,
      value: formatDuration(averageDuration),
      helper: previousAverageDuration !== null
        ? `${formatDurationDifference(averageDuration - previousAverageDuration)} t.o.v. vorige maand`
        : "Geen vergelijkingsdata beschikbaar",
      trend: determineTrend(averageDuration, previousAverageDuration),
    },
    totalDuration: {
      ...STAT_CONFIG.totalDuration,
      value: formatDuration(totalDuration),
      helper: previousTotalDuration !== null
        ? `${formatDurationDifference(totalDuration - previousTotalDuration)} t.o.v. vorige maand`
        : "Geen vergelijkingsdata beschikbaar",
      trend: determineTrend(totalDuration, previousTotalDuration),
    },
    callVolume: {
      ...STAT_CONFIG.callVolume,
      value: formatNumber(totalCalls),
      helper: previousTotalCalls !== null
        ? `${formatPercentChange(totalCalls, previousTotalCalls)} t.o.v. vorige maand`
        : "Geen vergelijkingsdata beschikbaar",
      trend: determineTrend(totalCalls, previousTotalCalls),
    },
  }

  return STAT_ORDER.map((id) => statsById[id])
}

function trendBadgeClasses(trend: StatTrend): string {
  switch (trend) {
    case "up":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100"
    case "down":
      return "bg-rose-50 text-rose-700 ring-rose-100"
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200"
  }
}

export default function Dashboard() {
  const router        = useRouter()
  const searchParams  = useSearchParams()
  const initialTab    = searchParams.get('tab') ?? 'overview'
  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [tabUnsaved, setTabUnsaved] = useState<Record<string, boolean>>({})
  const [overviewStats, setOverviewStats] = useState<OverviewStat[]>(PLACEHOLDER_STATS)
  const [statsLoading, setStatsLoading] = useState<boolean>(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  const attemptTabChange = useCallback((nextTab: string) => {
    if (nextTab === activeTab) return

    const currentDirty = tabUnsaved[activeTab] ?? false
    if (currentDirty) {
      const confirmLeave = window.confirm("Je hebt niet-opgeslagen wijzigingen. Weet je zeker dat je dit tabblad wilt verlaten?")
      if (!confirmLeave) {
        return
      }
    }

    setActiveTab(nextTab)
  }, [activeTab, tabUnsaved, setActiveTab])

  const handleTabDirtyChange = useCallback((tab: string, dirty: boolean) => {
    setTabUnsaved(prev => {
      if ((prev[tab] ?? false) === dirty) {
        return prev
      }
      return { ...prev, [tab]: dirty }
    })
  }, [])

  // Data‐loading state
  const [updates, setUpdates]       = useState<Update[]>([])
  const [loadingUpdates, setLoadingUpdates] = useState<boolean>(true)
  const [error, setError]           = useState<string | null>(null)

  // 1) Fetch updates on mount
  useEffect(() => {
    async function loadUpdates() {
      setLoadingUpdates(true)
      setError(null)
      try {
        const res = await fetch(`${BACKEND_URL}/updates/get`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` },
        })
        if (!res.ok) throw new Error(`Failed to fetch updates: ${res.status}`)
        const data = await res.json() as { update:string;createdAt:string;status:string }[]
        setUpdates(data.map(u => ({ update:u.update, createdAt:new Date(u.createdAt), status:u.status })))
      } catch (e:any) {
        console.error(e)
        setError(e.message)
      } finally {
        setLoadingUpdates(false)
      }
    }
    loadUpdates()
  }, [])

  // 2) Sync tab → URL (shallow so we don't refetch)
  useEffect(() => {
    // only push if it actually changed
    if ((searchParams.get('tab') ?? 'overview') !== activeTab) {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', activeTab)
      router.replace(url.pathname + url.search)
    }
  }, [activeTab, router, searchParams])

  // 3) Load call metrics for overview stats
  useEffect(() => {
    const controller = new AbortController()

    async function loadMetrics() {
      setStatsLoading(true)
      setStatsError(null)
      try {
        const token = localStorage.getItem('jwt')
        if (!token) {
          throw new Error('Geen sessietoken gevonden')
        }

        const response = await fetch(`${BACKEND_URL}/analytics/calls/overview`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Kon belstatistieken niet laden (${response.status})`)
        }

        const payload = await response.json() as RawCallMetrics
        const nextStats = buildStatsFromPayload(payload)
        setOverviewStats(nextStats)
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }
        console.error(error)
        const message = error instanceof Error ? error.message : null
        if (message === 'Geen sessietoken gevonden') {
          setStatsError("Log opnieuw in om live belstatistieken te zien. We tonen voorbeelddata.")
        } else {
          setStatsError("Live belstatistieken konden niet worden geladen. We tonen voorbeelddata.")
        }
        setOverviewStats(DEMO_STATS)
      } finally {
        if (!controller.signal.aborted) {
          setStatsLoading(false)
        }
      }
    }

    loadMetrics()

    return () => controller.abort()
  }, [])

  function handleLogout() {
    // 1) Remove tokens
    localStorage.removeItem('jwt')
    localStorage.removeItem('auth_token')   // remove any other keys you use

    // 2) Navigate to login
    router.replace('/login')
  }

  // 4) While data is loading, show skeleton
  if (loadingUpdates) {
    return <OverviewSkeleton />
  }

  return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Bird className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold">Calling Bird<sup className="text-s text-gray-400">Demo</sup></h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Activity className="h-3 w-3 mr-1" /> Systeem Online
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <User className="h-4 w-4 mr-2" /> Log uit
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={attemptTabChange} className="space-y-6">
            <TabsList className="grid grid-cols-6">
              <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-1" />Overzicht</TabsTrigger>
              <TabsTrigger value="company" ><Building2 className="h-4 w-4 mr-1" />Bedrijf</TabsTrigger>
              <TabsTrigger value="appointments"><Calendar className="h-4 w-4 mr-1" />Afspraken</TabsTrigger>
              <TabsTrigger value="integrations"><Plug className="h-4 w-4 mr-1" />Integraties</TabsTrigger>
              <TabsTrigger value="voice-agent"><Phone className="h-4 w-4 mr-1" />Stem instellingen</TabsTrigger>
              <TabsTrigger value="calls"><PhoneCall className="h-4 w-4 mr-1" />Gesprekken</TabsTrigger>
            </TabsList>

            {/* Overview Panel */}
            <TabsContent value="overview" className="space-y-6">
              {statsError && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <span>{statsError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {overviewStats.map((stat) => (
                  <Card
                    key={stat.id}
                    className={cn(
                      "border shadow-sm bg-gradient-to-br",
                      stat.accent,
                      "border-slate-200/70"
                    )}
                  >
                    <CardContent className="p-6 flex items-center justify-between gap-4">
                      <div className="space-y-3">
                        <p className="text-sm text-slate-600">{stat.title}</p>
                        <div className="flex items-baseline gap-3">
                          {statsLoading ? (
                            <span className="h-8 w-20 rounded bg-slate-200/80 animate-pulse" />
                          ) : (
                            <span className="text-3xl font-semibold text-slate-900">{stat.value}</span>
                          )}
                          {!statsLoading && (
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                                trendBadgeClasses(stat.trend)
                              )}
                            >
                              {stat.trend === "up" && <ArrowUpRight className="mr-1 h-4 w-4" />}
                              {stat.trend === "down" && <ArrowDownRight className="mr-1 h-4 w-4" />}
                              {stat.trend === "flat" && <Minus className="mr-1 h-4 w-4" />}
                              <span>
                                {stat.trend === "up"
                                  ? "Groei"
                                  : stat.trend === "down"
                                  ? "Daling"
                                  : "Stabiel"}
                              </span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          {statsLoading ? "Live data wordt geladen..." : stat.helper}
                        </p>
                      </div>
                      <div className="rounded-full bg-white/75 p-3 shadow-inner">
                        <stat.icon className={cn("h-6 w-6", stat.iconColor)} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recente Activiteiten</CardTitle>
                    <CardDescription>Laatste updates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {updates.map((u,i) => (
                        <div key={i} className="flex items-center space-x-3">
                          {u.status === 'created'
                              ? <CirclePlus className="h-5 w-5 text-green-300" />
                              : <RefreshCcw className="h-5 w-5 text-blue-500" />
                          }
                          <div className="flex-1">
                            <p className="font-medium">{u.update}</p>
                            <p className="text-xs text-gray-500">
                              {u.createdAt.toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'})}
                            </p>
                          </div>
                        </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Snelle acties</CardTitle>
                    <CardDescription>Snelkoppelingen</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => attemptTabChange("integrations")}
                    >
                      <CirclePlus className="mr-2 h-4 w-4" /> Add Integration
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => attemptTabChange("voice-agent")}
                    >
                      <Settings className="mr-2 h-4 w-4"/> Stem instellingen
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Company Panel */}
            <TabsContent value="company">
              <CompanyProfile onDirtyChange={(dirty) => handleTabDirtyChange("company", dirty)} />
            </TabsContent>

            <TabsContent value="appointments">
              <Appointments onDirtyChange={(dirty) => handleTabDirtyChange("appointments", dirty)} />
            </TabsContent>

            {/* Integrations Panel */}
            <TabsContent value="integrations">
              <IntegrationsManager />
            </TabsContent>

            {/* Voice Agent Panel */}
            <TabsContent value="voice-agent">
              <VoiceAgentSettings onDirtyChange={(dirty) => handleTabDirtyChange("voice-agent", dirty)} />
            </TabsContent>

            {/* Calls Panel */}
            <TabsContent value="calls">
              <CallTranscripts />
            </TabsContent>
          </Tabs>
        </div>
      </div>
  )
}
