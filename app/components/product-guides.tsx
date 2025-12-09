// Product guides manager - focuses on rich troubleshooting content for products
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, BookCopy, FileText, UploadCloud, Pencil, Plus, Trash2 } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { InfoTooltip } from "@/components/info-tooltip"
import { BACKEND_URL } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

type ProductStatus = "draft" | "published" | string
type Product = {
    id: string
    name: string
    sku?: string
    summary?: string
    status?: ProductStatus
    synonyms?: string[]
    content?: {
        description?: string
        troubleshooting?: string[]
        summary?: string
        faq?: { question: string; answer: string }[]
        policies?: { title?: string | null; content: string }[]
        restrictedTopics?: string[]
        metadata?: Record<string, unknown>
    }
    source?: string
    updatedAt?: string
}

type ProductForm = {
    name: string
    sku: string
    summary: string // top-level summary
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

export function ProductGuides() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [bulkSaving, setBulkSaving] = useState(false)
    const [bulkContent, setBulkContent] = useState("")
    const [bulkFilename, setBulkFilename] = useState("")
    const [bulkPublish, setBulkPublish] = useState(true)
    const [form, setForm] = useState<ProductForm>(initialForm)
    const [publish, setPublish] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)

    const authHeaders = useCallback(() => ({ Authorization: `Bearer ${localStorage.getItem("jwt") ?? ""}` }), [])

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetch(`${BACKEND_URL}/products`, { headers: authHeaders() })
            if (!res.ok) {
                const text = await res.text().catch(() => "")
                throw new Error(text || `Kon producten niet laden (${res.status})`)
            }
            const data = await res.json().catch(() => [])
            const list = Array.isArray(data) ? data : data.products ?? []
            setProducts(list)
        } catch (err: any) {
            setError(err?.message || "Kon producten niet laden")
        } finally {
            setLoading(false)
        }
    }, [authHeaders])

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

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
            await fetchProducts()
            toast({
                title: editingId ? "Product bijgewerkt" : "Product toegevoegd",
                description: `${form.name} opgeslagen als ${publish ? "published" : "draft"} (bron: manual).`,
            })
            setForm(initialForm)
            setPublish(true)
            setEditingId(null)
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Kon niet opslaan",
                description: err?.message || "Controleer je invoer en probeer opnieuw.",
            })
        } finally {
            setSaving(false)
        }
    }

    const handleBulk = async () => {
        if (!bulkContent.trim()) {
            toast({ variant: "destructive", title: "Geen content", description: "Voeg tekst of JSON toe." })
            return
        }
        const payload: Record<string, unknown> = {
            content: bulkContent,
            filename: bulkFilename.trim() || undefined,
            publish: bulkPublish,
        }
        try {
            setBulkSaving(true)
            const res = await fetch(`${BACKEND_URL}/products/ingest`, {
                method: "POST",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const text = await res.text().catch(() => "")
                throw new Error(text || `Bulk ingest mislukt (${res.status})`)
            }
            await fetchProducts()
            setBulkContent("")
            setBulkFilename("")
            toast({
                title: "Bulk ingest voltooid",
                description: `Items opgeslagen als ${bulkPublish ? "published" : "draft"} (bron: manual).`,
            })
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Kon bulk ingest niet uitvoeren",
                description: err?.message || "Probeer opnieuw met geldige input.",
            })
        } finally {
            setBulkSaving(false)
        }
    }

    const list = useMemo(
        () =>
            products.map((product) => (
                <div key={product.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-[#081245]">{product.name}</p>
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                    {(product.status ?? "published").toString()}
                                </Badge>
                            </div>
                            {product.summary && <p className="text-sm text-gray-600">{product.summary}</p>}
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                {product.sku && <span>SKU: {product.sku}</span>}
                                <span>Bron: manual</span>
                                {product.updatedAt && <span>Laatst bijgewerkt: {new Date(product.updatedAt).toLocaleString()}</span>}
                            </div>
                            {product.content?.description && (
                                <p className="text-sm text-gray-700 bg-slate-50 border border-slate-100 rounded p-2 mt-2 line-clamp-3">
                                    {product.content.description}
                                </p>
                            )}
                            {product.content?.troubleshooting?.length ? (
                                <div className="mt-2 text-xs text-slate-600">
                                    <span className="font-semibold text-[#081245]">Troubleshooting:</span>{" "}
                                    {product.content.troubleshooting.slice(0, 3).join(" • ")}
                                    {product.content.troubleshooting.length > 3 ? " …" : ""}
                                </div>
                            ) : null}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setEditingId(product.id)
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
                            }}
                        >
                            <Pencil className="h-4 w-4 mr-1" />
                            Bewerken
                        </Button>
                    </div>
                </div>
            )),
        [products],
    )

    return (
        <TooltipProvider delayDuration={0}>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-[#081245]">Product Guides</h2>
                    <p className="text-gray-600">Publiceer gedetailleerde debug- en supportinformatie per product.</p>
                </div>

                <Card className="border-blue-100 shadow-sm">
                    <CardHeader className="text-[#081245]">
                        <CardTitle className="flex items-center gap-2">
                            <BookCopy className="h-5 w-5" />
                            Bestaande guides
                        </CardTitle>
                        <CardDescription>Bekijk of bewerk bestaande guides.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                {loading ? "Laden..." : `${products.length} guides`}
                                {error && <span className="text-red-600 ml-2">{error}</span>}
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Vernieuwen
                            </Button>
                        </div>
                        {loading && !products.length ? (
                            <div className="flex items-center gap-2 text-gray-600">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Guides laden...
                            </div>
                        ) : products.length ? (
                            list
                        ) : (
                            <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-gray-600">
                                Nog geen guides. Voeg er een toe hieronder.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <Card className="border-blue-100 shadow-sm">
                        <CardHeader className="text-[#081245]">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                {editingId ? "Guide bewerken" : "Guide toevoegen"}
                            </CardTitle>
                            <CardDescription>
                                Kies draft of published; bron is altijd <strong>manual</strong>. Richt je op debug & support info.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        {/* Basics */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label>Naam *</Label>
                                    <InfoTooltip label="Naam" content="Herkenbare titel van het product of onderwerp. Gebruik namen die klanten gebruiken." />
                                </div>
                                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label>SKU (optioneel)</Label>
                                    <InfoTooltip label="SKU" content="Interne referentie of partnumber. Handig voor koppeling met systemen." />
                                </div>
                                <Input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label>Status</Label>
                                    <InfoTooltip label="Status" content="Publiceer direct of bewaar als draft." />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Switch checked={publish} onCheckedChange={setPublish} id="publish-switch" />
                                    <Label htmlFor="publish-switch" className="text-sm text-gray-700">
                                        {publish ? "Published" : "Draft"}
                                    </Label>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label>Synoniemen (1 per regel)</Label>
                                    <InfoTooltip label="Synoniemen" content="Andere namen die klanten gebruiken. Eén per regel." />
                                </div>
                                <Textarea
                                    rows={3}
                                    value={form.synonyms}
                                    onChange={(e) => setForm((p) => ({ ...p, synonyms: e.target.value }))}
                                    placeholder={"Hydraterende shampoo\nMilde shampoo"}
                                />
                            </div>
                        </div>

                        {/* Overview */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label>Korte samenvatting</Label>
                                    <InfoTooltip label="Korte samenvatting" content="een zin die het probleem of onderwerp beschrijft. Wordt gebruikt als korte blurb." />
                                </div>
                                <Input
                                    value={form.summary}
                                    onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                                    placeholder="Een regel over het probleem/onderwerp"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label>Content samenvatting</Label>
                                    <InfoTooltip label="Content samenvatting" content="Korte samenvatting specifiek voor de guide content. Kan afwijken van de bovenliggende samenvatting." />
                                </div>
                                <Input
                                    value={form.contentSummary}
                                    onChange={(e) => setForm((p) => ({ ...p, contentSummary: e.target.value }))}
                                    placeholder="Hydrateert zonder te verzwaren."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label>Uitgebreide guide / stappen</Label>
                                <InfoTooltip label="Guide" content="Beschrijving van diagnose en oplossing stap voor stap. Dit is de hoofdhandleiding." />
                            </div>
                            <Textarea
                                rows={6}
                                value={form.guide}
                                onChange={(e) => setForm((p) => ({ ...p, guide: e.target.value }))}
                                placeholder={
                                    "1. Probleembeschrijving: Software start niet op.\n2. Diagnose: Controleer internetverbinding, versie en foutmelding.\n3. Oplossing:\n   - Herstart de applicatie\n   - Wis cache en probeer opnieuw\n   - Update naar de laatste versie"
                                }
                            />
                        </div>

                        {/* FAQ */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Label>FAQ</Label>
                                    <InfoTooltip label="FAQ" content="Veelgestelde vragen met kort antwoord. Optioneel; gebruik alleen bij korte, herhalende vragen." />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setForm((p) => ({ ...p, faq: [...p.faq, { question: "", answer: "" }] }))}
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
                                        />
                                    </div>
                                ))}
                                {!form.faq.length && (
                                    <p className="text-sm text-gray-500">Nog geen FAQ. Voeg er een toe.</p>
                                )}
                            </div>
                        </div>

                        {/* Troubleshooting */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label>Korte zinnen zodat de AI het probleem makkelijker kan herkennen (1 per regel)</Label>
                                <InfoTooltip label="Troubleshooting" content="Losse regels; AI gebruikt dit voor herkenning en antwoorden. Één symptoom per regel, geen bullets." />
                            </div>
                            <Textarea
                                rows={4}
                                value={form.troubleshooting}
                                onChange={(e) => setForm((p) => ({ ...p, troubleshooting: e.target.value }))}
                                placeholder={"Zet elke klacht op een aparte regel, zonder opsommingstekens.\nApp start niet op\nDisplay blijft zwart\nGeen wifi verbinding"}
                            />
                        </div>

                        {/* Policies */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Label>Policies</Label>
                                    <InfoTooltip label="Policies" content="Retour, garantie, enz. Titel optioneel, content verplicht. Houd dit kort en duidelijk." />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setForm((p) => ({ ...p, policies: [...p.policies, { title: "", content: "" }] }))}
                                >
                                    <Plus className="h-4 w-4 mr-1" /> Voeg policy toe
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {form.policies.map((item, idx) => (
                                    <div key={idx} className="rounded-lg border border-slate-200 p-3 space-y-2">
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
                                            placeholder="Retour / Garantie / etc."
                                        />
                                        <Label className="text-sm">Content</Label>
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
                                            placeholder="Voorwaarden of uitleg."
                                        />
                                    </div>
                                ))}
                                {!form.policies.length && (
                                    <p className="text-sm text-gray-500">Nog geen policies. Voeg er een toe.</p>
                                )}
                            </div>
                        </div>

                        {/* Restricted topics */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label>Verboden onderwerpen (1 per regel)</Label>
                                <InfoTooltip label="Verboden onderwerpen" content="Wat de AI niet mag bespreken. Eén regel per item, bijvoorbeeld medische claims." />
                            </div>
                            <Textarea
                                rows={3}
                                value={form.restrictedTopics}
                                onChange={(e) => setForm((p) => ({ ...p, restrictedTopics: e.target.value }))}
                                placeholder={"Medische claims\nGebruik bij open wonden"}
                            />
                        </div>

                        {/* Metadata */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Label>Extra velden (metadata)</Label>
                                    <InfoTooltip label="Extra velden" content="Key/value paren voor extra velden (categorie, maat, kleur). Alleen toevoegen als het nuttig is." />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setForm((p) => ({ ...p, metadata: [...p.metadata, { key: "", value: "" }] }))}
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
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {!form.metadata.length && <p className="text-sm text-gray-500">Optioneel: extra key/value velden.</p>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            {editingId && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setEditingId(null)
                                        setForm(initialForm)
                                        setPublish(true)
                                    }}
                                >
                                    Annuleer
                                </Button>
                            )}
                            <Button onClick={handleSubmit} disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Opslaan
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                    <Card className="border-blue-100 shadow-sm">
                        <CardHeader className="text-[#081245]">
                            <CardTitle className="flex items-center gap-2">
                                <UploadCloud className="h-5 w-5" />
                                Bulk ingest
                            </CardTitle>
                            <CardDescription>Plak ruwe tekst of JSON. Alles wordt opgeslagen met bron manual.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tekst of JSON</Label>
                                <Textarea
                                    value={bulkContent}
                                    onChange={(e) => setBulkContent(e.target.value)}
                                    rows={10}
                                    placeholder="Plak productinformatie of JSON array met guides..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Bestandsnaam (optioneel)</Label>
                                <Input
                                    value={bulkFilename}
                                    onChange={(e) => setBulkFilename(e.target.value)}
                                    placeholder="guides.txt of guides.json"
                                />
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                <Switch checked={bulkPublish} onCheckedChange={setBulkPublish} id="bulk-publish" />
                                <Label htmlFor="bulk-publish">Publiceer direct (uit = draft)</Label>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleBulk} disabled={bulkSaving}>
                                    {bulkSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Verzenden
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TooltipProvider>
    )
}
