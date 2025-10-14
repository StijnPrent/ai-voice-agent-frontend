'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Bird, BarChart3, Building2, Plug, Phone, User, Activity,
  CirclePlus, RefreshCcw, CheckCircle, Clock, Settings, Users, Calendar, PhoneCall
} from "lucide-react"
import { CompanyProfile } from "@/app/components/company-profile"
import { IntegrationsManager } from "./components/integrations-manager"
import { VoiceAgentSettings }    from "./components/voice-agent-settings"
import { Analytics }              from "./components/analytics"
import { CallTranscripts }        from "./components/call-transcripts"
import { BACKEND_URL } from "@/lib/api-config"
import type { Update } from "@/lib/types/types"
import OverviewSkeleton from "@/components/skeletons/OverviewSkeleton";
import Appointments from "@/app/components/appointments";

export default function Dashboard() {
  const router        = useRouter()
  const searchParams  = useSearchParams()
  const initialTab    = searchParams.get('tab') ?? 'overview'
  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [tabUnsaved, setTabUnsaved] = useState<Record<string, boolean>>({})

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

  // 3) Stats for overview
  const stats = [
    { title:"Active Calls",    value:"24",   change:"+12%",  icon:Phone,   color:"text-green-600" },
    { title:"Integrations",    value:"8",    change:"+2",    icon:Plug,    color:"text-blue-600"  },
    { title:"Success Rate",    value:"94.2%",change:"+2.1%", icon:CheckCircle, color:"text-green-600" },
    { title:"Avg Duration",    value:"3m42s", change:"-15s",  icon:Clock,   color:"text-orange-600" },
  ]

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
              {/*<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">*/}
              {/*  {stats.map((s,i) => (*/}
              {/*      <Card key={i}>*/}
              {/*        <CardContent className="p-6 flex justify-between items-center">*/}
              {/*          <div>*/}
              {/*            <p className="text-sm text-gray-600">{s.title}</p>*/}
              {/*            <p className="text-2xl font-bold">{s.value}</p>*/}
              {/*            <p className={`text-sm ${s.color}`}>{s.change}</p>*/}
              {/*          </div>*/}
              {/*          <s.icon className={`h-8 w-8 ${s.color}`} />*/}
              {/*        </CardContent>*/}
              {/*      </Card>*/}
              {/*  ))}*/}
              {/*</div>*/}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card className="bg-gradient-to-br from-blue-50 via-white to-blue-300 border border-blue-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Recente Activiteiten</CardTitle>
                    <CardDescription className="text-slate-800/80">Laatste updates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-slate-900">
                    {updates.map((u,i) => (
                        <div key={i} className="flex items-center space-x-3">
                          {u.status === 'created'
                              ? <CirclePlus className="h-5 w-5 text-green-600" />
                              : <RefreshCcw className="h-5 w-5 text-blue-600" />
                          }
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{u.update}</p>
                            <p className="text-xs text-slate-700/80">
                              {u.createdAt.toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'})}
                            </p>
                          </div>
                        </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-gradient-to-br from-blue-50 via-white to-blue-300 border border-blue-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Snelle acties</CardTitle>
                    <CardDescription className="text-slate-800/80">Snelkoppelingen</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-slate-900">
                    <Button
                        variant="outline"
                        className="w-full justify-start bg-white/60 hover:bg-white/80 text-blue-700 border-blue-300"
                        onClick={() => attemptTabChange("integrations")}
                    >
                      <CirclePlus className="mr-2 h-4 w-4" /> Add Integration
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full justify-start bg-white/60 hover:bg-white/80 text-blue-700 border-blue-300"
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
