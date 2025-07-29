// src/components/IntegrationsManager.tsx
"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Settings, CheckCircle, AlertCircle, Search } from "lucide-react"
import { BACKEND_URL } from "@/lib/api-config"
import {Integration} from "@/lib/types/types";

export function IntegrationsManager() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchIntegrations() {
      try {
        const res = await fetch(`${BACKEND_URL}/integrations/get`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem('jwt')}` }
        })
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`)
        const data: Integration[] = await res.json()
        setIntegrations(data)
      } catch (err: any) {
        setError(err.message || "Error fetching integrations")
      } finally {
        setLoading(false)
      }
    }
    fetchIntegrations()
  }, [])

  const filtered = integrations.filter(i => {
    const matchesSearch =
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
        selectedCategory === "all" || i.category === selectedCategory
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

  if (loading) return <div>Loading integrations…</div>
  if (error) return <div className="text-red-600">{error}</div>

  const categories = Array.from(
      new Set(["all", ...integrations.map(i => i.category)])
  )

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
            <p className="text-gray-600">Connect your favorite tools and services</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Browse All Integrations
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="Search integrations..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {categories.map(cat => (
                    <Button
                        key={cat}
                        variant={selectedCategory === cat ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(cat)}
                    >
                      {cat === "all" ? "All" : cat}
                    </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(integration => (
              <Card key={integration.key} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Image
                      src={integration.logo}
                      width={40}
                      height={40}
                      alt={`${integration.name} logo`}
                      />
                      <div>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <span>{integration.name}</span>
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusIcon(integration.status)}
                          {getStatusBadge(integration.status)}
                        </div>
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedIntegration(integration)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            <span className="text-2xl">{integration.logo}</span>
                            <span>{integration.name} Settings</span>
                          </DialogTitle>
                          <DialogDescription>
                            Configure your {integration.name} integration settings
                          </DialogDescription>
                        </DialogHeader>
                        {/* IntegrationSettings component */}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {integration.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {integration.lastSync && <span>Last sync: {new Date(integration.lastSync).toLocaleString()}</span>}
                    </div>
                    <div className="flex space-x-2">
                      {integration.status === "connected" ? (
                          <Button variant="outline" size="sm">Configure</Button>
                      ) : (
                          <Button size="sm">Connect</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>
      </div>
  )
}
