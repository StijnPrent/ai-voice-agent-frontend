"use client"

import {useEffect, useMemo, useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Badge} from "@/components/ui/badge"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {CalendarArrowUp, Clock, Euro, Plus, User, Edit, Trash2, Users} from "lucide-react"
import {Textarea} from "@/components/ui/textarea"

import {
    getAppointmentTypes, addAppointmentType, updateAppointmentType, deleteAppointmentType,
    getStaffMembers, addStaffMember, updateStaffMember, deleteStaffMember,
    emptyWeek
} from "@/lib/schedulingApi"
import type { UIAppointmentType, UIStaffMember, UISpecialty, UIAvailability } from "@/lib/schedulingApi"

type DayKey = keyof UIAvailability;
const DAY_ORDER: DayKey[] = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

interface AppointmentsProps {
    onDirtyChange?: (dirty: boolean) => void
}

export default function Appointments({ onDirtyChange }: AppointmentsProps) {
    /* ----------------------------- State ----------------------------- */
    const [appointmentTypes, setAppointmentTypes] = useState<UIAppointmentType[]>([])
    const [staffMembers, setStaffMembers] = useState<UIStaffMember[]>([])

    const [newAppointmentType, setNewAppointmentType] = useState<Partial<UIAppointmentType>>({
        name: "",
        duration: 30,
        price: undefined,
        description: "",
        category: "",
    })

    const [newStaffMember, setNewStaffMember] = useState<{
        name: string
        role: string
        specialties: string // comma-separated input
        availability: UIAvailability
    }>({
        name: "",
        role: "",
        specialties: "",
        availability: emptyWeek(),
    })

    const [editingAppointment, setEditingAppointment] = useState<string | null>(null)
    const [editingStaff, setEditingStaff] = useState<string | null>(null)
    const [staffDraft, setStaffDraft] = useState<{
        id?: string
        name: string
        role: string
        specialties: string // raw string
        availability: UIAvailability
    } | null>(null)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    /* ----------------------------- Load ----------------------------- */
    useEffect(() => {
        async function load() {
            try {
                setLoading(true)
                const [apt, staff] = await Promise.all([getAppointmentTypes(), getStaffMembers()])
                setAppointmentTypes(apt)
                setStaffMembers(staff)
            } catch (err: any) {
                setError(err.message || "Failed to load data")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    /* ----------------------- Appointment Types ----------------------- */
    const handleAddAppointmentType = async () => {
        if (!newAppointmentType.name || !newAppointmentType.duration) return
        try {
            const created = await addAppointmentType(newAppointmentType)
            setAppointmentTypes([...appointmentTypes, created])
            setNewAppointmentType({ name: "", duration: 30, price: undefined, description: "", category: "" })
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleUpdateAppointmentType = async (id: string, updates: Partial<UIAppointmentType>) => {
        try {
            await updateAppointmentType({ id, ...updates })
            setAppointmentTypes(appointmentTypes.map(apt => apt.id === id ? {...apt, ...updates} : apt))
            setEditingAppointment(null)
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleDeleteAppointmentType = async (id: string) => {
        try {
            await deleteAppointmentType(id)
            setAppointmentTypes(appointmentTypes.filter(apt => apt.id !== id))
        } catch (err: any) {
            setError(err.message)
        }
    }

    /* ----------------------------- Staff ---------------------------- */
    const availabilityEquals = (a: UIAvailability, b: UIAvailability) =>
        DAY_ORDER.every(day => {
            const dayA = a[day]
            const dayB = b[day]
            return dayA.isWorking === dayB.isWorking && dayA.startTime === dayB.startTime && dayA.endTime === dayB.endTime
        })

    const availabilityIsDefault = (availability: UIAvailability) => availabilityEquals(availability, emptyWeek())

    function parseSpecialtyString(s: string): UISpecialty[] {
        return s.split(",").map(x => x.trim()).filter(Boolean).map(n => ({ name: n }));
    }
    function specialtiesToString(arr: UISpecialty[]): string {
        return (arr ?? []).map(s => s.name).join(", ");
    }

    // Derived "isActive" for UI (at least one working day)
    function isActiveFromAvailability(av: UIAvailability): boolean {
        return Object.values(av).some(d => d.isWorking);
    }
    const activeStaffCount = useMemo(
        () => staffMembers.filter(s => isActiveFromAvailability(s.availability)).length,
        [staffMembers]
    );

    const handleAddStaffMember = async () => {
        if (!newStaffMember.name || !newStaffMember.role) return
        try {
            const created = await addStaffMember({
                name: newStaffMember.name,
                role: newStaffMember.role,
                specialties: parseSpecialtyString(newStaffMember.specialties),
                availability: newStaffMember.availability,
            })
            setStaffMembers([...staffMembers, created])
            setNewStaffMember({ name: "", role: "", specialties: "", availability: emptyWeek() })
        } catch (err: any) {
            setError(err.message)
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
        try {
            await updateStaffMember({
                id: staffDraft.id,
                name: staffDraft.name,
                role: staffDraft.role,
                specialties: parseSpecialtyString(staffDraft.specialties),
                availability: staffDraft.availability,
            })
            // reflect in UI
            setStaffMembers(staffMembers.map(s =>
                s.id === staffDraft.id
                    ? {
                        ...s,
                        name: staffDraft.name,
                        role: staffDraft.role,
                        specialties: parseSpecialtyString(staffDraft.specialties),
                        availability: staffDraft.availability,
                    }
                    : s
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
            setStaffMembers(staffMembers.filter(s => s.id !== id))
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
    const categories = [...new Set(appointmentTypes.map(apt => apt.category))]

    const hasNewAppointmentTypeChanges = useMemo(() => {
        const nameChanged = (newAppointmentType.name ?? "").trim() !== ""
        const categoryChanged = (newAppointmentType.category ?? "").trim() !== ""
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
        return nameChanged || roleChanged || specialtiesChanged || availabilityChanged
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
        return nameChanged || roleChanged || specialtiesChanged || availabilityChanged
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
                <h2 className="text-2xl font-bold text-gray-900">Appointment Management</h2>
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Plus className="h-5 w-5" />
                                    <span>Nieuw afspraaktype toevoegen</span>
                                </CardTitle>
                                <CardDescription>Maak verschillende soorten afspraken aan met duur en prijsstelling</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <Label>Dienst</Label>
                                        <Input
                                            placeholder="bijv. Knipbeurt mannen"
                                            value={newAppointmentType.name || ""}
                                            onChange={e => setNewAppointmentType({ ...newAppointmentType, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Duur (minuten)</Label>
                                        <Input
                                            type="number"
                                            min="5"
                                            value={newAppointmentType.duration || ""}
                                            onChange={e => setNewAppointmentType({ ...newAppointmentType, duration: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Prijs (€) - Optioneel</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={newAppointmentType.price ?? ""}
                                            onChange={e => setNewAppointmentType({
                                                ...newAppointmentType,
                                                price: e.target.value ? parseFloat(e.target.value) : undefined
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Categorie</Label>
                                        <Input
                                            value={newAppointmentType.category || ""}
                                            onChange={e => setNewAppointmentType({ ...newAppointmentType, category: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Label>Beschrijving</Label>
                                    <Textarea
                                        value={newAppointmentType.description || ""}
                                        onChange={e => setNewAppointmentType({ ...newAppointmentType, description: e.target.value })}
                                    />
                                </div>
                                <div className="mt-4">
                                    <Button onClick={handleAddAppointmentType}>
                                        <Plus className="h-4 w-4 mr-2" /> Afspraaktype toevoegen
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Existing */}
                        <div className="space-y-4">
                            {categories.map(category => (
                                <Card key={category}>
                                    <CardHeader><CardTitle>{category}</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {appointmentTypes.filter(apt => apt.category === category).map(appointmentType => (
                                                <Card key={appointmentType.id} className="border-2 hover:border-blue-200">
                                                    <CardContent className="p-4">
                                                        {editingAppointment === appointmentType.id ? (
                                                            <div className="space-y-3">
                                                                <Input
                                                                    value={appointmentType.name}
                                                                    onChange={e => handleUpdateAppointmentType(appointmentType.id, { name: e.target.value })}
                                                                />
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <Input
                                                                        type="number"
                                                                        value={appointmentType.duration}
                                                                        onChange={e => handleUpdateAppointmentType(appointmentType.id, { duration: parseInt(e.target.value) })}
                                                                    />
                                                                    <Input
                                                                        type="number"
                                                                        value={appointmentType.price ?? ""}
                                                                        onChange={e => handleUpdateAppointmentType(appointmentType.id, {
                                                                            price: e.target.value ? parseFloat(e.target.value) : undefined
                                                                        })}
                                                                    />
                                                                </div>
                                                                <Textarea
                                                                    value={appointmentType.description || ""}
                                                                    onChange={e => handleUpdateAppointmentType(appointmentType.id, { description: e.target.value })}
                                                                />
                                                                <div className="flex space-x-2">
                                                                    <Button size="sm" onClick={() => setEditingAppointment(null)}>Opslaan</Button>
                                                                    <Button size="sm" variant="outline" onClick={() => setEditingAppointment(null)}>Annuleren</Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <h3 className="font-medium">{appointmentType.name}</h3>
                                                                    <div className="flex space-x-1">
                                                                        <Button variant="ghost" size="sm" onClick={() => setEditingAppointment(appointmentType.id)}>
                                                                            <Edit className="h-3 w-3"/>
                                                                        </Button>
                                                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAppointmentType(appointmentType.id)} className="text-red-500">
                                                                            <Trash2 className="h-3 w-3"/>
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center space-x-2">
                                                                        <Clock className="h-4 w-4 text-gray-500" />
                                                                        <span>{formatDuration(appointmentType.duration)}</span>
                                                                    </div>
                                                                    {appointmentType.price != null && (
                                                                        <div className="flex items-center space-x-2">
                                                                            <Euro className="h-4 w-4 text-gray-500" />
                                                                            <span>€{Number(appointmentType.price).toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                    {appointmentType.description && (
                                                                        <p className="text-xs text-gray-500">{appointmentType.description}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* ----------------- Staff Members ----------------- */}
                    <TabsContent value="staff-members" className="space-y-6">
                        {/* Add new staff */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Plus className="h-5 w-5" /> <span>Nieuwe medewerker toevoegen</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <Label>Naam</Label>
                                        <Input
                                            value={newStaffMember.name}
                                            onChange={e => setNewStaffMember({ ...newStaffMember, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Rol/titel</Label>
                                        <Input
                                            value={newStaffMember.role}
                                            onChange={e => setNewStaffMember({ ...newStaffMember, role: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Specialiteiten</Label>
                                        <Input
                                            placeholder="bijv. Knippen, Kleuren"
                                            value={newStaffMember.specialties}
                                            onChange={e => setNewStaffMember({ ...newStaffMember, specialties: e.target.value })}
                                        />
                                    </div>

                                    {/* Weekly Availability Editor */}
                                    <div className="md:col-span-2">
                                        <Label className="text-base font-medium">Weekly Availability</Label>
                                        <div className="space-y-2 mt-2 bg-gray-50 p-4 rounded-lg">
                                            {DAY_ORDER.map((day) => {
                                                const schedule = newStaffMember.availability[day];
                                                return (
                                                    <div key={day} className="flex items-center gap-3">
                                                        <div className="w-24 text-sm font-medium capitalize">{day}</div>
                                                        <Button
                                                            type="button"
                                                            variant={schedule.isWorking ? "default" : "outline"}
                                                            size="sm"
                                                            className="w-20 h-8 text-xs"
                                                            onClick={() => {
                                                                const next = {...newStaffMember.availability};
                                                                next[day] = { ...next[day], isWorking: !next[day].isWorking };
                                                                setNewStaffMember({ ...newStaffMember, availability: next });
                                                            }}
                                                        >
                                                            {schedule.isWorking ? "Working" : "Off"}
                                                        </Button>
                                                        {schedule.isWorking && (
                                                            <>
                                                                <Input
                                                                    type="time"
                                                                    value={schedule.startTime}
                                                                    onChange={e => {
                                                                        const next = {...newStaffMember.availability};
                                                                        next[day] = { ...next[day], startTime: e.target.value };
                                                                        setNewStaffMember({ ...newStaffMember, availability: next });
                                                                    }}
                                                                    className="w-24 h-8 text-sm"
                                                                />
                                                                <span className="text-sm text-gray-500">to</span>
                                                                <Input
                                                                    type="time"
                                                                    value={schedule.endTime}
                                                                    onChange={e => {
                                                                        const next = {...newStaffMember.availability};
                                                                        next[day] = { ...next[day], endTime: e.target.value };
                                                                        setNewStaffMember({ ...newStaffMember, availability: next });
                                                                    }}
                                                                    className="w-24 h-8 text-sm"
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <Button onClick={handleAddStaffMember}>
                                        <Plus className="h-4 w-4 mr-2" /> Add Staff Member
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Existing staff list */}
                        <Card>
                            <CardHeader><CardTitle>Team Leden</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                                    {staffMembers.map(s => {
                                        const active = isActiveFromAvailability(s.availability);
                                        return (
                                            <Card key={s.id} className="border-2 hover:border-blue-200">
                                                <CardContent className="p-4">
                                                    {editingStaff === s.id && staffDraft ? (
                                                        <div className="space-y-3">
                                                            <Input
                                                                value={staffDraft.name}
                                                                onChange={e => setStaffDraft({ ...staffDraft, name: e.target.value })}
                                                            />
                                                            <Input
                                                                value={staffDraft.role}
                                                                onChange={e => setStaffDraft({ ...staffDraft, role: e.target.value })}
                                                            />
                                                            <Input
                                                                value={staffDraft.specialties}
                                                                onChange={e => setStaffDraft({ ...staffDraft, specialties: e.target.value })}
                                                            />

                                                            {/* Edit weekly availability */}
                                                            <div>
                                                                <Label className="text-sm font-medium">Weekly Availability</Label>
                                                                <div className="space-y-2 mt-2 bg-gray-50 p-3 rounded-lg">
                                                                    {DAY_ORDER.map(day => {
                                                                        const schedule = staffDraft.availability[day];
                                                                        return (
                                                                            <div key={day} className="flex items-center gap-2">
                                                                                <div className="w-20 text-xs font-medium capitalize">{day.slice(0,3)}</div>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant={schedule.isWorking ? "default" : "outline"}
                                                                                    size="sm"
                                                                                    className="w-16 h-7 text-xs"
                                                                                    onClick={() => updateDraftAvailability(day, { isWorking: !schedule.isWorking })}
                                                                                >
                                                                                    {schedule.isWorking ? "Work" : "Off"}
                                                                                </Button>
                                                                                {schedule.isWorking && (
                                                                                    <>
                                                                                        <Input
                                                                                            type="time"
                                                                                            value={schedule.startTime}
                                                                                            onChange={e => updateDraftAvailability(day, { startTime: e.target.value })}
                                                                                            className="w-20 h-7 text-xs"
                                                                                        />
                                                                                        <span className="text-xs text-gray-500">to</span>
                                                                                        <Input
                                                                                            type="time"
                                                                                            value={schedule.endTime}
                                                                                            onChange={e => updateDraftAvailability(day, { endTime: e.target.value })}
                                                                                            className="w-20 h-7 text-xs"
                                                                                        />
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>

                                                            <div className="flex space-x-2">
                                                                <Button size="sm" onClick={handleSaveStaffDraft}>Save</Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setEditingStaff(null)
                                                                        setStaffDraft(null)
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-center space-x-2">
                                                                    <User className="h-5 w-5 text-blue-600" />
                                                                    <h3 className="font-medium text-gray-900">{s.name}</h3>
                                                                </div>
                                                                <div className="flex space-x-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => openEditStaff(s)}
                                                                        className="h-6 w-6 p-0"
                                                                    >
                                                                        <Edit className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleDeleteStaffMember(s.id)}
                                                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <p className="text-sm text-gray-600 font-medium">{s.role}</p>

                                                                {s.specialties.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {s.specialties.map((sp, i) => (
                                                                            <Badge key={i} variant="secondary" className="text-xs">{sp.name}</Badge>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* Availability Display */}
                                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-xs font-medium text-gray-700">Weekly Schedule</span>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {Object.values(s.availability).filter(d => d.isWorking).length} days/week
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        {DAY_ORDER.filter(d => s.availability[d].isWorking).map(d => (
                                                                            <div key={d} className="flex justify-between text-xs">
                                                                                <span className="capitalize font-medium">{d}</span>
                                                                                <span className="text-gray-600">
                                          {s.availability[d].startTime} - {s.availability[d].endTime}
                                        </span>
                                                                            </div>
                                                                        ))}
                                                                        {Object.values(s.availability).every(d => !d.isWorking) && (
                                                                            <div className="text-xs text-gray-500 text-center py-2">No working days set</div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center space-x-2">
                                                                    <div className={`w-2 h-2 rounded-full ${active ? "bg-green-500" : "bg-gray-400"}`} />
                                                                    <span className="text-xs text-gray-500">{active ? "Active" : "Inactive"}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
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
