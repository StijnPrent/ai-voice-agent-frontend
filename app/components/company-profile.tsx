"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Phone, Mail, Globe, X } from "lucide-react"

interface CustomInfoField {
  id: string
  value: string
}

export function CompanyProfile() {
  const [companyData, setCompanyData] = useState({
    name: "Acme Corporation",
    industry: "Technology",
    size: "100-500",
    website: "https://acme.com",
    phone: "+1 (555) 123-4567",
    email: "contact@acme.com",
    address: "123 Business Ave, San Francisco, CA 94105",
    description: "Leading technology company focused on innovative solutions for modern businesses.",
    founded: "2015",
    openingTime: "09:00",
    closingTime: "17:00",
    operatingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
    timezone: "America/Los_Angeles",
  })

  const [customInfo, setCustomInfo] = useState<CustomInfoField[]>([{ id: "1", value: "" }])

  // Auto-save functionality
  useEffect(() => {
    const saveData = () => {
      console.log("Auto-saving company data:", { companyData, customInfo })
      // Here you would typically save to your backend
    }

    const timeoutId = setTimeout(saveData, 1000)
    return () => clearTimeout(timeoutId)
  }, [companyData, customInfo])

  const handleCustomInfoChange = (id: string, value: string) => {
    setCustomInfo((prev) => {
      const updated = prev.map((field) => (field.id === id ? { ...field, value } : field))

      // If the last field has content and there's no empty field after it, add a new one
      const lastField = updated[updated.length - 1]
      if (lastField.value.trim() !== "" && !updated.some((field) => field.value.trim() === "")) {
        updated.push({ id: Date.now().toString(), value: "" })
      }

      return updated
    })
  }

  const deleteCustomInfoField = (id: string) => {
    setCustomInfo((prev) => {
      const filtered = prev.filter((field) => field.id !== id)
      // Ensure there's always at least one empty field
      if (filtered.length === 0 || !filtered.some((field) => field.value.trim() === "")) {
        filtered.push({ id: Date.now().toString(), value: "" })
      }
      return filtered
    })
  }

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Company Profile</h2>
            <p className="text-gray-600">All changes are automatically saved</p>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Auto-save enabled
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company Overview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Company Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                      id="company-name"
                      value={companyData.name}
                      onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                      className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                      value={companyData.industry}
                      onValueChange={(value) => setCompanyData({ ...companyData, industry: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Real Estate">Real Estate</SelectItem>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="company-size">Company Size</Label>
                  <Select
                      value={companyData.size}
                      onValueChange={(value) => setCompanyData({ ...companyData, size: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-100">51-100 employees</SelectItem>
                      <SelectItem value="100-500">100-500 employees</SelectItem>
                      <SelectItem value="500+">500+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="founded">Founded</Label>
                  <Input
                      id="founded"
                      value={companyData.founded}
                      onChange={(e) => setCompanyData({ ...companyData, founded: e.target.value })}
                      placeholder="Year founded"
                      className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                    id="description"
                    value={companyData.description}
                    onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                    rows={3}
                    className="mt-1"
                    placeholder="Describe your company..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <div className="flex-1">
                    <Label htmlFor="website">Website</Label>
                    <Input
                        id="website"
                        value={companyData.website}
                        onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                        placeholder="https://yourcompany.com"
                        className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div className="flex-1">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                        id="phone"
                        value={companyData.phone}
                        onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div className="flex-1">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        value={companyData.email}
                        onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                        placeholder="contact@company.com"
                        className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                        id="address"
                        value={companyData.address}
                        onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                        rows={2}
                        placeholder="Company address"
                        className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Business Settings</CardTitle>
            <CardDescription>Configure timezone and operational preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="opening-time">Opening Time</Label>
                  <Input
                      id="opening-time"
                      type="time"
                      value={companyData.openingTime || "09:00"}
                      onChange={(e) => setCompanyData({ ...companyData, openingTime: e.target.value })}
                      className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="closing-time">Closing Time</Label>
                  <Input
                      id="closing-time"
                      type="time"
                      value={companyData.closingTime || "17:00"}
                      onChange={(e) => setCompanyData({ ...companyData, closingTime: e.target.value })}
                      className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Operating Days</Label>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {[
                    { day: "Mon", key: "monday" },
                    { day: "Tue", key: "tuesday" },
                    { day: "Wed", key: "wednesday" },
                    { day: "Thu", key: "thursday" },
                    { day: "Fri", key: "friday" },
                    { day: "Sat", key: "saturday" },
                    { day: "Sun", key: "sunday" },
                  ].map(({ day, key }) => (
                      <div key={key} className="flex flex-col items-center space-y-1">
                        <Label className="text-xs font-medium">{day}</Label>
                        <Button
                            type="button"
                            variant={companyData.operatingDays?.[key] !== false ? "default" : "outline"}
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={() => {
                              const currentDays = companyData.operatingDays || {}
                              setCompanyData({
                                ...companyData,
                                operatingDays: {
                                  ...currentDays,
                                  [key]: currentDays[key] !== false ? false : true,
                                },
                              })
                            }}
                        >
                          {companyData.operatingDays?.[key] !== false ? "Open" : "Closed"}
                        </Button>
                      </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm text-gray-600">
                  <strong>Current Schedule:</strong>
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  🇳🇱 Netherlands (CET/CEST)
                </Badge>
              </div>

              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span>Business Hours:</span>
                  <span className="font-medium">
                  {companyData.openingTime || "09:00"} - {companyData.closingTime || "17:00"}
                </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span>Operating Days:</span>
                  <span className="font-medium">
                  {Object.entries(
                      companyData.operatingDays || {
                        monday: true,
                        tuesday: true,
                        wednesday: true,
                        thursday: true,
                        friday: true,
                        saturday: false,
                        sunday: false,
                      },
                  )
                      .filter(([_, isOpen]) => isOpen)
                      .map(([day, _]) => day.charAt(0).toUpperCase() + day.slice(1, 3))
                      .join(", ") || "Monday - Friday"}
                </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Company Information</CardTitle>
            <CardDescription>
              Add specific details about your company. New fields will appear automatically as you type.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customInfo.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <div className="flex-1">
                      <Input
                          value={field.value}
                          onChange={(e) => handleCustomInfoChange(field.id, e.target.value)}
                          placeholder={`Company detail ${index + 1} (e.g., "Founded by former Google engineers", "Serving 10,000+ customers worldwide")`}
                          className="w-full"
                      />
                    </div>
                    {(customInfo.length > 1 || field.value.trim() !== "") && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCustomInfoField(field.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                    )}
                  </div>
              ))}

              {customInfo.filter((field) => field.value.trim() !== "").length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-500">
                      <strong>Preview:</strong> These details will help customize your AI agent's knowledge about your
                      company.
                    </p>
                    <div className="mt-2 space-y-1">
                      {customInfo
                          .filter((field) => field.value.trim() !== "")
                          .map((field, index) => (
                              <div key={field.id} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                • {field.value}
                              </div>
                          ))}
                    </div>
                  </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-blue-900">💡 Tips for better AI agent performance:</h3>
              <ul className="text-xs text-blue-700 space-y-1 ml-4">
                <li>• Include your company's unique value propositions</li>
                <li>• Mention key achievements or milestones</li>
                <li>• Add information about your target customers</li>
                <li>• Include any awards or certifications</li>
                <li>• Mention your company culture or values</li>
                <li>• Add details about your products or services</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
  )
}
