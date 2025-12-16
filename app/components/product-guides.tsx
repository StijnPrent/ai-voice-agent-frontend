// Product guides page with list + inline form toggle
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, BookCopy, FileText, Pencil, Plus, ArrowLeft } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { BACKEND_URL } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import ProductGuideFormPage from "@/components/add-guide"

export type ProductStatus = "draft" | "published" | string
export type Product = {
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
    version?: string
    source?: string
    updatedAt?: string
}

type ProductForm = {
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

export function ProductGuides({ autoOpenGuideFormKey }: { autoOpenGuideFormKey?: number } = {}) {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<ProductForm>(initialForm)
    const [publish, setPublish] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const router = useRouter()

    const updateProductIdQuery = useCallback(
        (nextId?: string | null) => {
            if (typeof window === "undefined") {
                return
            }
            const url = new URL(window.location.href)
            if (nextId) {
                url.searchParams.set("id", nextId)
            } else {
                url.searchParams.delete("id")
            }
            router.replace(url.pathname + url.search)
        },
        [router],
    )

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

    useEffect(() => {
        if (!autoOpenGuideFormKey) return
        setShowForm(true)
        setEditingId(null)
        setForm(initialForm)
        setPublish(true)
        setShowAdvanced(false)
        updateProductIdQuery()
    }, [autoOpenGuideFormKey, updateProductIdQuery])

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
            const wasEditing = Boolean(editingId)
            toast({
                title: editingId ? "Guide bijgewerkt" : "Guide toegevoegd",
                description: `${form.name} opgeslagen als ${publish ? "published" : "draft"}.`,
            })
            await fetchProducts()
            setEditingId(null)
            setShowAdvanced(false)
            setForm(initialForm)
            setPublish(true)
            if (wasEditing) {
                setShowForm(false)
            }
        } catch (err: any) {
            toast({ variant: "destructive", title: "Kon niet opslaan", description: err?.message || "Controleer je invoer en probeer opnieuw." })
        } finally {
            setSaving(false)
        }
    }

    const list = useMemo(
        () =>
            products.map((product) => (
                <div key={product.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col">
                                    <span className="text-[0.6rem] uppercase tracking-wide text-slate-500">Scenario</span>
                                    <p className="text-lg font-semibold text-[#081245] leading-snug line-clamp-1">{product.name}</p>
                                </div>
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                    {(product.status ?? "published").toString()}
                                </Badge>
                            </div>
                            {product.summary && (
                                <p className="text-sm text-gray-600 line-clamp-1">{product.summary}</p>
                            )}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pt-1">
                                {product.sku && <span>SKU: {product.sku}</span>}
                                {product.updatedAt && <span>Laatste update: {new Date(product.updatedAt).toLocaleString()}</span>}
                                {product.version && <span>Versie: {product.version}</span>}
                            </div>
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
                                setShowForm(true)
                                setShowAdvanced(false)
                                updateProductIdQuery(product.id)
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

    const faqEmpty = useMemo(() => !form.faq.length, [form.faq])
    const policiesEmpty = useMemo(() => !form.policies.length, [form.policies])
    const metadataEmpty = useMemo(() => !form.metadata.length, [form.metadata])

    return (
        <TooltipProvider delayDuration={0}>
            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-[#081245]">Handleidingen</h2>
                        <p className="text-gray-600">Publiceer duidelijke telefonie-handleidingen voor Birdy.</p>
                    </div>
                    {!showForm && (
                        <Button
                            onClick={() => {
                                setShowForm(true)
                                setEditingId(null)
                                setForm(initialForm)
                                setPublish(true)
                                setShowAdvanced(false)
                                updateProductIdQuery()
                            }}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Nieuwe handleiding
                        </Button>
                    )}
                </div>

                {!showForm ? (
                    <Card className="border-blue-100 shadow-sm">
                        <CardHeader className="text-[#081245]">
                            <CardTitle className="flex items-center gap-2">
                                <BookCopy className="h-5 w-5" />
                                Bestaande handleidingen
                            </CardTitle>
                            <CardDescription>Bekijk of bewerk bestaande handleidingen.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                    {loading ? "Laden..." : `${products.length} handleiding(en)`}
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
                                    Handleidingen laden...
                                </div>
                            ) : products.length ? (
                                list
                            ) : (
                                <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-gray-600">
                                    Nog geen handleidingen. Voeg er een toe via "Nieuwe handleiding".
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-blue-100 shadow-sm">
                        <CardHeader className="text-[#081245]">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        {editingId ? "Guide bewerken" : "Guide toevoegen"}
                                    </CardTitle>
                                    <CardDescription>Vertel Birdy hoe hij een gesprek moet begeleiden.</CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setShowForm(false)
                                        setEditingId(null)
                                        setForm(initialForm)
                                        setPublish(true)
                                        setShowAdvanced(false)
                                        updateProductIdQuery()
                                    }}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Terug naar lijst
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <ProductGuideFormPage />
                        </CardContent>
                    </Card>
                )}
            </div>
        </TooltipProvider>
    )
}
