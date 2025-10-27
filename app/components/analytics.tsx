"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Phone, Clock, Users, CheckCircle, XCircle, Download } from "lucide-react"

export function Analytics() {
  const metrics = [
    {
      title: "Total Calls",
      value: "1,247",
      change: "+12.5%",
      trend: "up",
      icon: Phone,
    },
    {
      title: "Success Rate",
      value: "94.2%",
      change: "+2.1%",
      trend: "up",
      icon: CheckCircle,
    },
    {
      title: "Avg Duration",
      value: "3m 42s",
      change: "-15s",
      trend: "down",
      icon: Clock,
    },
    {
      title: "Unique Callers",
      value: "892",
      change: "+8.3%",
      trend: "up",
      icon: Users,
    },
  ]

  const callOutcomes = [
    { outcome: "Successful", count: 1174, percentage: 94.2, color: "bg-green-500" },
    { outcome: "Failed", count: 45, percentage: 3.6, color: "bg-red-500" },
    { outcome: "Abandoned", count: 28, percentage: 2.2, color: "bg-yellow-500" },
  ]

  const topIntegrations = [
    { name: "Salesforce", calls: 456, success: 96.1 },
    { name: "HubSpot", calls: 342, success: 94.7 },
    { name: "Calendly", calls: 289, success: 92.4 },
    { name: "Slack", calls: 160, success: 98.1 },
  ]

  const recentCalls = [
    {
      id: "1",
      caller: "+1 (555) 123-4567",
      duration: "4m 23s",
      outcome: "Success",
      integration: "Salesforce",
      time: "2 hours ago",
    },
    {
      id: "2",
      caller: "+1 (555) 987-6543",
      duration: "2m 15s",
      outcome: "Success",
      integration: "HubSpot",
      time: "3 hours ago",
    },
    {
      id: "3",
      caller: "+1 (555) 456-7890",
      duration: "1m 08s",
      outcome: "Failed",
      integration: "Calendly",
      time: "4 hours ago",
    },
    {
      id: "4",
      caller: "+1 (555) 321-0987",
      duration: "5m 42s",
      outcome: "Success",
      integration: "Salesforce",
      time: "5 hours ago",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#081245]">Analytics</h2>
          <p className="text-gray-600">Monitor your AI voice agent performance</p>
        </div>
        <div className="flex space-x-2">
          <Select defaultValue="7d">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card
            key={index}
            className="bg-gradient-to-br from-blue-50 via-white to-blue-400 border-blue-200 shadow-lg text-slate-900"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-[#081245]">{metric.value}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    {metric.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-rose-500" />
                    )}
                    <span className={`text-sm ${metric.trend === "up" ? "text-emerald-700" : "text-rose-700"}`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
                <metric.icon className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Outcomes */}
        <Card className="bg-gradient-to-br from-blue-50 via-white to-blue-200 border-blue-200 text-slate-900">
          <CardHeader className="text-[#081245]">
            <CardTitle>Call Outcomes</CardTitle>
            <CardDescription>Distribution of call results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {callOutcomes.map((outcome, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${outcome.color}`} />
                    <span className="font-medium">{outcome.outcome}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-700">{outcome.count} calls</span>
                    <Badge className="bg-white/80 border-blue-200 text-slate-900">
                      {outcome.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full flex">
                {callOutcomes.map((outcome, index) => (
                  <div key={index} className={outcome.color} style={{ width: `${outcome.percentage}%` }} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Integrations */}
        <Card className="bg-gradient-to-br from-blue-50 via-white to-blue-200 border-blue-200 text-slate-900">
          <CardHeader className="text-[#081245]">
            <CardTitle>Top Integrations</CardTitle>
            <CardDescription>Most active integrations by call volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topIntegrations.map((integration, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-sm text-gray-600">{integration.calls} calls</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-emerald-100/80 text-emerald-800 border-emerald-200">
                      {integration.success}% success
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Calls */}
      <Card className="bg-gradient-to-br from-blue-50 via-white to-blue-200 border-blue-200 text-slate-900">
        <CardHeader className="text-[#081245]">
          <CardTitle>Recent Calls</CardTitle>
          <CardDescription>Latest call activity and outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Caller</th>
                  <th className="text-left py-2">Duration</th>
                  <th className="text-left py-2">Outcome</th>
                  <th className="text-left py-2">Integration</th>
                  <th className="text-left py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentCalls.map((call) => (
                  <tr key={call.id} className="border-b">
                    <td className="py-3 font-mono text-sm">{call.caller}</td>
                    <td className="py-3">{call.duration}</td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        {call.outcome === "Success" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={call.outcome === "Success" ? "text-green-700" : "text-red-700"}>
                          {call.outcome}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant="outline">{call.integration}</Badge>
                    </td>
                    <td className="py-3 text-gray-600">{call.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
