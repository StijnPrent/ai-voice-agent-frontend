"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Settings, CheckCircle, AlertCircle, ExternalLink, Search } from "lucide-react"

interface Integration {
  id: string
  name: string
  description: string
  category: string
  status: "connected" | "disconnected" | "error"
  logo: string
  isPopular?: boolean
  lastSync?: string
}

export function IntegrationsManager() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)

  const integrations: Integration[] = [
    {
      id: "salesforce",
      name: "Salesforce",
      description: "Sync customer data and manage leads automatically",
      category: "CRM",
      status: "connected",
      logo: "🏢",
      isPopular: true,
      lastSync: "2 hours ago",
    },
    {
      id: "hubspot",
      name: "HubSpot",
      description: "Marketing automation and customer relationship management",
      category: "CRM",
      status: "connected",
      logo: "🎯",
      isPopular: true,
      lastSync: "1 hour ago",
    },
    {
      id: "slack",
      name: "Slack",
      description: "Send notifications and updates to your team channels",
      category: "Communication",
      status: "connected",
      logo: "💬",
      lastSync: "30 minutes ago",
    },
    {
      id: "zapier",
      name: "Zapier",
      description: "Connect with 5000+ apps through automated workflows",
      category: "Automation",
      status: "disconnected",
      logo: "⚡",
      isPopular: true,
    },
    {
      id: "calendly",
      name: "Calendly",
      description: "Schedule meetings and appointments automatically",
      category: "Scheduling",
      status: "error",
      logo: "📅",
      lastSync: "Failed 2 days ago",
    },
    {
      id: "twilio",
      name: "Twilio",
      description: "SMS and voice communication platform",
      category: "Communication",
      status: "connected",
      logo: "📱",
      lastSync: "15 minutes ago",
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Payment processing and billing management",
      category: "Payment",
      status: "disconnected",
      logo: "💳",
    },
    {
      id: "google-calendar",
      name: "Google Calendar",
      description: "Sync appointments and schedule meetings",
      category: "Scheduling",
      status: "connected",
      logo: "📆",
      lastSync: "5 minutes ago",
    },
  ]

  const categories = ["all", "CRM", "Communication", "Automation", "Scheduling", "Payment"]

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || integration.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Connected</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>
      default:
        return <Badge variant="outline">Not Connected</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
          <p className="text-gray-600">Connect your favorite tools and services</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Browse All Integrations
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search integrations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === "all" ? "All" : category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => (
          <Card key={integration.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{integration.logo}</div>
                  <div>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span>{integration.name}</span>
                      {integration.isPopular && (
                        <Badge variant="secondary" className="text-xs">
                          Popular
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(integration.status)}
                      {getStatusBadge(integration.status)}
                    </div>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedIntegration(integration)}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <span className="text-2xl">{integration.logo}</span>
                        <span>{integration.name} Settings</span>
                      </DialogTitle>
                      <DialogDescription>Configure your {integration.name} integration settings</DialogDescription>
                    </DialogHeader>
                    <IntegrationSettings integration={integration} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {integration.lastSync && <span>Last sync: {integration.lastSync}</span>}
                </div>
                <div className="flex space-x-2">
                  {integration.status === "connected" ? (
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  ) : (
                    <Button size="sm">Connect</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIntegrations.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No integrations found matching your criteria.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("all")
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function IntegrationSettings({ integration }: { integration: Integration }) {
  const [isEnabled, setIsEnabled] = useState(integration.status === "connected")
  const [apiKey, setApiKey] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="enable-integration">Enable Integration</Label>
          <p className="text-sm text-gray-500">Turn this integration on or off</p>
        </div>
        <Switch id="enable-integration" checked={isEnabled} onCheckedChange={setIsEnabled} />
      </div>

      {isEnabled && (
        <>
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-gray-500">Your API key is encrypted and stored securely</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <div className="flex space-x-2">
              <Input
                id="webhook-url"
                placeholder="https://your-app.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button>Save Settings</Button>
            <Button variant="outline">Test Connection</Button>
          </div>
        </>
      )}
    </div>
  )
}
