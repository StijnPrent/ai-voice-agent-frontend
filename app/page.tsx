"use client"

import {useEffect, useState} from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building2,
  Phone,
  Settings,
  BarChart3,
  Plug,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Activity, Bird, User, RefreshCcw, CirclePlus,
} from "lucide-react"
import { CompanyProfile } from "./components/company-profile"
import { IntegrationsManager } from "./components/integrations-manager"
import { VoiceAgentSettings } from "./components/voice-agent-settings"
import { Analytics } from "./components/analytics"
import {Update} from "@/lib/types/types";
import {BACKEND_URL} from "@/lib/api-config";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [loggedInUser, setLoggedInUser] = useState<boolean>(false)
  const [updates, setUpdates]       = useState<Update[]>([])
  const [loadingUpdates, setLoadingUpdates]       = useState<boolean>(false)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    // 1) Check for auth token
    const token = localStorage.getItem('auth_token')
    if (token) {
      setLoggedInUser(true)
    } else {
      setLoggedInUser(false)
      return // no token → skip fetching
    }

    // 2) If logged in, fetch updates
    async function loadUpdates() {
      setLoadingUpdates(true)
      setError(null)
      try {
        const res = await fetch(`${BACKEND_URL}/updates/get`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem('jwt')}` }
        })
        if (!res.ok) {
          throw new Error(`Failed to fetch updates: ${res.status}`)
        }
        const data: { update: string; createdAt: string; status: string }[] = await res.json()
        const models: Update[] = data.map(item => ({
          update:    item.update,
          createdAt: new Date(item.createdAt),
          status:    item.status,
        }))
        setUpdates(models)
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Unknown error')
      } finally {
        setLoadingUpdates(false)
      }
    }

    loadUpdates()
  }, [])

  const stats = [
    {
      title: "Active Calls",
      value: "24",
      change: "+12%",
      icon: Phone,
      color: "text-green-600",
    },
    {
      title: "Total Integrations",
      value: "8",
      change: "+2 this week",
      icon: Plug,
      color: "text-blue-600",
    },
    {
      title: "Call Success Rate",
      value: "94.2%",
      change: "+2.1%",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Avg Call Duration",
      value: "3m 42s",
      change: "-15s",
      icon: Clock,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Bird className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Calling Bird<sup className='text-s text-gray-400'>Demo</sup></h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Activity className="h-3 w-3 mr-1" />
                System Online
              </Badge>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                {loggedInUser ? "logout" : "Login"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Company</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center space-x-2">
              <Plug className="h-4 w-4" />
              <span>Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="voice-agent" className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Voice Agent</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className={`text-sm ${stat.color}`}>{stat.change}</p>
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates and system events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {updates.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        {activity.status === "created" ? (
                          <CirclePlus className="h-5 w-5 text-green-300" />
                        ) : (
                          <RefreshCcw className="h-5 w-5 text-blue-500" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.update}</p>
                          <p className="text-xs text-gray-500">
                            {activity.createdAt.toLocaleDateString('en-GB')}{" "}
                            {activity.createdAt.toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Integration
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Voice Settings
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Team Access
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Detailed Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="company">
            <CompanyProfile />
          </TabsContent>

          <TabsContent value="integrations">
            <IntegrationsManager />
          </TabsContent>

          <TabsContent value="voice-agent">
            <VoiceAgentSettings />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
