'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Bird, BarChart3, Building2, Plug, Phone, User, Activity,
  CirclePlus, RefreshCcw, CheckCircle, Clock, Settings, Users
} from "lucide-react"
import { CompanyProfile } from "@/app/components/company-profile"
import { IntegrationsManager } from "./components/integrations-manager"
import { VoiceAgentSettings }    from "./components/voice-agent-settings"
import { Analytics }              from "./components/analytics"
import { BACKEND_URL } from "@/lib/api-config"
import type { Update } from "@/lib/types/types"
import OverviewSkeleton from "@/components/skeletons/OverviewSkeleton";

export default function Dashboard() {
  const router        = useRouter()
  const searchParams  = useSearchParams()
  const initialTab    = searchParams.get('tab') ?? 'overview'
  const [activeTab, setActiveTab] = useState<string>(initialTab)

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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="overview"><BarChart3 className="h-4 w-4" /> Overzicht</TabsTrigger>
              <TabsTrigger value="company" ><Building2 className="h-4 w-4" /> Bedrijf</TabsTrigger>
              <TabsTrigger value="integrations"><Plug className="h-4 w-4" /> Integraties</TabsTrigger>
              <TabsTrigger value="voice-agent"><Phone className="h-4 w-4" /> Voice Settings</TabsTrigger>
            </TabsList>

            {/* Overview Panel */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((s,i) => (
                    <Card key={i}>
                      <CardContent className="p-6 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">{s.title}</p>
                          <p className="text-2xl font-bold">{s.value}</p>
                          <p className={`text-sm ${s.color}`}>{s.change}</p>
                        </div>
                        <s.icon className={`h-8 w-8 ${s.color}`} />
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
                    <Button variant="outline" className="w-full justify-start"><CirclePlus className="mr-2 h-4 w-4"/> Add Integration</Button>
                    <Button variant="outline" className="w-full justify-start"><Settings className="mr-2 h-4 w-4"/> Voice Settings</Button>
                    <Button variant="outline" className="w-full justify-start"><Users className="mr-2 h-4 w-4"/> Team Access</Button>
                    <Button variant="outline" className="w-full justify-start"><BarChart3 className="mr-2 h-4 w-4"/> Analytics</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Company Panel */}
            <TabsContent value="company">
              <CompanyProfile />
            </TabsContent>

            {/* Integrations Panel */}
            <TabsContent value="integrations">
              <IntegrationsManager />
            </TabsContent>

            {/* Voice Agent Panel */}
            <TabsContent value="voice-agent">
              <VoiceAgentSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
  )
}
