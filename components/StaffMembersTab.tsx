"use client"

import { Dispatch, SetStateAction } from "react"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Badge} from "@/components/ui/badge"
import {Plus, User, Edit, Trash2, Sparkles, Sun, Moon, Copy, Eraser} from "lucide-react"
import type { GoogleCalendar, UIAvailability, UIStaffMember, UITimeBlock } from "@/lib/schedulingApi"
import type { NewStaffMemberForm, StaffDraft } from "@/app/types/staff"

type DayKey = keyof UIAvailability

interface StaffMembersTabProps {
    newStaffMember: NewStaffMemberForm;
    setNewStaffMember: Dispatch<SetStateAction<NewStaffMemberForm>>;
    calendars: GoogleCalendar[];
    staffMembers: UIStaffMember[];
    creatingStaff: boolean;
    handleAddStaffMember: () => Promise<void>;
    editingStaff: string | null;
    setEditingStaff: Dispatch<SetStateAction<string | null>>;
    staffDraft: StaffDraft | null;
    setStaffDraft: Dispatch<SetStateAction<StaffDraft | null>>;
    openEditStaff: (s: UIStaffMember) => void;
    handleSaveStaffDraft: () => Promise<void>;
    handleDeleteStaffMember: (id: string) => Promise<void>;
    updateNewStaffTimeBlock: (day: DayKey, field: keyof UITimeBlock, value: string) => void;
    updateDraftAvailability: (day: DayKey, patch: Partial<UIAvailability[DayKey]>) => void;
    updateDraftTimeBlock: (day: DayKey, field: keyof UITimeBlock, value: string) => void;
    normalizeBlocks: (blocks?: UITimeBlock[]) => UITimeBlock[];
    DAY_ORDER: DayKey[];
    calendarDisplayLabel: (calendar?: Pick<GoogleCalendar, "displayName" | "summary" | "summaryOverride" | "id"> | null) => string | null;
    isActiveFromAvailability: (availability: UIAvailability) => boolean;
    applyAvailabilityTemplate: (template: "weekday" | "weekend" | "copy" | "clear") => void;
}

export default function StaffMembersTab({
    newStaffMember,
    setNewStaffMember,
    calendars,
    staffMembers,
    creatingStaff,
    handleAddStaffMember,
    editingStaff,
    setEditingStaff,
    staffDraft,
    setStaffDraft,
    openEditStaff,
    handleSaveStaffDraft,
    handleDeleteStaffMember,
    updateNewStaffTimeBlock,
    updateDraftAvailability,
    updateDraftTimeBlock,
    normalizeBlocks,
    DAY_ORDER,
    calendarDisplayLabel,
    isActiveFromAvailability,
    applyAvailabilityTemplate,
}: StaffMembersTabProps) {
    const hasCalendars = calendars.length > 0
    const dayLabel: Record<DayKey, string> = {
        monday: "Maandag",
        tuesday: "Dinsdag",
        wednesday: "Woensdag",
        thursday: "Donderdag",
        friday: "Vrijdag",
        saturday: "Zaterdag",
        sunday: "Zondag",
    }
    return (
        <>
            <Card className="border-slate-200 shadow-xl">
                <CardHeader className="text-[#081245] space-y-2">
                    <CardTitle className="flex items-center space-x-2 text-xl">
                        <Plus className="h-5 w-5" /> <span>Nieuw teamlid toevoegen</span>
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600">
                        Zelfde premium look als je diensten: voeg medewerkers toe en beheer hun beschikbaarheid vanuit één paneel.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                    <Sparkles className="h-4 w-4 text-sky-500" />
                                    Snelle rooster-templates
                                </p>
                                <p className="mt-1 text-xs text-slate-600">
                                    Gebruik een basispatroon of hergebruik het laatst opgeslagen schema.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 text-xs font-semibold"
                                    onClick={() => applyAvailabilityTemplate("weekday")}
                                >
                                    <Sun className="h-3.5 w-3.5" />
                                    Weekdagen
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 text-xs font-semibold"
                                    onClick={() => applyAvailabilityTemplate("weekend")}
                                >
                                    <Moon className="h-3.5 w-3.5" />
                                    Weekend
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 text-xs font-semibold"
                                    onClick={() => applyAvailabilityTemplate("copy")}
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                    Laatste week
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 text-xs font-semibold"
                                    onClick={() => applyAvailabilityTemplate("clear")}
                                >
                                    <Eraser className="h-3.5 w-3.5" />
                                    Wis alles
                                </Button>
                            </div>
                        </div>
                    </section>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
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
                                {hasCalendars && (
                                    <div className="space-y-2">
                                        <Label className="text-base font-medium">Google Calendar</Label>
                                        <Select
                                            value={newStaffMember.googleCalendarId ?? "__none__"}
                                            onValueChange={value => {
                                                if (value === "__none__") {
                                                    setNewStaffMember(prev => ({
                                                        ...prev,
                                                        googleCalendarId: null,
                                                        googleCalendarSummary: null,
                                                    }))
                                                    return
                                                }
                                                const selected = calendars.find(c => c.id === value)
                                                setNewStaffMember(prev => ({
                                                    ...prev,
                                                    googleCalendarId: selected?.id ?? null,
                                                    googleCalendarSummary: calendarDisplayLabel(selected) ?? selected?.id ?? null,
                                                }))
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Koppel een kalender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">Geen koppeling</SelectItem>
                                                {calendars.map(calendar => (
                                                    <SelectItem key={calendar.id} value={calendar.id}>
                                                        {calendarDisplayLabel(calendar) ?? calendar.id}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 md:pl-4">
                                <Label className="text-base font-medium">Wekelijkse beschikbaarheid</Label>
                                <div className="space-y-2 mt-2 bg-gray-50 p-4 rounded-lg">
                                    {DAY_ORDER.map((day) => {
                                        const schedule = newStaffMember.availability[day];
                                        const primaryBlock = normalizeBlocks(schedule.blocks)[0];
                                        return (
                                            <div key={day} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                                <div className="flex items-center gap-2 sm:w-28">
                                                    <div className="text-sm font-medium">{dayLabel[day]}</div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant={schedule.isWorking ? "default" : "outline"}
                                                    size="sm"
                                                    className="w-full sm:w-20 h-8 text-xs"
                                                    onClick={() => {
                                                        const next = { ...newStaffMember.availability };
                                                        next[day] = { ...next[day], isWorking: !next[day].isWorking };
                                                        setNewStaffMember({ ...newStaffMember, availability: next });
                                                    }}
                                                >
                                                    {schedule.isWorking ? "Werkdag" : "Vrij"}
                                                </Button>
                                                {schedule.isWorking && (
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 w-full sm:w-auto">
                                                        <Input
                                                            type="time"
                                                            value={primaryBlock.startTime}
                                                            onChange={e => updateNewStaffTimeBlock(day, "startTime", e.target.value)}
                                                            className="w-full sm:w-24 h-8 text-sm"
                                                        />
                                                        <span className="text-sm text-gray-500">tot</span>
                                                        <Input
                                                            type="time"
                                                            value={primaryBlock.endTime}
                                                            onChange={e => updateNewStaffTimeBlock(day, "endTime", e.target.value)}
                                                            className="w-full sm:w-24 h-8 text-sm"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="rounded-lg border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                            Tip: benoem 2-3 kernspecialiteiten zodat klanten snel het juiste teamlid vinden.
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-3 pt-2">
                        <Button
                            className="w-full max-w-xs justify-center bg-[#0ea5e9] text-base font-semibold text-white hover:text-white hover:bg-[#0ca5e9]/70"
                            onClick={handleAddStaffMember}
                            disabled={creatingStaff}
                        >
                            {creatingStaff ? "Opslaan..." : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" /> Medewerker toevoegen
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-muted-foreground">Controleer beschikbaarheid en kalenderkoppeling voordat je opslaat.</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="text-[#081245]"><CardTitle>Team Leden</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {staffMembers.map(s => {
                            const active = isActiveFromAvailability(s.availability);
                            const linkedCalendar = calendars.find(c => c.id === s.googleCalendarId);
                            const calendarLabel =
                                calendarDisplayLabel(linkedCalendar) ??
                                s.googleCalendarSummary ??
                                s.googleCalendarId ??
                                "Geen koppeling";
                            return (
                                <Card key={s.id} className="transition hover:border-sky-200 hover:shadow-md">
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
                                                {hasCalendars && (
                                                    <div>
                                                        <Label className="text-sm font-medium">Google Calendar</Label>
                                                        <Select
                                                            value={staffDraft.googleCalendarId ?? "__none__"}
                                                            onValueChange={value => {
                                                                setStaffDraft(prev => {
                                                                    if (!prev) return prev
                                                                    if (value === "__none__") {
                                                                        return {
                                                                            ...prev,
                                                                            googleCalendarId: null,
                                                                            googleCalendarSummary: null,
                                                                        }
                                                                    }
                                                                    const selected = calendars.find(c => c.id === value)
                                                                    return {
                                                                        ...prev,
                                                                        googleCalendarId: selected?.id ?? null,
                                                                        googleCalendarSummary: calendarDisplayLabel(selected) ?? selected?.id ?? null,
                                                                    }
                                                                })
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Koppel een kalender" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="__none__">Geen koppeling</SelectItem>
                                                                {calendars.map(calendar => (
                                                                    <SelectItem key={calendar.id} value={calendar.id}>
                                                                        {calendarDisplayLabel(calendar) ?? calendar.id}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}

                                                {/* Edit weekly availability */}
                                                <div>
                                                    <Label className="text-sm font-medium">Wekelijkse beschikbaarheid</Label>
                                                    <div className="space-y-2 mt-2 bg-gray-50 p-3 rounded-lg">
                                                        {DAY_ORDER.map(day => {
                                                            const schedule = staffDraft.availability[day];
                                                            const primaryBlock = normalizeBlocks(schedule.blocks)[0];
                                                            return (
                                                                <div key={day} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                                                                    <div className="flex items-center gap-2 sm:w-24">
                                                                        <div className="text-xs font-medium">{dayLabel[day].slice(0,3)}</div>
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        variant={schedule.isWorking ? "default" : "outline"}
                                                                        size="sm"
                                                                        className="w-full sm:w-16 h-7 text-xs"
                                                                        onClick={() => updateDraftAvailability(day, { isWorking: !schedule.isWorking })}
                                                                    >
                                                                        {schedule.isWorking ? "Werkdag" : "Vrij"}
                                                                    </Button>
                                                                    {schedule.isWorking && (
                                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 w-full sm:w-auto">
                                                                            <Input
                                                                                type="time"
                                                                                value={primaryBlock.startTime}
                                                                                onChange={e => updateDraftTimeBlock(day, "startTime", e.target.value)}
                                                                                className="w-full sm:w-20 h-7 text-xs"
                                                                            />
                                                                            <span className="text-xs text-gray-500">tot</span>
                                                                            <Input
                                                                                type="time"
                                                                                value={primaryBlock.endTime}
                                                                                onChange={e => updateDraftTimeBlock(day, "endTime", e.target.value)}
                                                                                className="w-full sm:w-20 h-7 text-xs"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="flex space-x-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={handleSaveStaffDraft}
                                                    >
                                                        Opslaan
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setEditingStaff(null)
                                                            setStaffDraft(null)
                                                        }}
                                                    >
                                                        Annuleren
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center space-x-2">
                                                        <User className="h-5 w-5 text-blue-600" />
                                                        <h3 className="font-medium text-[#081245]">{s.name}</h3>
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

                                                    <div className="text-xs text-gray-600">
                                                        <span className="font-semibold text-gray-700 mr-1">Google Calendar:</span>
                                                        {calendarLabel}
                                                    </div>

                                                    {/* Availability Display */}
                                                    <div className="bg-gray-50 p-3 rounded-lg">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-medium text-gray-700">Wekelijks schema</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {Object.values(s.availability).filter(d => d.isWorking).length} dagen/week
                                                            </Badge>
                                                        </div>
                                                        <div className="space-y-1">
                                                            {DAY_ORDER.filter(d => s.availability[d].isWorking).map(d => {
                                                                const dayEntry = s.availability[d];
                                                                const block = normalizeBlocks(dayEntry.blocks)[0];
                                                                return (
                                                                    <div key={d} className="flex justify-between text-xs">
                                                                        <span className="font-medium">{dayLabel[d]}</span>
                                                                        <span className="text-gray-600">
                                                                            {block.startTime} - {block.endTime}
                                                                        </span>
                                                                    </div>
                                                                )
                                                            })}
                                                            {Object.values(s.availability).every(d => !d.isWorking) && (
                                                                <div className="text-xs text-gray-500 text-center py-2">Geen werkdagen ingesteld</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        <div className={`w-2 h-2 rounded-full ${active ? "bg-green-500" : "bg-gray-400"}`} />
                                                        <span className="text-xs text-gray-500">{active ? "Actief" : "Inactief"}</span>
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
        </>
    )
}
