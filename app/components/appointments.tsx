"use client"

import {useEffect, useMemo, useRef, useState} from "react"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {CalendarArrowUp, Users} from "lucide-react"
import AppointmentTypesTab from "@/components/AppointmentTypesTab"
import StaffMembersTab from "@/components/StaffMembersTab"
import { useToast } from "@/hooks/use-toast"

import {
    getAppointmentTypes,
    addAppointmentType,
    updateAppointmentType,
    deleteAppointmentType,
    getStaffMembers,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    getGoogleCalendars,
    getAppointmentCategories,
    emptyWeek,
} from "@/lib/schedulingApi"
import type { AppointmentPreset } from "@/app/types/appointments"
import type { NewStaffMemberForm, StaffDraft } from "@/app/types/staff"
import type {
    AppointmentCategory,
    AppointmentTypeForm,
    UIAppointmentType,
    UIStaffMember,
    UISpecialty,
    UIAvailability,
    GoogleCalendar,
    UITimeBlock,
} from "@/lib/schedulingApi"

type DayKey = keyof UIAvailability;
const DAY_ORDER: DayKey[] = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

function calendarDisplayLabel(calendar?: Pick<GoogleCalendar, "displayName" | "summary" | "summaryOverride" | "id"> | null) {
    if (!calendar) return null;
    return calendar.displayName ?? calendar.summary ?? calendar.summaryOverride ?? calendar.id ?? null;
}

interface AppointmentsProps {
    onDirtyChange?: (dirty: boolean) => void
}

export default function Appointments({ onDirtyChange }: AppointmentsProps) {
    /* ----------------------------- State ----------------------------- */
    const [appointmentTypes, setAppointmentTypes] = useState<UIAppointmentType[]>([])
    const [appointmentCategories, setAppointmentCategories] = useState<AppointmentCategory[]>([])
    const [staffMembers, setStaffMembers] = useState<UIStaffMember[]>([])
    const [calendars, setCalendars] = useState<GoogleCalendar[]>([])

    const [newAppointmentType, setNewAppointmentType] = useState<AppointmentTypeForm>({
        name: "",
        duration: 30,
        price: undefined,
        description: "",
        categoryId: null,
    })
    const [presetOptions, setPresetOptions] = useState<AppointmentPreset[]>([])
    const [presetsLoading, setPresetsLoading] = useState(true)
    const [presetsError, setPresetsError] = useState<string | null>(null)
    const [isPresetDialogOpen, setPresetDialogOpen] = useState(false)
    const [pendingPreset, setPendingPreset] = useState<AppointmentPreset | null>(null)
    const [pendingDuration, setPendingDuration] = useState<number>(30)
    const [pendingPrice, setPendingPrice] = useState<string>("")
    const [lastAppliedPreset, setLastAppliedPreset] = useState<AppointmentPreset | null>(null)
    const [prefillFlashFields, setPrefillFlashFields] = useState<string[]>([])
    const [deleteTarget, setDeleteTarget] = useState<UIAppointmentType | null>(null)
    const [creatingAppointment, setCreatingAppointment] = useState(false)
    const [deletingAppointment, setDeletingAppointment] = useState(false)
    const { toast } = useToast()

    const [newStaffMember, setNewStaffMember] = useState<NewStaffMemberForm>({
        name: "",
        role: "",
        specialties: "",
        availability: emptyWeek(),
        googleCalendarId: null,
        googleCalendarSummary: null,
    })
    const [creatingStaff, setCreatingStaff] = useState(false)
    const [staffFieldTouched, setStaffFieldTouched] = useState<{ name: boolean; role: boolean }>({ name: false, role: false })
    const lastSavedAvailabilityRef = useRef<UIAvailability | null>(null)

    const [editingAppointment, setEditingAppointment] = useState<string | null>(null)
    const [editingStaff, setEditingStaff] = useState<string | null>(null)
    const [staffDraft, setStaffDraft] = useState<StaffDraft | null>(null)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const hasCalendars = calendars.length > 0

    /* ----------------------------- Load ----------------------------- */
    useEffect(() => {
        async function load() {
            try {
                setLoading(true)
                const [apt, staff, calendarList, categoryList] = await Promise.all([
                    getAppointmentTypes(),
                    getStaffMembers(),
                    getGoogleCalendars().catch(err => {
                        console.warn("Failed to load Google calendars", err)
                        return []
                    }),
                    getAppointmentCategories().catch(err => {
                        console.warn("Failed to load appointment categories", err)
                        return []
                    }),
                ])
                setAppointmentTypes(apt)
                setStaffMembers(staff)
                setCalendars(calendarList)
                setAppointmentCategories(categoryList)
            } catch (err: any) {
                setError(err.message || "Failed to load data")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    useEffect(() => {
        let active = true
        async function loadPresets() {
            try {
                setPresetsLoading(true)
                setPresetsError(null)
                const res = await fetch("/appointment-presets.json", { cache: "force-cache" })
                if (!res.ok) throw new Error("Failed to load presets")
                const data: AppointmentPreset[] = await res.json()
                if (!active) return
                setPresetOptions(data)
            } catch (err) {
                if (!active) return
                console.error("Preset fetch failed", err)
                setPresetsError("Kon presets niet laden")
            } finally {
                if (active) setPresetsLoading(false)
            }
        }
        loadPresets()
        return () => {
            active = false
        }
    }, [])

    useEffect(() => {
        if (!isPresetDialogOpen) {
            setPendingPreset(null)
            setPendingDuration(30)
            setPendingPrice("")
        }
    }, [isPresetDialogOpen])

    useEffect(() => {
        if (!prefillFlashFields.length) return
        const timer = setTimeout(() => setPrefillFlashFields([]), 1600)
        return () => clearTimeout(timer)
    }, [prefillFlashFields])

    /* ----------------------- Appointment Types ----------------------- */
    const handleAddAppointmentType = async () => {
        if (!newAppointmentType.name || !newAppointmentType.duration) return
        try {
            setCreatingAppointment(true)
            const created = await addAppointmentType(newAppointmentType)
            setAppointmentTypes([...appointmentTypes, created])
            setNewAppointmentType({ name: "", duration: 30, price: undefined, description: "", categoryId: null })
            setLastAppliedPreset(null)
            toast({
                title: "Afspraaktype toegevoegd",
                description: `${created.name} is opgeslagen.`,
            })
        } catch (err: any) {
            const message = err?.message ?? "Opslaan mislukt"
            setError(message)
            toast({
                title: "Opslaan mislukt",
                description: message,
                variant: "destructive",
            })
        } finally {
            setCreatingAppointment(false)
        }
    }

    const handleUpdateAppointmentType = async (id: string, updates: AppointmentTypeForm) => {
        try {
            const updated = await updateAppointmentType({ id, ...updates })
            setAppointmentTypes(appointmentTypes.map(apt => apt.id === id ? updated : apt))
            setEditingAppointment(null)
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleDeleteAppointmentType = async () => {
        if (!deleteTarget) return
        try {
            setDeletingAppointment(true)
            await deleteAppointmentType(deleteTarget.id)
            setAppointmentTypes(appointmentTypes.filter(apt => apt.id !== deleteTarget.id))
            toast({
                title: "Afspraaktype verwijderd",
                description: `${deleteTarget.name} is verwijderd.`,
            })
        } catch (err: any) {
            const message = err?.message ?? "Verwijderen mislukt"
            setError(message)
            toast({
                title: "Verwijderen mislukt",
                description: message,
                variant: "destructive",
            })
        } finally {
            setDeletingAppointment(false)
            setDeleteTarget(null)
        }
    }

    /* ----------------------------- Staff ---------------------------- */
    const defaultTimeBlock = () => ({ startTime: "09:00", endTime: "17:00" })

    const normalizeBlocks = (blocks?: UITimeBlock[]) => (blocks && blocks.length ? blocks : [defaultTimeBlock()])

    const availabilityEquals = (a: UIAvailability, b: UIAvailability) =>
        DAY_ORDER.every(day => {
            const dayA = a[day]
            const dayB = b[day]
            if (dayA.isWorking !== dayB.isWorking) return false
            const blocksA = normalizeBlocks(dayA.blocks)
            const blocksB = normalizeBlocks(dayB.blocks)
            if (blocksA.length !== blocksB.length) return false
            return blocksA.every((block, idx) =>
                block.startTime === blocksB[idx].startTime && block.endTime === blocksB[idx].endTime
            )
        })

    const availabilityIsDefault = (availability: UIAvailability) => availabilityEquals(availability, emptyWeek())

    const dayLabels: Record<DayKey, string> = {
        monday: "Maandag",
        tuesday: "Dinsdag",
        wednesday: "Woensdag",
        thursday: "Donderdag",
        friday: "Vrijdag",
        saturday: "Zaterdag",
        sunday: "Zondag",
    }

    const dayShortLabel = (day: DayKey) => dayLabels[day].slice(0, 2)

    function parseSpecialtyString(s: string): UISpecialty[] {
        return s.split(",").map(x => x.trim()).filter(Boolean).map(n => ({ name: n }));
    }
    function specialtiesToString(arr: UISpecialty[]): string {
        return (arr ?? []).map(s => s.name).join(", ");
    }

    // Derived "isActive" for UI (at least one working day)
    function isActiveFromAvailability(av: UIAvailability): boolean {
        return Object.values(av).some(d => d.isWorking && normalizeBlocks(d.blocks).length > 0);
    }
    const activeStaffCount = useMemo(
        () => staffMembers.filter(s => isActiveFromAvailability(s.availability)).length,
        [staffMembers]
    );

    const workingDaysForAvailability = (availability: UIAvailability) =>
        DAY_ORDER.filter(day => availability[day].isWorking && normalizeBlocks(availability[day].blocks).length > 0).length

    const applyAvailabilityTemplate = (template: "weekday" | "weekend" | "copy" | "clear") => {
        if (template === "copy") {
            const snapshot = lastSavedAvailabilityRef.current
            if (!snapshot) {
                toast({
                    title: "Geen eerdere week",
                    description: "Voeg eerst een medewerker toe om een schema te kunnen kopiëren.",
                    variant: "destructive",
                })
                return
            }
            setNewStaffMember(prev => ({
                ...prev,
                availability: JSON.parse(JSON.stringify(snapshot)) as UIAvailability,
            }))
            return
        }
        if (template === "clear") {
            setNewStaffMember(prev => ({
                ...prev,
                availability: emptyWeek(),
            }))
            return
        }

        const targetDays =
            template === "weekday"
                ? ["monday", "tuesday", "wednesday", "thursday", "friday"]
                : ["saturday", "sunday"]

        setNewStaffMember(prev => {
            const nextAvailability = { ...prev.availability }
            DAY_ORDER.forEach(day => {
                const isTarget = targetDays.includes(day)
                if (template === "weekday") {
                    nextAvailability[day as DayKey] = {
                        isWorking: isTarget,
                        blocks: isTarget ? [defaultTimeBlock()] : [{ ...defaultTimeBlock() }],
                    }
                } else {
                    nextAvailability[day as DayKey] = {
                        isWorking: isTarget,
                        blocks: isTarget ? [{ startTime: "10:00", endTime: "16:00" }] : [{ ...defaultTimeBlock() }],
                    }
                }
            })
            return {
                ...prev,
                availability: nextAvailability,
            }
        })
    }

    const validateBlocks = (blocks: UITimeBlock[]) => {
        const errors: string[] = []
        blocks.forEach(block => {
            if (!block.startTime || !block.endTime) {
                errors.push("Vul zowel begin- als eindtijd in.")
                return
            }
            if (block.endTime <= block.startTime) {
                errors.push("Eindtijd moet na begintijd liggen.")
            }
        })
        const sorted = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime))
        sorted.forEach((block, idx) => {
            const next = sorted[idx + 1]
            if (!next) return
            if (block.endTime > next.startTime) {
                errors.push("Tijdblokken overlappen elkaar.")
            }
        })
        return errors
    }

    const getAvailabilityWarnings = (availability: UIAvailability) => {
        const warnings: Partial<Record<DayKey, string[]>> = {}
        DAY_ORDER.forEach(day => {
            const entry = availability[day]
            if (!entry.isWorking) return
            const errors = validateBlocks(normalizeBlocks(entry.blocks))
            if (errors.length) {
                warnings[day] = errors
            }
        })
        return warnings
    }

    const staffAvailabilityWarnings = useMemo(
        () => getAvailabilityWarnings(newStaffMember.availability),
        [newStaffMember.availability]
    )

    const updateNewStaffAvailability = (day: DayKey, updater: (entry: UIAvailability[DayKey]) => UIAvailability[DayKey]) => {
        setNewStaffMember(prev => {
            const current = prev.availability[day]
            const nextEntry = updater({
                ...current,
                blocks: [...normalizeBlocks(current.blocks)],
            })
            return {
                ...prev,
                availability: {
                    ...prev.availability,
                    [day]: nextEntry,
                },
            }
        })
    }

    const updateNewStaffTimeBlock = (day: DayKey, field: keyof UITimeBlock, value: string) => {
        updateNewStaffAvailability(day, entry => ({
            ...entry,
            blocks: normalizeBlocks(entry.blocks).map((block, idx) =>
                idx === 0 ? { ...block, [field]: value } : block
            ),
        }))
    }

    const updateDraftTimeBlock = (day: DayKey, field: keyof UITimeBlock, value: string) => {
        if (!staffDraft) return
        setStaffDraft(prev => {
            if (!prev) return prev
            const dayEntry = prev.availability[day]
            const nextBlocks = normalizeBlocks(dayEntry.blocks).map((block, idx) =>
                idx === 0 ? { ...block, [field]: value } : block
            )
            return {
                ...prev,
                availability: {
                    ...prev.availability,
                    [day]: {
                        ...dayEntry,
                        blocks: nextBlocks,
                    },
                },
            }
        })
    }

    const addTimeBlock = (day: DayKey) => {
        updateNewStaffAvailability(day, entry => ({
            ...entry,
            isWorking: true,
            blocks: [...normalizeBlocks(entry.blocks), defaultTimeBlock()],
        }))
    }

    const updateTimeBlock = (day: DayKey, blockIndex: number, field: keyof UITimeBlock, value: string) => {
        updateNewStaffAvailability(day, entry => {
            const nextBlocks = normalizeBlocks(entry.blocks).map((block, idx) =>
                idx === blockIndex ? { ...block, [field]: value } : block
            )
            return {
                ...entry,
                blocks: nextBlocks,
            }
        })
    }

    const removeTimeBlock = (day: DayKey, blockIndex: number) => {
        updateNewStaffAvailability(day, entry => {
            const blocks = normalizeBlocks(entry.blocks)
            if (blocks.length === 1) return entry
            return {
                ...entry,
                blocks: blocks.filter((_, idx) => idx !== blockIndex),
            }
        })
    }

    const staffNameError = (newStaffMember.name ?? "").trim() === "" ? "Naam is verplicht" : ""
    const staffRoleError = (newStaffMember.role ?? "").trim() === "" ? "Rol is verplicht" : ""

    const handleAddStaffMember = async () => {
        const missingName = newStaffMember.name.trim() === ""
        const missingRole = newStaffMember.role.trim() === ""
        if (missingName || missingRole || Object.keys(staffAvailabilityWarnings).length) {
            setStaffFieldTouched({ name: true, role: true })
            if (Object.keys(staffAvailabilityWarnings).length) {
                toast({
                    title: "Beschikbaarheid controleren",
                    description: "Pas overlappende of ongeldige tijdsblokken aan.",
                    variant: "destructive",
                })
            }
            return
        }
        try {
            setCreatingStaff(true)
            const created = await addStaffMember({
                name: newStaffMember.name.trim(),
                role: newStaffMember.role.trim(),
                specialties: parseSpecialtyString(newStaffMember.specialties),
                availability: newStaffMember.availability,
                googleCalendarId: newStaffMember.googleCalendarId,
                googleCalendarSummary: newStaffMember.googleCalendarSummary,
            })
            setStaffMembers(prev => [...prev, created])
            lastSavedAvailabilityRef.current = created.availability
            setNewStaffMember({
                name: "",
                role: "",
                specialties: "",
                availability: emptyWeek(),
                googleCalendarId: null,
                googleCalendarSummary: null,
            })
            setStaffFieldTouched({ name: false, role: false })
            toast({
                title: "Staflid toegevoegd",
                description: `${created.name} is toegevoegd aan je team.`,
            })
        } catch (err: any) {
            const message = err?.message ?? "Toevoegen mislukt"
            setError(message)
            toast({
                title: "Toevoegen mislukt",
                description: message,
                variant: "destructive",
            })
        } finally {
            setCreatingStaff(false)
        }
    }

    const openEditStaff = (s: UIStaffMember) => {
        setEditingStaff(s.id)
        setStaffDraft({
            id: s.id,
            name: s.name,
            role: s.role,
            specialties: specialtiesToString(s.specialties),
            availability: JSON.parse(JSON.stringify(s.availability)) as UIAvailability, // deep copy
            googleCalendarId: s.googleCalendarId,
            googleCalendarSummary: s.googleCalendarSummary,
        })
    }

    const updateDraftAvailability = (day: DayKey, patch: Partial<UIAvailability[DayKey]>) => {
        if (!staffDraft) return
        setStaffDraft({
            ...staffDraft,
            availability: {
                ...staffDraft.availability,
                [day]: { ...staffDraft.availability[day], ...patch }
            }
        })
    }

    const handleSaveStaffDraft = async () => {
        if (!staffDraft?.id) return
        const draftSnapshot = staffDraft
        try {
            const updated = await updateStaffMember({
                id: draftSnapshot.id,
                name: draftSnapshot.name,
                role: draftSnapshot.role,
                specialties: parseSpecialtyString(draftSnapshot.specialties),
                availability: draftSnapshot.availability,
                googleCalendarId: draftSnapshot.googleCalendarId,
                googleCalendarSummary: draftSnapshot.googleCalendarSummary,
            })
            // reflect in UI
            setStaffMembers(prev => prev.map(s =>
                s.id === draftSnapshot.id ? updated : s
            ))
            setEditingStaff(null)
            setStaffDraft(null)
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleDeleteStaffMember = async (id: string) => {
        try {
            await deleteStaffMember(id)
            setStaffMembers(prev => prev.filter(s => s.id !== id))
        } catch (err: any) {
            setError(err.message)
        }
    }

    /* ----------------------------- Helpers ---------------------------- */
    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes}m`
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        return m > 0 ? `${h}h ${m}m` : `${h}h`
    }
    const presetGroups = useMemo(() => {
        const map = new Map<string, AppointmentPreset[]>()
        presetOptions.forEach(preset => {
            const key = preset.category || "Overig"
            if (!map.has(key)) {
                map.set(key, [])
            }
            map.get(key)!.push(preset)
        })
        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, presets]) => ({
                category,
                presets: [...presets].sort((a, b) => a.name.localeCompare(b.name)),
            }))
    }, [presetOptions])

    const startPresetConfiguration = (preset: AppointmentPreset) => {
        setPendingPreset(preset)
        setPendingDuration(preset.duration)
        setPendingPrice("")
    }

    const handleConfirmPreset = async () => {
        if (!pendingPreset) return
        const normalisedPrice = pendingPrice.trim()
        const numericPrice = Number(normalisedPrice)
        const categoryName = pendingPreset.category?.trim() ?? ""
        const categoryFields: Partial<AppointmentTypeForm> = {}
        if (categoryName) {
            const matchedCategory = appointmentCategories.find(
                option => (option.name ?? "").trim().toLowerCase() === categoryName.toLowerCase()
            )
            if (matchedCategory?.id != null) {
                categoryFields.categoryId = matchedCategory.id
                categoryFields.newCategoryName = undefined
            } else {
                categoryFields.categoryId = null
                categoryFields.newCategoryName = categoryName
            }
        }
        const payload: AppointmentTypeForm = {
            name: pendingPreset.name,
            duration: pendingDuration,
            price: normalisedPrice && Number.isFinite(numericPrice) ? numericPrice : undefined,
            description: pendingPreset.description ?? "",
            ...categoryFields,
        }
        setNewAppointmentType(prev => ({
            ...prev,
            ...payload,
        }))
        setPrefillFlashFields(["name", "duration", "price", "description", "category"])
        setLastAppliedPreset(pendingPreset)
        try {
            setCreatingAppointment(true)
            const created = await addAppointmentType(payload)
            setAppointmentTypes(prev => [...prev, created])
            toast({
                title: "Preset toegevoegd",
                description: `${created.name} is direct opgeslagen.`,
            })
            setPresetDialogOpen(false)
            setPendingPreset(null)
        } catch (err: any) {
            const message = err?.message ?? "Preset toepassen mislukt"
            toast({
                title: "Toevoegen mislukt",
                description: message,
                variant: "destructive",
            })
        } finally {
            setCreatingAppointment(false)
        }
    }

    const clearAppliedPreset = () => {
        setLastAppliedPreset(null)
        setNewAppointmentType({ name: "", duration: 30, price: undefined, description: "", categoryId: null })
    }

    const hasNewAppointmentTypeChanges = useMemo(() => {
        const nameChanged = (newAppointmentType.name ?? "").trim() !== ""
        const categoryChanged =
            (newAppointmentType.newCategoryName?.trim() ?? "") !== "" ||
            newAppointmentType.categoryId != null
        const descriptionChanged = (newAppointmentType.description ?? "").trim() !== ""
        const priceChanged = newAppointmentType.price != null
        const duration = newAppointmentType.duration ?? 30
        const durationChanged = duration !== 30
        return nameChanged || categoryChanged || descriptionChanged || priceChanged || durationChanged
    }, [newAppointmentType])

    const hasNewStaffChanges = useMemo(() => {
        const nameChanged = newStaffMember.name.trim() !== ""
        const roleChanged = newStaffMember.role.trim() !== ""
        const specialtiesChanged = newStaffMember.specialties.trim() !== ""
        const availabilityChanged = !availabilityIsDefault(newStaffMember.availability)
        const calendarChanged = newStaffMember.googleCalendarId !== null
        return nameChanged || roleChanged || specialtiesChanged || availabilityChanged || calendarChanged
    }, [newStaffMember])

    const staffDraftChanged = useMemo(() => {
        if (!staffDraft?.id) {
            return false
        }
        const original = staffMembers.find(s => s.id === staffDraft.id)
        if (!original) {
            return true
        }
        const nameChanged = staffDraft.name !== original.name
        const roleChanged = staffDraft.role !== original.role
        const specialtiesChanged = staffDraft.specialties !== specialtiesToString(original.specialties)
        const availabilityChanged = !availabilityEquals(staffDraft.availability, original.availability)
        const calendarChanged =
            (staffDraft.googleCalendarId ?? null) !== (original.googleCalendarId ?? null) ||
            (staffDraft.googleCalendarSummary ?? null) !== (original.googleCalendarSummary ?? null)
        return nameChanged || roleChanged || specialtiesChanged || availabilityChanged || calendarChanged
    }, [staffDraft, staffMembers])

    const hasUnsavedChanges = hasNewAppointmentTypeChanges || hasNewStaffChanges || staffDraftChanged

    useEffect(() => {
        onDirtyChange?.(hasUnsavedChanges)
    }, [hasUnsavedChanges, onDirtyChange])

    if (loading) return <p className="p-4">Loading...</p>
    if (error) return <p className="p-4 text-red-600">{error}</p>

    return (
        <div className="min-h-screen bg-gray-50">
            <div>
                <h2 className="text-2xl font-bold text-[#081245]">Appointment Management</h2>
                <p className="text-gray-600">Configureer alle afspraak soorten die je hebt</p>
            </div>

            <div className="py-8">
                <Tabs defaultValue="appointment-types" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="appointment-types" className="flex items-center space-x-2">
                            <CalendarArrowUp className="h-4 w-4" />
                            <span>Afspraak types</span>
                        </TabsTrigger>
                        <TabsTrigger value="staff-members" className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Medewerkers</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* ----------------- Appointment Types ----------------- */}

                    <TabsContent value="appointment-types" className="space-y-6">

                        <AppointmentTypesTab

                            appointmentTypes={appointmentTypes}

                            newAppointmentType={newAppointmentType}

                            setNewAppointmentType={setNewAppointmentType}

                            prefillFlashFields={prefillFlashFields}

                            categoryOptions={appointmentCategories}

                            presetGroups={presetGroups}

                            presetsLoading={presetsLoading}

                            presetsError={presetsError}

                            isPresetDialogOpen={isPresetDialogOpen}

                            setPresetDialogOpen={setPresetDialogOpen}

                            pendingPreset={pendingPreset}

                            setPendingPreset={setPendingPreset}

                            pendingDuration={pendingDuration}

                            setPendingDuration={setPendingDuration}

                            pendingPrice={pendingPrice}

                            setPendingPrice={setPendingPrice}

                            lastAppliedPreset={lastAppliedPreset}

                            clearAppliedPreset={clearAppliedPreset}

                            startPresetConfiguration={startPresetConfiguration}

                            handleConfirmPreset={handleConfirmPreset}

                            creatingAppointment={creatingAppointment}

                            handleAddAppointmentType={handleAddAppointmentType}

                            editingAppointment={editingAppointment}

                            setEditingAppointment={setEditingAppointment}

                            handleUpdateAppointmentType={handleUpdateAppointmentType}

                            deleteTarget={deleteTarget}

                            setDeleteTarget={setDeleteTarget}

                            deletingAppointment={deletingAppointment}

                            handleDeleteAppointmentType={handleDeleteAppointmentType}

                            formatDuration={formatDuration}

                        />

                    </TabsContent>

                    {/* ----------------- Staff Members ----------------- */}

                    <TabsContent value="staff-members" className="space-y-6">

                        <StaffMembersTab

                            newStaffMember={newStaffMember}

                            setNewStaffMember={setNewStaffMember}

                            calendars={calendars}

                            staffMembers={staffMembers}

                            creatingStaff={creatingStaff}

                            handleAddStaffMember={handleAddStaffMember}

                            editingStaff={editingStaff}

                            setEditingStaff={setEditingStaff}

                            staffDraft={staffDraft}

                            setStaffDraft={setStaffDraft}

                            openEditStaff={openEditStaff}

                            handleSaveStaffDraft={handleSaveStaffDraft}

                            handleDeleteStaffMember={handleDeleteStaffMember}

                            updateNewStaffTimeBlock={updateNewStaffTimeBlock}

                            updateDraftAvailability={updateDraftAvailability}

                            updateDraftTimeBlock={updateDraftTimeBlock}

                            normalizeBlocks={normalizeBlocks}

                            DAY_ORDER={DAY_ORDER}

                            calendarDisplayLabel={calendarDisplayLabel}

                            isActiveFromAvailability={isActiveFromAvailability}

                            applyAvailabilityTemplate={applyAvailabilityTemplate}

                        />

                    </TabsContent>

               </Tabs>

                {/* Summary */}
                <Card className="bg-blue-50 border-blue-200 mt-6">
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 text-center">
                            <div>
                                <div className="text-2xl font-bold">{appointmentTypes.length}</div>
                                <div className="text-sm">Afspraak Types</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{activeStaffCount}</div>
                                <div className="text-sm">Actieve Medewerkers</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{new Set(appointmentTypes.map(a => a.category)).size}</div>
                                <div className="text-sm">Dienst Categorieën</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
