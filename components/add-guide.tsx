"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { InfoTooltip } from "@/components/info-tooltip"
import { BACKEND_URL } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import type { Product } from "@/app/components/product-guides"

interface ProductForm {
    name: string
    sku: string
    summary: string
    contentSummary: string
    guide: string
    troubleshooting: string
    synonyms: string
    faq: { question: string; answer: string }[]
    policies: { title: string; content: string }[]
    restrictedTopics: string
    metadata: { key: string; value: string }[]
}

const initialForm: ProductForm = {
    name: "",
    sku: "",
    summary: "",
    contentSummary: "",
    guide: "",
    troubleshooting: "",
    synonyms: "",
    faq: [],
    policies: [],
    restrictedTopics: "",
    metadata: [],
}

export default function ProductGuideFormPage() {
    const searchParams = useSearchParams()
    const editingId = searchParams.get("id")

    const [form, setForm] = useState<ProductForm>(initialForm)
    const [publish, setPublish] = useState(true)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [saving, setSaving] = useState(false)
    const [loadingProduct, setLoadingProduct] = useState(!!editingId)
    const [error, setError] = useState<string | null>(null)

    const authHeaders = useCallback(() => ({ Authorization: `Bearer ${localStorage.getItem("jwt") ?? ""}` }), [])

    useEffect(() => {
        if (!editingId) return
        let cancelled = false
        async function loadProduct() {
            try {
                setLoadingProduct(true)
                setError(null)
                const res = await fetch(`${BACKEND_URL}/products/${editingId}`, { headers: authHeaders() })
                if (!res.ok) {
                    const text = await res.text().catch(() => "")
                    throw new Error(text || `Kon guide niet laden (${res.status})`)
                }
                const product: Product = await res.json()
                if (cancelled) return
                setForm({
                    name: product.name ?? "",
                    sku: product.sku ?? "",
                    summary: product.summary ?? "",
                    contentSummary: product.content?.summary ?? "",
                    guide: product.content?.description ?? "",
                    troubleshooting: (product.content?.troubleshooting ?? []).join("\n"),
                    synonyms: (product.synonyms ?? []).join("\n"),
                    faq: product.content?.faq ?? [],
                    policies: (product.content?.policies ?? []).map((p) => ({
                        title: p.title ?? "",
                        content: p.content ?? "",
                    })),
                    restrictedTopics: (product.content?.restrictedTopics ?? []).join("\n"),
                    metadata: Object.entries(product.content?.metadata ?? {}).map(([key, value]) => ({
                        key,
                        value: String(value),
                    })),
                })
                setPublish((product.status ?? "published") === "published")
            } catch (err: any) {
                if (!cancelled) {
                    setError(err?.message || "Kon guide niet laden")
                    toast({ variant: "destructive", title: "Laden mislukt", description: err?.message || "Probeer opnieuw." })
                }
            } finally {
                if (!cancelled) setLoadingProduct(false)
            }
        }
        loadProduct()
        return () => {
            cancelled = true
        }
    }, [editingId, authHeaders])

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            toast({ variant: "destructive", title: "Naam is verplicht" })
            return
        }
        const synonyms = form.synonyms
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter(Boolean)
        const faq = (form.faq || []).filter((f) => f.question.trim() && f.answer.trim())
        const policies = (form.policies || []).filter((p) => p.content.trim())
        const restrictedTopics = form.restrictedTopics
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        const troubleshooting = form.troubleshooting
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
        const metadataEntries = (form.metadata || []).filter((m) => m.key.trim() && m.value.trim())
        const metadata =
            metadataEntries.length > 0
                ? metadataEntries.reduce<Record<string, string>>((acc, cur) => {
                    acc[cur.key.trim()] = cur.value.trim()
                    return acc
                }, {})
                : undefined
        const payload: Record<string, unknown> = {
            name: form.name.trim(),
            sku: form.sku.trim() || undefined,
            summary: form.summary.trim() || undefined,
            synonyms: synonyms.length ? synonyms : undefined,
            status: publish ? "published" : "draft",
            source: "manual",
            content: {
                description: form.guide.trim() || undefined,
                summary: form.contentSummary.trim() || undefined,
                troubleshooting: troubleshooting,
                faq: faq.length ? faq : undefined,
                policies: policies.length ? policies : undefined,
                restrictedTopics: restrictedTopics.length ? restrictedTopics : undefined,
                metadata,
            },
        }
        try {
            setSaving(true)
            const url = editingId ? `${BACKEND_URL}/products/${editingId}` : `${BACKEND_URL}/products`
            const method = editingId ? "PUT" : "POST"
            const res = await fetch(url, {
                method,
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const text = await res.text().catch(() => "")
                throw new Error(text || `Opslaan mislukt (${res.status})`)
            }
            toast({
                title: editingId ? "Guide bijgewerkt" : "Guide toegevoegd",
                description: `${form.name} opgeslagen als ${publish ? "published" : "draft"}.`,
            })
        } catch (err: any) {
            toast({ variant: "destructive", title: "Kon niet opslaan", description: err?.message || "Controleer je invoer en probeer opnieuw." })
        } finally {
            setSaving(false)
        }
    }

    const faqEmpty = useMemo(() => !form.faq.length, [form.faq])
    const policiesEmpty = useMemo(() => !form.policies.length, [form.policies])
    const metadataEmpty = useMemo(() => !form.metadata.length, [form.metadata])

    return (
        <TooltipProvider delayDuration={0}>
            {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="flex flex-col gap-6 pb-10 lg:flex-row">
                <div className="w-full space-y-6 lg:basis-[60%]">
                    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                        <div>
                            <p className="text-sm font-semibold text-[#081245]">Waar gaat dit over?</p>
                            <p className="text-sm text-gray-600">Wanneer moet Birdy deze guide gebruiken?</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label>Naam *</Label>
                                    <InfoTooltip label="Naam" content="Korte titel die de klant herkent. Bijvoorbeeld: CV-ketel start niet." />
                                </div>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                    placeholder="Bijvoorbeeld: CV-ketel start niet"
                                    disabled={loadingProduct}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label>Andere namen hiervoor (1 per regel)</Label>
                                    <InfoTooltip label="Andere namen" content="Woorden die klanten gebruiken. Een per regel: lekkende ketel, verwarmt niet, storing 133." />
                                </div>
                                <Textarea
                                    rows={3}
                                    value={form.synonyms}
                                    onChange={(e) => setForm((p) => ({ ...p, synonyms: e.target.value }))}
                                    placeholder={"Lekkende ketel\nVerwarmt niet\nStoring 133"}
                                    disabled={loadingProduct}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label>Voorbeelden van wat klanten zeggen (1 per regel)</Label>
                                <InfoTooltip label="Herkenning" content="Gebruik letterlijke klantzinnen. Een regel per voorbeeld, geen bullets." />
                            </div>
                            <Textarea
                                rows={4}
                                value={form.troubleshooting}
                                onChange={(e) => setForm((p) => ({ ...p, troubleshooting: e.target.value }))}
                                placeholder={"Mijn cv doet niets\nRadiatoren blijven koud\nDisplay blijft op 00 staan"}
                                disabled={loadingProduct}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                        <div>
                            <p className="text-sm font-semibold text-[#081245]">Wat moet Birdy doen?</p>
                            <p className="text-sm text-gray-600">Leg uit hoe Birdy het gesprek begeleidt.</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Wat Birdy zegt (1 zin)</Label>
                                <Input
                                    value={form.summary}
                                    onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                                    placeholder="Ik help je de CV weer aan de praat te krijgen."
                                    disabled={loadingProduct}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Samenvatting voor Birdy</Label>
                                <Input
                                    value={form.contentSummary}
                                    onChange={(e) => setForm((p) => ({ ...p, contentSummary: e.target.value }))}
                                    placeholder="Stap-voor-stap reset en ontluchten controleren."
                                    disabled={loadingProduct}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label>Stap-voor-stap begeleiding voor het telefoongesprek</Label>
                                <InfoTooltip label="Gespreksstappen" content="Beschrijf kort wat Birdy moet vragen of voorstellen. Handig voor aftercare via telefonie." />
                            </div>
                            <Textarea
                                rows={6}
                                value={form.guide}
                                onChange={(e) => setForm((p) => ({ ...p, guide: e.target.value }))}
                                placeholder={
                                    "1. Vraag of de ketel stroom heeft en een foutcode toont.\n2. Laat de klant het toestel resetten en beschrijf hoe.\n3. Check druk op 1.5 bar en laat bijvullen indien lager.\n4. Als het nog faalt: noteer serie/sku en plan een monteur."
                                }
                                disabled={loadingProduct}
                            />
                            <p className="text-xs text-gray-600">Birdy mag stappen overslaan als de klant ze al heeft geprobeerd.</p>
                        </div>
                    </div>

                    <div className="space-y-4 rounded-lg border border-amber-100 bg-amber-50 p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                        <div>
                            <p className="text-sm font-semibold text-[#8a4d00]">Wanneer moet Birdy stoppen of doorverwijzen?</p>
                            <p className="text-sm text-amber-800">Veiligheidskaders: wat mag Birdy niet bespreken of moet worden doorgezet.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Stop- of verwijs-momenten (1 per regel)</Label>
                            <Textarea
                                rows={3}
                                value={form.restrictedTopics}
                                onChange={(e) => setForm((p) => ({ ...p, restrictedTopics: e.target.value }))}
                                placeholder={"Gaslek vermoeden\nOpen vuur of brand\nMedische klachten van klant"}
                                disabled={loadingProduct}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Label>Belangrijke policies</Label>
                                    <InfoTooltip label="Policies" content="Retour, garantie, veiligheid. Titel optioneel, uitleg verplicht." />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setForm((p) => ({ ...p, policies: [...p.policies, { title: "", content: "" }] }))}
                                    disabled={loadingProduct}
                                >
                                    <Plus className="h-4 w-4 mr-1" /> Voeg policy toe
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {form.policies.map((item, idx) => (
                                    <div key={idx} className="rounded-lg border border-slate-200 p-3 space-y-2 bg-white">
                                        <div className="flex items-center justify-between gap-2">
                                            <Label className="text-sm">Titel (optioneel)</Label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        policies: p.policies.filter((_, i) => i !== idx),
                                                    }))
                                                }
                                                disabled={loadingProduct}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <Input
                                            value={item.title}
                                            onChange={(e) =>
                                                setForm((p) => {
                                                    const next = [...p.policies]
                                                    next[idx] = { ...next[idx], title: e.target.value }
                                                    return { ...p, policies: next }
                                                })
                                            }
                                            placeholder="Retour / Garantie / Veiligheid"
                                            disabled={loadingProduct}
                                        />
                                        <Label className="text-sm">Uitleg</Label>
                                        <Textarea
                                            rows={2}
                                            value={item.content}
                                            onChange={(e) =>
                                                setForm((p) => {
                                                    const next = [...p.policies]
                                                    next[idx] = { ...next[idx], content: e.target.value }
                                                    return { ...p, policies: next }
                                                })
                                            }
                                            placeholder="Bij vermoeden gaslek: stop en verwijs door naar storingsdienst."
                                            disabled={loadingProduct}
                                        />
                                    </div>
                                ))}
                                {policiesEmpty && <p className="text-sm text-gray-500">Nog geen policies. Voeg er een toe.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-[#081245]">Geavanceerde instellingen (optioneel)</p>
                                <p className="text-sm text-gray-600">Alleen invullen als het echt nodig is.</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setShowAdvanced((v) => !v)}>
                                {showAdvanced ? "Verberg" : "Toon"}
                            </Button>
                        </div>
                        {showAdvanced && (
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label>SKU (optioneel)</Label>
                                    <Input
                                        value={form.sku}
                                        onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                                        placeholder="Interne code of partnumber"
                                        disabled={loadingProduct}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Label>FAQ</Label>
                                            <InfoTooltip label="FAQ" content="Korte, herhalende vragen en antwoorden. Houd dit beknopt." />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setForm((p) => ({ ...p, faq: [...p.faq, { question: "", answer: "" }] }))}
                                            disabled={loadingProduct}
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> Voeg vraag toe
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {form.faq.map((item, idx) => (
                                            <div key={idx} className="rounded-lg border border-slate-200 p-3 space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <Label className="text-sm">Vraag</Label>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            setForm((p) => ({
                                                                ...p,
                                                                faq: p.faq.filter((_, i) => i !== idx),
                                                            }))
                                                        }
                                                        disabled={loadingProduct}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <Input
                                                    value={item.question}
                                                    onChange={(e) =>
                                                        setForm((p) => {
                                                            const next = [...p.faq]
                                                            next[idx] = { ...next[idx], question: e.target.value }
                                                            return { ...p, faq: next }
                                                        })
                                                    }
                                                    placeholder="Bijv. Hoe vaak gebruiken?"
                                                    disabled={loadingProduct}
                                                />
                                                <Label className="text-sm">Antwoord</Label>
                                                <Textarea
                                                    rows={2}
                                                    value={item.answer}
                                                    onChange={(e) =>
                                                        setForm((p) => {
                                                            const next = [...p.faq]
                                                            next[idx] = { ...next[idx], answer: e.target.value }
                                                            return { ...p, faq: next }
                                                        })
                                                    }
                                                    placeholder="Kort, concreet antwoord."
                                                    disabled={loadingProduct}
                                                />
                                            </div>
                                        ))}
                                        {faqEmpty && <p className="text-sm text-gray-500">Nog geen FAQ. Voeg er een toe.</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Label>Extra velden (metadata)</Label>
                                            <InfoTooltip label="Extra velden" content="Key/value paren voor extra context (categorie, maat, kleur)." />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setForm((p) => ({ ...p, metadata: [...p.metadata, { key: "", value: "" }] }))}
                                            disabled={loadingProduct}
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> Voeg veld toe
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {form.metadata.map((item, idx) => (
                                            <div key={idx} className="grid md:grid-cols-2 gap-3 items-center">
                                                <Input
                                                    value={item.key}
                                                    onChange={(e) =>
                                                        setForm((p) => {
                                                            const next = [...p.metadata]
                                                            next[idx] = { ...next[idx], key: e.target.value }
                                                            return { ...p, metadata: next }
                                                        })
                                                    }
                                                    placeholder="bv. category"
                                                    disabled={loadingProduct}
                                                />
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={item.value}
                                                        onChange={(e) =>
                                                            setForm((p) => {
                                                                const next = [...p.metadata]
                                                                next[idx] = { ...next[idx], value: e.target.value }
                                                                return { ...p, metadata: next }
                                                            })
                                                        }
                                                        placeholder="bv. Haircare"
                                                        disabled={loadingProduct}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            setForm((p) => ({
                                                                ...p,
                                                                metadata: p.metadata.filter((_, i) => i !== idx),
                                                            }))
                                                        }
                                                        disabled={loadingProduct}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {metadataEmpty && <p className="text-sm text-gray-500">Optioneel: extra key/value velden.</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="w-full lg:basis-[40%]">
                    <div className="lg:sticky lg:top-6">
                        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-[#081245]">Preview: zo klinkt Birdy</p>
                                <Badge variant="secondary" className="bg-white text-gray-700 border border-slate-200">
                                    Alleen-lezen
                                </Badge>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-800">
                                <div className="rounded-md border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                                    <p className="text-xs uppercase text-slate-500">Klant zegt</p>
                                    <p className="mt-1 font-medium">
                                        {(form.troubleshooting.split("\n").find((l) => l.trim()) || "Mijn cv doet niets").trim()}
                                    </p>
                                </div>
                                <div className="rounded-md border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                                    <p className="text-xs uppercase text-slate-500">Birdy reageert</p>
                                    <p className="mt-1 font-medium">
                                        {(form.summary.trim() || form.contentSummary.trim() || "Ik help je stap voor stap zodat de CV het weer doet.").trim()}
                                    </p>
                                    {form.guide.trim() && <p className="mt-2 text-xs text-gray-600 line-clamp-2">{form.guide.split("\n")[0]}</p>}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-2 rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-[#081245]">Status</p>
                                    <p className="text-xs text-gray-700">Draft = Birdy gebruikt deze guide nog niet. Published = Live in telefoongesprekken.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Switch checked={publish} onCheckedChange={setPublish} id="publish-switch" />
                                    <Label htmlFor="publish-switch" className="text-sm text-gray-800">
                                        {publish ? "Published" : "Draft"}
                                    </Label>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-2">
                            <Button
                                className="bg-black px-6 text-white hover:bg-black/90 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                                onClick={handleSubmit}
                                disabled={saving || loadingProduct}
                            >
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Opslaan
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}
