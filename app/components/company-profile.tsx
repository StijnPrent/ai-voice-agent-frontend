"use client"

import {useState, useEffect, useCallback, useRef, ReactNode} from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {Building2, MapPin, Phone, Mail, Globe, X, Info} from "lucide-react"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import {BACKEND_URL} from "@/lib/api";
import {CompanyProfileSkeleton} from "@/components/skeletons/CompanyProfileSkeleton";
import {InfoTooltip} from "@/components/info-tooltip";
import {cn} from "@/lib/utils";

// Types
type DayKey =
    | "maandag"
    | "dinsdag"
    | "woensdag"
    | "donderdag"
    | "vrijdag"
    | "zaterdag"
    | "zondag"


interface DaySchedule {
  id?: number
  isOpen: boolean
  openTime: string
  closeTime: string
}

interface OperatingDays extends Record<DayKey, DaySchedule> {
  maandag: DaySchedule
  dinsdag: DaySchedule
  woensdag: DaySchedule
  donderdag: DaySchedule
  vrijdag: DaySchedule
  zaterdag: DaySchedule
  zondag: DaySchedule
}


interface CompanyData {
  name: string
  industry: string
  size: string
  website: string
  phone: string
  email: string
  address: string
  description: string
  founded: string
  operatingDays: OperatingDays
}

interface CustomInfoField {
  id: string
  value: string
  persistedId?: number
}

interface CompanyProfileProps {
  onDirtyChange?: (dirty: boolean) => void
}

interface InfoTooltipProps {
  label: string
  content: ReactNode
  iconClassName?: string
}

const InfoTooltipComponent = ({ label, content, iconClassName }: InfoTooltipProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        aria-label={`${label} toelichting`}
        className="text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-full"
      >
        <Info className={cn("h-4 w-4", iconClassName)} />
      </button>
    </TooltipTrigger>
    <TooltipContent side="top" align="start" className="max-w-xs text-sm leading-snug">
      {content}
    </TooltipContent>
  </Tooltip>
)

export function CompanyProfile({ onDirtyChange }: CompanyProfileProps) {
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: "",
    industry: "Technology",
    size: "100-500",
    website: "",
    phone: "",
    email: "",
    address: "",
    description: "",
    founded: "",
    operatingDays: {
      maandag: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      dinsdag: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      woensdag: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      donderdag: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      vrijdag: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      zaterdag: { isOpen: false, openTime: "09:00", closeTime: "17:00" },
      zondag: { isOpen: false, openTime: "09:00", closeTime: "17:00" },
    },
  })

  const [customInfo, setCustomInfo] = useState<CustomInfoField[]>([{ id: "1", value: "" }])
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [isDirty, setIsDirty] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const initialLoadCompleteRef = useRef(false);
  const isSavingRef = useRef(false);

  const handleCompanyDataChange = useCallback((updater: (prev: CompanyData) => CompanyData) => {
    setCompanyData(prev => {
      const next = updater(prev)
      if (initialLoadCompleteRef.current && !isSavingRef.current && next !== prev) {
        setIsDirty(true)
      }
      return next
    })
  }, [])

  const clearValidationError = useCallback((key: string) => {
    setValidationErrors((prev) => {
      if (!(key in prev)) {
        return prev
      }
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  // Load data from backend
  useEffect(() => {
    const token = localStorage.getItem("jwt")
    if (!token) {
      setIsLoading(false)
      initialLoadCompleteRef.current = true;
      return
    }

    const headers = { Authorization: `Bearer ${token}` }

    async function load() {
      try {
        // Load company details
        const detRes = await fetch(`${BACKEND_URL}/company/details`, { headers })
        if (detRes.ok) {
          const det = await detRes.json()
          setCompanyData(prev => ({
            ...prev,
            name: det.name || "",
            industry: det.industry || "Technology",
            size: det.size?.toString() || "100-500",
            description: det.description || "",
            founded: det.foundedYear?.toString() || "",
          }))
        }

        // Load company contacts
        const contactRes = await fetch(`${BACKEND_URL}/company/contact`, { headers })
        if (contactRes.ok) {
          const contact = await contactRes.json()
          if (contact) {
            setCompanyData(prev => ({
              ...prev,
              website: contact.website || "",
              phone: contact.phone || "",
              email: contact.contact_email || "",
              address: contact.address || "",
            }))
          }
        }

        // Load operating hours
        const hrRes = await fetch(`${BACKEND_URL}/company/hours`, { headers })
        if (hrRes.ok) {
          const hrs = await hrRes.json()
          const dayMap: Record<number, DayKey> = {
            1: "maandag",
            2: "dinsdag",
            3: "woensdag",
            4: "donderdag",
            5: "vrijdag",
            6: "zaterdag",
            0: "zondag",
          }


          setCompanyData(prev => {
            // Start with a shallow copy of the old days
            const updatedDays: Partial<OperatingDays> = { ...prev.operatingDays }

            // Fill in each day from the API
            for (const h of hrs) {
              const dayKey = dayMap[h.dayOfWeek]
              if (!dayKey) continue

              const existing = prev.operatingDays[dayKey]

              updatedDays[dayKey] = {
                ...existing,
                id: typeof h.id === "number" ? h.id : existing.id,
                isOpen: Boolean(h.isOpen),
                openTime: h.openTime ? h.openTime.slice(0, 5) : existing.openTime,
                closeTime: h.closeTime ? h.closeTime.slice(0, 5) : existing.closeTime,
              }
            }

            return {
              ...prev,
              operatingDays: updatedDays as OperatingDays,
            }
          })
        }

        // Load custom info
        const infRes = await fetch(`${BACKEND_URL}/company/info`, { headers });
        if (infRes.ok) {
          const infos = await infRes.json();
          const customInfoFields = infos.map((i: any) => ({
            id:         String(i.id),
            value:      i.infoValue || i.value || "",
            persistedId: i.id
          }));
          const nonEmptyFields = customInfoFields.filter((field: CustomInfoField) => field.value.trim() !== "");
          const placeholderField: CustomInfoField = { id: `placeholder-${Date.now()}`, value: "" };
          setCustomInfo([...nonEmptyFields, placeholderField]);
        }
      } catch (err) {
        console.error("Load error", err)
        setSaveStatus("error")
      } finally {
        setIsLoading(false)
        initialLoadCompleteRef.current = true;
        setIsDirty(false)
      }
    }

    load()
  }, [])

  const validateCompanyData = useCallback((data: CompanyData) => {
    const errors: Record<string, string> = {}

    if (!data.name.trim()) {
      errors.companyName = "Vul een bedrijfsnaam in."
    }

    const trimmedEmail = data.email.trim()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!trimmedEmail || !emailPattern.test(trimmedEmail)) {
      errors.email = "Vul een geldig e-mailadres in."
    }

    const digitsOnly = data.phone.replace(/\D/g, "")
    if (!data.phone.trim() || digitsOnly.length < 8) {
      errors.phone = "Vul een bereikbaar telefoonnummer in (minimaal 8 cijfers)."
    }

    if (!data.address.trim()) {
      errors.address = "Vul het bedrijfsadres in."
    }

    const openSchedules = Object.values(data.operatingDays).filter((schedule) => schedule.isOpen)
    if (openSchedules.length === 0) {
      errors.operatingDays = "Stel ten minste één openingsdag in."
    } else {
      for (const schedule of openSchedules) {
        if (!schedule.openTime || !schedule.closeTime) {
          errors.operatingDays = "Vul openingstijden en sluitingstijden in voor geopende dagen."
          break
        }
        if (schedule.closeTime <= schedule.openTime) {
          errors.operatingDays = "De sluitingstijd moet later zijn dan de openingstijd."
          break
        }
      }
    }

    return errors
  }, [])

  const saveData = useCallback(async () => {
    const token = localStorage.getItem("jwt");
    if (!token) return;

    if (!isDirty) {
      return;
    }

    const errors = validateCompanyData(companyData)
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setSaveStatus("error")
      return
    }

    isSavingRef.current = true;
    setSaveStatus("saving");
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      // 1) Save company details
      const detailsResponse = await fetch(
          `${BACKEND_URL}/company/details`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({
              name: companyData.name,
              industry: companyData.industry,
              size: companyData.size,
              foundedYear: Number(companyData.founded) || new Date().getFullYear(),
              description: companyData.description,
            }),
          }
      );
      if (!detailsResponse.ok) throw new Error("Failed to save company details");

      // 2) Save company contacts
      const contactBody = JSON.stringify({
        website: companyData.website,
        phone: companyData.phone,
        email: companyData.email,
        contact_email: companyData.email,
        address: companyData.address,
      });
      const contactsResponse = await fetch(
          `${BACKEND_URL}/company/contact`,
          { method: "PUT", headers, body: contactBody }
      );
      if (!contactsResponse.ok) throw new Error("Failed to save company contacts");

      // 3) Save operating hours (use record IDs)
      const dayMap: Record<DayKey, number> = {
        maandag: 1,
        dinsdag: 2,
        woensdag: 3,
        donderdag: 4,
        vrijdag: 5,
        zaterdag: 6,
        zondag: 0,
      };

      for (const [dayKey, dayNumber] of Object.entries(dayMap)) {
        const schedule = companyData.operatingDays[dayKey as DayKey];
        const payload = JSON.stringify({
          dayOfWeek: dayNumber,
          isOpen: schedule.isOpen,
          openTime: schedule.openTime,
          closeTime: schedule.closeTime,
        });

        let res: Response;
        if (schedule.id) {
          // Update existing record
          res = await fetch(
              `${BACKEND_URL}/company/hours/${schedule.id}`,
              { method: "PUT", headers, body: payload }
          );
        } else {
          // Create new record if missing
          res = await fetch(
              `${BACKEND_URL}/company/hours`,
              { method: "POST", headers, body: payload }
          );
        }

        if (!res.ok) {
          const errText = await res.text();
          console.error(`Error saving hours for ${dayKey}:`, errText);
        }
      }

      // 4) Save custom info fields
      for (const field of customInfo) {
        const trimmedValue = field.value.trim();
        if (!trimmedValue) continue;

        const payload: Record<string, unknown> = { value: trimmedValue };

        if (field.persistedId) {
          payload.id = field.persistedId;
          const response = await fetch(
              `${BACKEND_URL}/company/info`,
              {
                method: "PUT",
                headers,
                body: JSON.stringify(payload),
              }
          );
          if (!response.ok) console.error("Error updating custom info", await response.text());
        } else {
          const response = await fetch(
              `${BACKEND_URL}/company/info`,
              {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
              }
          );
          if (response.ok) {
            const created = await response.json();
            setCustomInfo(prev =>
                prev.map(f =>
                    f.id === field.id ? { ...f, persistedId: created.id, id: String(created.id) } : f
                )
            );
          } else {
            console.error("Error creating custom info", await response.text());
          }
        }
      }

      // 5) All done
      setIsDirty(false)
      setValidationErrors({})
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Save error", err);
      setSaveStatus("error");
    } finally {
      isSavingRef.current = false;
    }
  }, [companyData, customInfo, isDirty, validateCompanyData]);

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const handleCustomInfoChange = (id: string, value: string) => {
    setCustomInfo((prev) => {
      let changed = false
      let updated = prev.map((field) => {
        if (field.id === id && field.value !== value) {
          changed = true
          return { ...field, value }
        }
        return field
      })

      if (!updated.some((field) => field.id === id)) {
        changed = true
        updated = [...updated, { id, value }]
      }

      if (updated.length === 0) {
        changed = true
        updated = [{ id: Date.now().toString(), value: "" }]
      }

      const blankFields = updated.filter((field) => field.value.trim() === "")
      let placeholder: CustomInfoField
      if (blankFields.length === 0) {
        placeholder = { id: Date.now().toString(), value: "" }
        updated = [...updated, placeholder]
        changed = true
      } else {
        placeholder = blankFields[0]
        const filtered = updated.filter((field) => field.value.trim() !== "" || field === placeholder)
        if (filtered.length !== updated.length) {
          changed = true
        }
        updated = filtered
        if (updated[updated.length - 1] !== placeholder) {
          updated = [...updated.filter((field) => field !== placeholder), placeholder]
          changed = true
        }
      }

      if (changed && initialLoadCompleteRef.current && !isSavingRef.current) {
        setIsDirty(true)
      }

      return changed ? updated : prev
    })
  }

  const deleteCustomInfoField = async (id: string) => {
    const fieldToDelete = customInfo.find(f => f.id === id)

    // If this field is persisted, delete it from backend
    if (fieldToDelete?.persistedId) {
      const token = localStorage.getItem("jwt")
      if (token) {
        try {
          await fetch(`${BACKEND_URL}/company/info/${fieldToDelete.persistedId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          })
        } catch (err) {
          console.error("Delete error", err)
        }
      }
    }

    setCustomInfo((prev) => {
      let changed = false
      const filtered = prev.filter((field) => {
        if (field.id === id) {
          changed = true
          return false
        }
        return true
      })
      if (filtered.length === prev.length) {
        return prev
      }
      if (filtered.length === 0 || !filtered.some((field) => field.value.trim() === "")) {
        filtered.push({ id: Date.now().toString(), value: "" })
      }
      if (initialLoadCompleteRef.current && !isSavingRef.current) {
        setIsDirty(true)
      }
      return filtered
    })
  }

  const getSaveStatusBadge = () => {
    if (saveStatus === "saving") {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Opslaan…</Badge>
    }
    if (saveStatus === "error") {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Opslaan mislukt</Badge>
    }
    if (isDirty) {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Niet-opgeslagen wijzigingen</Badge>
    }
    if (saveStatus === "saved") {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Opgeslagen ✓</Badge>
    }
    return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Geen wijzigingen</Badge>
  }

  if (isLoading) {
    return (
        <CompanyProfileSkeleton></CompanyProfileSkeleton>
    )
  }

  return (
      <TooltipProvider delayDuration={0}>
        <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#081245]">Bedrijf profiel</h2>
            <p className="text-gray-600">Veranderingen worden niet automatisch opgeslagen. Klik op "Opslaan" om je updates te bewaren.</p>
          </div>
          <div className="flex items-center gap-3">
            {getSaveStatusBadge()}
            <Button
                onClick={() => void saveData()}
                disabled={saveStatus === "saving" || !isDirty}
                className="bg-[#0ea5e9] text-white hover:text-white hover:bg-[#0ca5e9]/70"
            >
              {saveStatus === "saving" ? "Opslaan…" : "Opslaan"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company Overview */}
          <Card className="lg:col-span-2">
            <CardHeader className="text-[#081245]">
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Bedrijf's informatie</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="company-name">bedrijf's naam</Label>
                    <InfoTooltip
                      label="bedrijf's naam"
                      content="Gebruik de volledige handelsnaam die klanten herkennen, zodat informatie consequent wordt weergegeven."
                    />
                  </div>
                  <Input
                      id="company-name"
                      value={companyData.name}
                      onChange={(e) => {
                        const value = e.target.value
                        clearValidationError("companyName")
                        handleCompanyDataChange(prev => {
                          if (prev.name === value) return prev
                          return { ...prev, name: value }
                        })
                      }}
                      className={`mt-1 ${validationErrors.companyName ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {validationErrors.companyName && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.companyName}</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="industry">Industrie</Label>
                    <InfoTooltip
                      label="Industrie"
                      content="Kies de sector die het beste bij je bedrijf past, zodat de AI relevante voorbeelden en terminologie gebruikt."
                    />
                  </div>
                  <Select
                      value={companyData.industry}
                      onValueChange={(value) => handleCompanyDataChange(prev => {
                        if (prev.industry === value) return prev
                        return { ...prev, industry: value }
                      })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technologie">Technologie</SelectItem>
                      <SelectItem value="Kapper">Kapper</SelectItem>
                      <SelectItem value="Schoonheidssalon">Schoonheidssalon</SelectItem>
                      <SelectItem value="Wellness & Spa">Wellness & Spa</SelectItem>
                      <SelectItem value="Zonnenbank">Zonnenbank</SelectItem>
                      <SelectItem value="Massagesalon">Massagesalon</SelectItem>
                      <SelectItem value="Nagelstudio">Nagelstudio</SelectItem>
                      <SelectItem value="Microblading">Microblading</SelectItem>
                      <SelectItem value="Make-up">Make-up</SelectItem>
                      <SelectItem value="Overig">Overig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="company-size">Bedrijf's grootte</Label>
                    <InfoTooltip
                      label="Bedrijf's grootte"
                      content="Selecteer het werknemersaantal dat het dichtst bij jullie situatie ligt. Dit helpt verwachtingen bij klanten te managen."
                    />
                  </div>
                  <Select
                      value={companyData.size}
                      onValueChange={(value) => handleCompanyDataChange(prev => {
                        if (prev.size === value) return prev
                        return { ...prev, size: value }
                      })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 Werknemers</SelectItem>
                      <SelectItem value="11-50">11-50 Werknemers</SelectItem>
                      <SelectItem value="51-100">51-100 Werknemers</SelectItem>
                      <SelectItem value="100-500">100-500 Werknemers</SelectItem>
                      <SelectItem value="500+">500+ Werknemers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="founded">Opgericht</Label>
                    <InfoTooltip
                      label="Opgericht"
                      content="Vul het jaar of de datum van oprichting in (bijv. 2018). Dit geeft context over jullie ervaring."
                    />
                  </div>
                  <Input
                      id="founded"
                      value={companyData.founded}
                      onChange={(e) => handleCompanyDataChange(prev => {
                        const value = e.target.value
                        if (prev.founded === value) return prev
                        return { ...prev, founded: value }
                      })}
                      placeholder="Year founded"
                      className="mt-1"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="description">Bedrijf's beschrijving</Label>
                  <InfoTooltip
                    label="Bedrijf's beschrijving"
                    content="Beschrijf in twee tot drie zinnen wat jullie doen, voor wie en wat jullie onderscheidt."
                  />
                </div>
                <Textarea
                    id="description"
                    value={companyData.description}
                    onChange={(e) => handleCompanyDataChange(prev => {
                      const value = e.target.value
                      if (prev.description === value) return prev
                      return { ...prev, description: value }
                    })}
                    rows={3}
                    className="mt-1"
                    placeholder="Describe your company..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader className="text-[#081245]">
              <CardTitle>Contact Informatie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="website">Website</Label>
                      <InfoTooltip
                        label="Website"
                        content="Voer de volledige URL inclusief https:// in. Dit is de link die we kunnen delen met klanten."
                      />
                    </div>
                    <Input
                        id="website"
                        value={companyData.website}
                        onChange={(e) => handleCompanyDataChange(prev => {
                          const value = e.target.value
                          if (prev.website === value) return prev
                          return { ...prev, website: value }
                        })}
                        placeholder="https://jouwbedrijf.com"
                        className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="phone">Telefoonnummer</Label>
                      <InfoTooltip
                        label="Telefoonnummer"
                        content="Gebruik het nummer waarop klanten je mogen bereiken, inclusief landcode voor internationale bellers."
                      />
                    </div>
                    <Input
                        id="phone"
                        value={companyData.phone}
                        onChange={(e) => {
                          const value = e.target.value
                          clearValidationError("phone")
                          handleCompanyDataChange(prev => {
                            if (prev.phone === value) return prev
                            return { ...prev, phone: value }
                          })
                        }}
                        placeholder="+31612131415"
                        className={`mt-1 ${validationErrors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {validationErrors.phone && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="email">Contact Email</Label>
                      <InfoTooltip
                        label="Contact Email"
                        content="Voer het e-mailadres in voor klantvragen of support. De AI verwijst hiernaar bij vervolgvragen."
                      />
                    </div>
                    <Input
                        id="email"
                        value={companyData.email}
                        onChange={(e) => {
                          const value = e.target.value
                          clearValidationError("email")
                          handleCompanyDataChange(prev => {
                            if (prev.email === value) return prev
                            return { ...prev, email: value }
                          })
                        }}
                        placeholder="contact@bedrijf.com"
                        className={`mt-1 ${validationErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {validationErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="address">Adress</Label>
                      <InfoTooltip
                        label="Adress"
                        content="Noteer straat, huisnummer, postcode en plaats. Dit helpt de AI om bezoekers de juiste locatie te geven."
                      />
                    </div>
                    <Textarea
                        id="address"
                        value={companyData.address}
                        onChange={(e) => {
                          const value = e.target.value
                          clearValidationError("address")
                          handleCompanyDataChange(prev => {
                            if (prev.address === value) return prev
                            return { ...prev, address: value }
                          })
                        }}
                        rows={2}
                        placeholder="Company address"
                        className={`mt-1 ${validationErrors.address ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {validationErrors.address && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Settings */}
        <Card>
          <CardHeader className="text-[#081245]">
            <CardTitle>Bedrijf's instellingen</CardTitle>
            <CardDescription>Configureer de openingstijden voor elke dag</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <Label className="text-base font-medium">Openingstijden</Label>
                  <InfoTooltip
                    label="Openingstijden"
                    content="Geef aan wanneer klanten jullie kunnen bereiken of bezoeken. De AI gebruikt dit om afspraken te plannen."
                  />
                </div>
                {validationErrors.operatingDays && (
                    <p className="mt-2 text-sm text-red-600">{validationErrors.operatingDays}</p>
                )}
                <div className="mt-3 space-y-4">
                  {[
                    { day: "Maandag", key: "maandag" as DayKey },
                    { day: "Dinsdag", key: "dinsdag" as DayKey },
                    { day: "Woensdag", key: "woensdag" as DayKey },
                    { day: "Donderdag", key: "donderdag" as DayKey },
                    { day: "Vrijdag", key: "vrijdag" as DayKey },
                    { day: "Zaterdag", key: "zaterdag" as DayKey },
                    { day: "Zondag", key: "zondag" as DayKey },
                  ].map(({ day, key }) => (
                      <div key={key} className="flex items-center space-x-4 p-3 border rounded-lg">
                        <div className="w-28 flex items-center gap-2">
                          <Label className="text-sm font-medium">{day}</Label>
                          <InfoTooltip
                            label={`Openingstijden ${day}`}
                            content="Gebruik de knop om de dag open of dicht te zetten en pas vervolgens de tijden aan."
                            iconClassName="h-3.5 w-3.5"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                              type="button"
                              variant={companyData.operatingDays[key].isOpen ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                clearValidationError("operatingDays")
                                handleCompanyDataChange(prev => {
                                  const currentDay = prev.operatingDays[key]
                                  return {
                                    ...prev,
                                    operatingDays: {
                                      ...prev.operatingDays,
                                      [key]: {
                                        ...currentDay,
                                        isOpen: !currentDay.isOpen,
                                      },
                                    },
                                  }
                                })
                              }}
                          >
                            {companyData.operatingDays[key].isOpen ? "Open" : "Dicht"}
                          </Button>
                        </div>
                        {companyData.operatingDays[key].isOpen && (
                            <>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm">Van:</Label>
                                  <InfoTooltip
                                    label="Openingstijd"
                                    content="Selecteer het tijdstip waarop jullie openen. Gebruik de 24-uurs notatie."
                                    iconClassName="h-3.5 w-3.5"
                                  />
                                </div>
                                <Input
                                    type="time"
                                    value={companyData.operatingDays[key].openTime}
                                    onChange={(e) => {
                                      const value = e.target.value
                                      clearValidationError("operatingDays")
                                      handleCompanyDataChange(prev => {
                                        const currentDay = prev.operatingDays[key]
                                        if (currentDay.openTime === value) return prev
                                        return {
                                          ...prev,
                                          operatingDays: {
                                            ...prev.operatingDays,
                                            [key]: {
                                              ...currentDay,
                                              openTime: value,
                                            },
                                          },
                                        }
                                      })
                                    }}
                                    className={`w-32 ${validationErrors.operatingDays ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm">Tot:</Label>
                                  <InfoTooltip
                                    label="Sluitingstijd"
                                    content="Kies het tijdstip waarop jullie sluiten. Zorg dat dit later is dan de openingstijd."
                                    iconClassName="h-3.5 w-3.5"
                                  />
                                </div>
                                <Input
                                    type="time"
                                    value={companyData.operatingDays[key].closeTime}
                                    onChange={(e) => {
                                      const value = e.target.value
                                      clearValidationError("operatingDays")
                                      handleCompanyDataChange(prev => {
                                        const currentDay = prev.operatingDays[key]
                                        if (currentDay.closeTime === value) return prev
                                        return {
                                          ...prev,
                                          operatingDays: {
                                            ...prev.operatingDays,
                                            [key]: {
                                              ...currentDay,
                                              closeTime: value,
                                            },
                                          },
                                        }
                                      })
                                    }}
                                    className={`w-32 ${validationErrors.operatingDays ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                />
                              </div>
                            </>
                        )}
                      </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm text-gray-600">
                  <strong>Huidige openingstijden:</strong>
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  🇳🇱 Netherlands (CET/CEST)
                </Badge>
              </div>

              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">Openingstijden & Uren:</div>
                  {Object.entries(companyData.operatingDays)
                      .filter(([_, schedule]) => schedule.isOpen)
                      .map(([day, schedule]) => (
                          <div key={day} className="flex justify-between">
                            <span className="capitalize">{day}:</span>
                            <span>{schedule.openTime} - {schedule.closeTime}</span>
                          </div>
                      ))}
                  {Object.values(companyData.operatingDays).every(schedule => !schedule.isOpen) && (
                      <div className="text-gray-500 italic">Geen openingsdagen ingesteld</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Company Information */}
        <Card>
          <CardHeader className="text-[#081245]">
            <CardTitle className="flex items-center gap-2">
              Extra bedrijf's informatie
              <InfoTooltip
                label="Extra bedrijf's informatie"
                content="Voeg hier losse weetjes of belangrijke feiten toe die de AI moet kennen, zoals awards, doelgroepen of unieke werkwijzen."
              />
            </CardTitle>
            <CardDescription>
              Voeg specifieke details over je bedrijf toe. Nieuwe velden verschijnen automatisch zodra je begint te typen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customInfo.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <InfoTooltip
                      label={`Extra detail ${index + 1}`}
                      content="Gebruik elk veld voor één los feit of verhaal. Houd het kort en concreet zodat de AI het makkelijk kan herhalen."
                    />
                    <div className="flex-1">
                      <Input
                          id={`custom-info-${field.id}`}
                          value={field.value}
                          onChange={(e) => handleCustomInfoChange(field.id, e.target.value)}
                          placeholder={`Bedrijf's informatie ${index + 1} (bijv. "Opgericht door voormalige Google-ingenieurs", "Bedient meer dan 10.000 klanten wereldwijd")`}
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
                      <strong>Voorbeeld:</strong> Deze details helpen om de kennis van je AI-assistent over je bedrijf te personaliseren.
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
              <h3 className="text-sm font-medium text-[#081245]">💡 Tips voor betere prestaties van je AI-assistent:</h3>
              <ul className="text-xs text-blue-700 space-y-1 ml-4">
                <li>• Vermeld de unieke waardepropositie van je bedrijf</li>
                <li>• Noem belangrijke prestaties of mijlpalen</li>
                <li>• Geef informatie over je doelgroep</li>
                <li>• Vermeld eventuele prijzen of certificeringen</li>
                <li>• Beschrijf de bedrijfscultuur of kernwaarden</li>
                <li>• Voeg details toe over je producten of diensten</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}