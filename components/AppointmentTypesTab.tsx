"use client"

import { Dispatch, SetStateAction, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Clock, Edit, Euro, Plus, Sparkles, Trash2, Undo2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AppointmentPreset } from "@/app/types/appointments"
import type { AppointmentCategory, AppointmentTypeForm, UIAppointmentType } from "@/lib/schedulingApi"

interface AppointmentTypesTabProps {
    appointmentTypes: UIAppointmentType[];
    newAppointmentType: AppointmentTypeForm;
    setNewAppointmentType: Dispatch<SetStateAction<AppointmentTypeForm>>;
    prefillFlashFields: string[];
    categoryOptions: AppointmentCategory[];
    presetGroups: { category: string; presets: AppointmentPreset[] }[];
    presetsLoading: boolean;
    presetsError: string | null;
    isPresetDialogOpen: boolean;
    setPresetDialogOpen: Dispatch<SetStateAction<boolean>>;
    pendingPreset: AppointmentPreset | null;
    setPendingPreset: Dispatch<SetStateAction<AppointmentPreset | null>>;
    pendingDuration: number;
    setPendingDuration: Dispatch<SetStateAction<number>>;
    pendingPrice: string;
    setPendingPrice: Dispatch<SetStateAction<string>>;
    lastAppliedPreset: AppointmentPreset | null;
    clearAppliedPreset: () => void;
    startPresetConfiguration: (preset: AppointmentPreset) => void;
    handleConfirmPreset: () => void;
    creatingAppointment: boolean;
    handleAddAppointmentType: () => Promise<void>;
    editingAppointment: string | null;
    setEditingAppointment: Dispatch<SetStateAction<string | null>>;
    handleUpdateAppointmentType: (id: string, updates: AppointmentTypeForm) => Promise<void>;
    deleteTarget: UIAppointmentType | null;
    setDeleteTarget: Dispatch<SetStateAction<UIAppointmentType | null>>;
    deletingAppointment: boolean;
    handleDeleteAppointmentType: () => Promise<void>;
    formatDuration: (minutes: number) => string;
}

export default function AppointmentTypesTab({
    appointmentTypes,
    newAppointmentType,
    setNewAppointmentType,
    prefillFlashFields,
    categoryOptions,
    presetGroups,
    presetsLoading,
    presetsError,
    isPresetDialogOpen,
    setPresetDialogOpen,
    pendingPreset,
    setPendingPreset,
    pendingDuration,
    setPendingDuration,
    pendingPrice,
    setPendingPrice,
    lastAppliedPreset,
    clearAppliedPreset,
    startPresetConfiguration,
    handleConfirmPreset,
    creatingAppointment,
    handleAddAppointmentType,
    editingAppointment,
    setEditingAppointment,
    handleUpdateAppointmentType,
    deleteTarget,
    setDeleteTarget,
    deletingAppointment,
    handleDeleteAppointmentType,
    formatDuration,
}: AppointmentTypesTabProps) {
    const highlightClass = (field: string) =>
        prefillFlashFields.includes(field)
            ? "ring-2 ring-sky-200 shadow-[0_0_0_1px_rgba(14,165,233,0.35)]"
            : ""

    const [newCategoryInput, setNewCategoryInput] = useState("")
    const emptyCategoryValue = "__no-category"
    const categoryLabels = [...new Set(appointmentTypes.map(apt => apt.category?.name ?? "Overig"))]

    return (
        <>
            <Card className="border-slate-200 shadow-xl">
                <CardHeader className="text-[#081245] space-y-2">
                    <CardTitle className="flex items-center space-x-2 text-xl">
                        <Plus className="h-5 w-5" />
                        <span>Nieuw afspraaktype toevoegen</span>
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600">
                        Creer nieuwe diensten sneller door eerst een preset te kiezen en daarna details af te werken.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <Sparkles className="h-4 w-4 text-sky-500" />
                            Gebruik een preset
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                            Kies een standaarddienst en pas duur of prijs aan voordat je toevoegt.
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setPresetDialogOpen(true)}
                                disabled={!!presetsError}
                            >
                                Preset bibliotheek openen
                            </Button>
                            {presetsError && (
                                <span className="text-xs text-red-500">
                                    {presetsError}. Probeer de pagina te herladen.
                                </span>
                            )}
                        </div>
                        {lastAppliedPreset && (
                            <div className="mt-4 space-y-2 rounded-xl border border-sky-200 bg-white/90 p-4 text-sm shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-base font-semibold text-slate-900">
                                            {lastAppliedPreset.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDuration(lastAppliedPreset.duration)} - {lastAppliedPreset.category}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="sm" type="button" onClick={clearAppliedPreset} className="text-slate-500 hover:text-slate-900">
                                        <Undo2 className="mr-2 h-3.5 w-3.5" />
                                        Reset
                                    </Button>
                                </div>
                                {lastAppliedPreset.description && (
                                    <p className="text-xs text-slate-600">{lastAppliedPreset.description}</p>
                                )}
                            </div>
                        )}
                    </section>
                    <Dialog open={isPresetDialogOpen} onOpenChange={setPresetDialogOpen}>
                        <DialogContent className="max-w-3xl">
                            {!pendingPreset ? (
                                <>
                                    <DialogHeader>
                                        <DialogTitle>Kies een preset</DialogTitle>
                                        <DialogDescription>
                                            Selecteer een dienstcategorie en pas deze later naar wens aan.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="mt-4 space-y-5 max-h-[60vh] overflow-y-auto pr-2">
                                        {presetsLoading && (
                                            <p className="text-sm text-muted-foreground">Presets worden geladen...</p>
                                        )}
                                        {!presetsLoading && presetGroups.length === 0 && (
                                            <p className="text-sm text-muted-foreground">Geen presets gevonden.</p>
                                        )}
                                        {presetGroups.map(group => (
                                            <div key={group.category} className="space-y-3">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                    {group.category}
                                                </p>
                                                <div className="grid gap-3 md:grid-cols-2">
                                                    {group.presets.map(preset => (
                                                        <div key={preset.id} className="rounded-lg border p-4 shadow-sm">
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <p className="font-medium text-[#081245]">{preset.name}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {formatDuration(preset.duration)}
                                                                        {preset.description ? ` - ${preset.description}` : ""}
                                                                    </p>
                                                                </div>
                                                                <Button size="sm" type="button" onClick={() => startPresetConfiguration(preset)}>
                                                                    Selecteer
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <DialogHeader>
                                        <DialogTitle>{pendingPreset.name}</DialogTitle>
                                        <DialogDescription>
                                            Pas optioneel de duur en prijs aan voordat je hem toevoegt aan het formulier.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <Label>Duur (minuten)</Label>
                                                <Input
                                                    type="number"
                                                    min={5}
                                                    value={pendingDuration}
                                                    onChange={e => {
                                                        const value = parseInt(e.target.value, 10)
                                                        setPendingDuration(Number.isFinite(value) ? Math.max(5, value) : 5)
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Label>Prijs (EUR) - Optioneel</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={pendingPrice}
                                                    onChange={e => setPendingPrice(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <Button variant="ghost" type="button" onClick={() => setPendingPreset(null)}>
                                            <Undo2 className="mr-2 h-3.5 w-3.5" />
                                            Andere preset kiezen
                                        </Button>
                                        <div className="flex w-full justify-end gap-2 sm:w-auto">
                                            <Button type="button" variant="outline" onClick={() => setPresetDialogOpen(false)} disabled={creatingAppointment}>
                                                Annuleren
                                            </Button>
                                            <Button type="button" onClick={handleConfirmPreset} disabled={creatingAppointment}>
                                                {creatingAppointment ? "Toevoegen..." : "Preset toepassen"}
                                            </Button>
                                        </div>
                                    </DialogFooter>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>
                    <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-12">
                            <div className="md:col-span-7">
                                <Label>Dienst</Label>
                                <Input
                                    className={cn(highlightClass("name"))}
                                    placeholder="Bijv. Knipbeurt heren"
                                    value={newAppointmentType.name || ""}
                                    onChange={e => setNewAppointmentType({ ...newAppointmentType, name: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <Label>Duur (minuten)</Label>
                                <Input
                                    className={cn(highlightClass("duration"))}
                                    type="number"
                                    min="5"
                                    placeholder="30"
                                    value={newAppointmentType.duration || ""}
                                    onChange={e => setNewAppointmentType({ ...newAppointmentType, duration: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label>Prijs (EUR) - Optioneel</Label>
                                <Input
                                    className={cn("text-black", highlightClass("price"))}
                                    type="number"
                                    step="0.01"
                                    placeholder="25,00"
                                    value={newAppointmentType.price ?? ""}
                                    onChange={e => setNewAppointmentType({
                                        ...newAppointmentType,
                                        price: e.target.value ? parseFloat(e.target.value) : undefined
                                    })}
                                />
                                <p className="mt-1 text-xs text-muted-foreground">Laat leeg voor gratis dienst</p>
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-3">
                                <div>
                                    <Label>Bestaande categorieen</Label>
                                    <Select
                                        value={
                                            newAppointmentType.categoryId != null
                                                ? String(newAppointmentType.categoryId)
                                                : emptyCategoryValue
                                        }
                                        onValueChange={value => {
                                            if (value === emptyCategoryValue) {
                                                setNewAppointmentType(prev => ({
                                                    ...prev,
                                                    categoryId: null,
                                                    newCategoryName: undefined,
                                                }))
                                                return
                                            }
                                            const parsed = Number(value)
                                            setNewAppointmentType(prev => ({
                                                ...prev,
                                                categoryId: Number.isFinite(parsed) ? parsed : null,
                                                newCategoryName: undefined,
                                            }))
                                        }}
                                    >
                                        <SelectTrigger className={cn("w-full", highlightClass("category"))}>
                                            <SelectValue placeholder="Selecteer een categorie" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={emptyCategoryValue} key="none">
                                                Geen categorie
                                            </SelectItem>
                                            {categoryOptions.length === 0 ? (
                                                <SelectItem value="__no-categories" disabled>
                                                    Nog geen categorieen
                                                </SelectItem>
                                            ) : (
                                                categoryOptions
                                                    .filter(option => option.id != null)
                                                    .map(option => (
                                                        <SelectItem key={option.id} value={String(option.id)}>
                                                            {option.name || "Overig"}
                                                        </SelectItem>
                                                    ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                                    <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nieuwe categorie</Label>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <Input
                                            value={newCategoryInput}
                                            placeholder="Bijv. Sales"
                                            onChange={e => setNewCategoryInput(e.target.value)}
                                            className={cn("flex-1", highlightClass("category"))}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={!newCategoryInput.trim()}
                                            onClick={() => {
                                                const value = newCategoryInput.trim()
                                                if (!value) return
                                                setNewAppointmentType(prev => ({
                                                    ...prev,
                                                    categoryId: undefined,
                                                    newCategoryName: value,
                                                }))
                                                setNewCategoryInput("")
                                            }}
                                        >
                                            Invoeren
                                        </Button>
                                    </div>
                                    {newAppointmentType.newCategoryName && (
                                        <p className="text-xs text-slate-500">
                                            Nieuwe categorie geselecteerd: <span className="font-medium">{newAppointmentType.newCategoryName}</span>
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-500">
                                        Voeg een naam toe en klik op <span className="font-medium">Invoeren</span> om hem te selecteren.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                                    Tip: groepeer diensten in duidelijke categorieen zoals "Sales" of "Nazorg" voor overzicht in je planning.
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Beschrijving</Label>
                                <Textarea
                                    className={cn(
                                        "h-full resize-none",
                                        highlightClass("description")
                                    )}
                                    placeholder="Interne toelichting of extra informatie voor het team"
                                    value={newAppointmentType.description || ""}
                                    onChange={e => setNewAppointmentType({ ...newAppointmentType, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="h-px bg-slate-100" />
                        <div className="flex flex-col items-center gap-3 pt-2">
                            <Button
                                onClick={handleAddAppointmentType}
                                size="lg"
                                disabled={creatingAppointment}
                                className="w-full max-w-xs justify-center bg-[#0ea5e9] text-base font-semibold text-white hover:text-white hover:bg-[#0ca5e9]/70"
                            >
                                {creatingAppointment ? "Opslaan..." : (
                                    <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Afspraaktype toevoegen
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-muted-foreground">Sla je wijzigingen op zodra alles goed staat.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="text-[#081245] space-y-1">
                    <CardTitle className="text-lg font-semibold">Afspraaktypes</CardTitle>
                    <CardDescription className="text-sm text-slate-500">
                        Bekijk je diensten per categorie en wijzig ze rechtstreeks vanuit de lijst.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {categoryLabels.map(category => {
                        const bucket = appointmentTypes.filter(apt => (apt.category?.name ?? "Overig") === category)
                        if (!bucket.length) return null
                        return (
                            <section key={category} className="space-y-4 ">
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Categorie</p>
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-lg font-semibold text-slate-900">{category}</h3>
                                        <p className="text-xs text-muted-foreground">{bucket.length} type{bucket.length > 1 ? "s" : ""}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {bucket.map(appointmentType => (
                                        <div key={appointmentType.id} className="group rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm transition hover:border-sky-200 hover:shadow-md">
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
                                                <div className="space-y-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <h3 className="font-semibold text-slate-900">{appointmentType.name}</h3>
                                                            {appointmentType.description && (
                                                                <p className="mt-1 text-xs text-muted-foreground">{appointmentType.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                                                            <Button variant="ghost" size="icon" onClick={() => setEditingAppointment(appointmentType.id)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteTarget(appointmentType)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                                                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                                            <Clock className="h-4 w-4 text-slate-500" />
                                                            {formatDuration(appointmentType.duration)}
                                                        </span>
                                                        {appointmentType.price != null && (
                                                            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                                                <Euro className="h-4 w-4 text-slate-500" />
                                                                {Number(appointmentType.price).toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )
                    })}
                </CardContent>
            </Card>

            <AlertDialog open={!!deleteTarget} onOpenChange={open => {
                if (!open && !deletingAppointment) {
                    setDeleteTarget(null)
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTarget ? `${deleteTarget.name} verwijderen?` : "Selecteer een afspraaktype om te verwijderen."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingAppointment}>Annuleren</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAppointmentType} disabled={deletingAppointment}>
                            {deletingAppointment ? "Verwijderen..." : "Verwijderen"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
