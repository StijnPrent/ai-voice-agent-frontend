"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Phone, Mail, Globe, Calendar } from "lucide-react"

export function CompanyProfile() {
  const [isEditing, setIsEditing] = useState(false)
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
    timezone: "America/Los_Angeles",
  })

  const handleSave = () => {
    setIsEditing(false)
    // Here you would typically save to your backend
    console.log("Saving company data:", companyData)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset to original data if needed
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Company Profile</h2>
          <p className="text-gray-600">Manage your company information and settings</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        ) : (
          <div className="space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        )}
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
                {isEditing ? (
                  <Input
                    id="company-name"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{companyData.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                {isEditing ? (
                  <Select
                    value={companyData.industry}
                    onValueChange={(value) => setCompanyData({ ...companyData, industry: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{companyData.industry}</p>
                )}
              </div>
              <div>
                <Label htmlFor="company-size">Company Size</Label>
                {isEditing ? (
                  <Select
                    value={companyData.size}
                    onValueChange={(value) => setCompanyData({ ...companyData, size: value })}
                  >
                    <SelectTrigger>
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
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{companyData.size} employees</p>
                )}
              </div>
              <div>
                <Label htmlFor="founded">Founded</Label>
                {isEditing ? (
                  <Input
                    id="founded"
                    value={companyData.founded}
                    onChange={(e) => setCompanyData({ ...companyData, founded: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{companyData.founded}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Company Description</Label>
              {isEditing ? (
                <Textarea
                  id="description"
                  value={companyData.description}
                  onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                  rows={3}
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">{companyData.description}</p>
              )}
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
                  {isEditing ? (
                    <Input
                      id="website"
                      value={companyData.website}
                      onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-blue-600">{companyData.website}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div className="flex-1">
                  <Label htmlFor="phone">Phone</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{companyData.phone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div className="flex-1">
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      value={companyData.email}
                      onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{companyData.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                <div className="flex-1">
                  <Label htmlFor="address">Address</Label>
                  {isEditing ? (
                    <Textarea
                      id="address"
                      value={companyData.address}
                      onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{companyData.address}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Business Settings</CardTitle>
          <CardDescription>Configure timezone and operational preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              {isEditing ? (
                <Select
                  value={companyData.timezone}
                  onValueChange={(value) => setCompanyData({ ...companyData, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="Europe/London">GMT</SelectItem>
                    <SelectItem value="Europe/Paris">CET</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-900 mt-1">Pacific Time (PT)</p>
              )}
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Badge variant="secondary">
                <Calendar className="h-3 w-3 mr-1" />
                Business Hours: 9 AM - 6 PM
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
