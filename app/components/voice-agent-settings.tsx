"use client"

import {useCallback, useEffect, useRef, useState} from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mic, Volume2, Brain, MessageSquare, Play, Pause, Settings } from "lucide-react"
import {VoiceId} from "@/enums/VoiceId";
import {BACKEND_URL} from "@/lib/api-config";
import {ReplyStyle, VoiceSettings} from "@/lib/types/types";
import {ReplyStyleEnum} from "@/enums/ReplyStyleEnum";
import {ReplyStyleDescriptionEnum} from "@/enums/ReplyStyleDescriptionEnum";
import VoiceAgentSkeleton from "@/components/skeletons/VoiceAgentSkeleton";
import {TooltipProvider} from "@/components/ui/tooltip";
import {InfoTooltip} from "@/components/info-tooltip";

interface VoiceAgentSettingsProps {
  onDirtyChange?: (dirty: boolean) => void
}

export function VoiceAgentSettings({ onDirtyChange }: VoiceAgentSettingsProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const defaultVoiceSettings: VoiceSettings = {
    id: 0,
    companyId: 0,
    welcomePhrase: "Goeiedag, hoe kan ik u helpen?",
    talkingSpeed: 1.0,
    voiceId: VoiceId.Melanie,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const defaultReplyStyle: ReplyStyle = {
    id: 0,
    companyId: 0,
    name: ReplyStyleEnum.Professional,
    description: ReplyStyleDescriptionEnum.Professional,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(defaultVoiceSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const initialLoadCompleteRef = useRef(false)
  const isSavingRef = useRef(false)

  const [agentSettings, setAgentSettings] = useState<ReplyStyle>(defaultReplyStyle)

  const updateVoiceSettings = useCallback((updater: (prev: VoiceSettings) => VoiceSettings) => {
    setVoiceSettings(prev => {
      const next = updater(prev)
      if (initialLoadCompleteRef.current && !isSavingRef.current && next !== prev) {
        setIsDirty(true)
      }
      return next
    })
  }, [])

  const updateAgentSettings = useCallback((updater: (prev: ReplyStyle) => ReplyStyle) => {
    setAgentSettings(prev => {
      const next = updater(prev)
      if (initialLoadCompleteRef.current && !isSavingRef.current && next !== prev) {
        setIsDirty(true)
      }
      return next
    })
  }, [])

  const voices = Object.entries(VoiceId).map(([name, id]) => ({
    name,
    id,
  }))

  const replyStyleDescriptions: Record<ReplyStyleEnum, string> = {
    [ReplyStyleEnum.Professional]: ReplyStyleDescriptionEnum.Professional,
    [ReplyStyleEnum.Casual]:       ReplyStyleDescriptionEnum.Casual,
    [ReplyStyleEnum.Empathetic]:   ReplyStyleDescriptionEnum.Empathetic,
    [ReplyStyleEnum.Humorous]:     ReplyStyleDescriptionEnum.Humorous,
  }

  const personalities = Object.values(ReplyStyleEnum).map((id) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    description: replyStyleDescriptions[id],
  }))
  const [playingVoiceKey, setPlayingVoiceKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  function playPreview(voiceKey: string) {
    const src = `voices/${voiceKey}.mp3`; // file names: Koen.mp3, Bella.mp3, Eric.mp3
    const same = playingVoiceKey === voiceKey;

    // Toggle pause/resume if same voice
    if (same && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
      return;
    }

    // Start a new voice
    audioRef.current?.pause();
    const audio = new Audio(src);
    audioRef.current = audio;
    setPlayingVoiceKey(voiceKey);

    audio.addEventListener("ended", () => setPlayingVoiceKey(null));
    audio.addEventListener("pause", () => {
      if (playingVoiceKey === voiceKey) setPlayingVoiceKey(null);
    });

    audio.play().catch(err => {
      console.error("Preview play failed:", err);
      setPlayingVoiceKey(null);
    });
  }

  useEffect(() => {
    async function fetchAllSettings() {
      try {
        const token = localStorage.getItem("jwt")
        const [voiceRes, replyRes] = await Promise.all([
          fetch(`${BACKEND_URL}/voice-settings/settings`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BACKEND_URL}/voice-settings/reply-style`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (!voiceRes.ok) {
          throw new Error(`Voice settings load failed: ${voiceRes.status}`)
        }
        if (!replyRes.ok) {
          throw new Error(`Reply-style load failed: ${replyRes.status}`)
        }

        const dataVoice: VoiceSettings = await voiceRes.json()
        const dataReply: ReplyStyle = await replyRes.json()

        setVoiceSettings(dataVoice)
        setAgentSettings({
          ...dataReply,
          description: replyStyleDescriptions[dataReply.name as ReplyStyleEnum],
        })
      } catch (err: any) {
        setError(err.message || "Error fetching voice or reply-style settings")
      } finally {
        setLoading(false)
        initialLoadCompleteRef.current = true
        setIsDirty(false)
        setSaveStatus("idle")
      }
    }

    fetchAllSettings()
  }, [])

  const handleSave = async () => {
    if (!initialLoadCompleteRef.current || !isDirty) {
      return
    }

    setSaving(true)
    setError(null)
    setSaveStatus("saving")
    isSavingRef.current = true
    const token = localStorage.getItem("jwt")
    try {
      const [voiceRes, replyRes] = await Promise.all([
        fetch(`${BACKEND_URL}/voice-settings/settings`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(voiceSettings),
        }),
        fetch(`${BACKEND_URL}/voice-settings/reply-style`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(agentSettings),
        }),
      ])

      if (!voiceRes.ok) throw new Error(`Voice save failed (${voiceRes.status})`)
      if (!replyRes.ok) throw new Error(`Personality save failed (${replyRes.status})`)

      setIsDirty(false)
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (err: any) {
      setError(err.message || "Failed to save settings")
      setSaveStatus("error")
    } finally {
      isSavingRef.current = false
      setSaving(false)
    }
  }


  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

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


  const handleVoicePreview = () => {
    setIsPlaying(!isPlaying)
    // Simulate voice preview
    setTimeout(() => setIsPlaying(false), 3000)
  }

  if (loading) {
    return (
        <VoiceAgentSkeleton></VoiceAgentSkeleton>
    )
  }

  if (error) {
    return <div>Error: {error}</div>
  }


  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">CallingBird instellingen</h2>
            <p className="text-gray-600">Configureer het gedrag en de eigenschappen van je AI-spraakagent</p>
          </div>
          <div className="flex items-center gap-3">
            {getSaveStatusBadge()}
            <Button onClick={handleSave} disabled={saving || loading || !isDirty}>
              {saving ? "Opslaan…" : "Alles opslaan"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="voice" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="voice" className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4" />
              <span>Stem</span>
            </TabsTrigger>
            <TabsTrigger value="personality" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>Persoonlijkheid</span>
            </TabsTrigger>
            {/*<TabsTrigger value="behavior" className="flex items-center space-x-2">*/}
            {/*  <MessageSquare className="h-4 w-4" />*/}
            {/*  <span>Behavior</span>*/}
            {/*</TabsTrigger>*/}
            {/*<TabsTrigger value="advanced" className="flex items-center space-x-2">*/}
            {/*  <Settings className="h-4 w-4" />*/}
            {/*  <span>Advanced</span>*/}
            {/*</TabsTrigger>*/}
          </TabsList>

          <TabsContent value="voice" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Voice Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    <span>Stemselectie</span>
                    <InfoTooltip
                      label="Stemselectie"
                      content={"Kies de stem die bellers horen. Klik op een optie om deze als standaard te gebruiken en druk op het afspeelicoon voor een voorbeeld."}
                    />
                  </CardTitle>
                  <CardDescription>Kies welke stem jouw AI-agent gebruikt</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {Object.entries(VoiceId).map(([voiceKey, elevenLabsId]) => (
                      <div
                        key={voiceKey}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          voiceSettings?.voiceId === elevenLabsId
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => updateVoiceSettings(prev => {
                          if (prev.voiceId === elevenLabsId) return prev
                          return { ...prev, voiceId: elevenLabsId }
                        })}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{voiceKey}</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              playPreview(voiceKey);
                            }}
                          >
                            {playingVoiceKey === voiceKey ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Voice Parameters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>Stemparameters</span>
                    <InfoTooltip
                      label="Stemparameters"
                      content={"Pas aan hoe de stem klinkt zodat deze aansluit bij je bedrijf. Dit heeft direct invloed op alle toekomstige gesprekken."}
                    />
                  </CardTitle>
                  <CardDescription>Stem eigenschappen verfijnen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <Label>Praatsnelheid</Label>
                      <InfoTooltip
                        label="Praatsnelheid"
                        content={"Stel in hoe snel de agent spreekt. 1,0 is normaal tempo; langzamer geeft meer rust, sneller houdt gesprekken kort."}
                      />
                    </div>
                    <div className="mt-2">
                      <Slider
                        value={[voiceSettings.talkingSpeed]}
                        onValueChange={(value) => updateVoiceSettings(prev => {
                          const speed = value[0]
                          if (prev.talkingSpeed === speed) return prev
                          return { ...prev, talkingSpeed: speed }
                        })}
                        max={1.2}
                        min={0.7}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Slow</span>
                        <span>{voiceSettings.talkingSpeed}x</span>
                        <span>Fast</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="greeting">Begroeting</Label>
                      <InfoTooltip
                        label="Begroeting"
                        content={"Dit is de openingszin zodra een gesprek start. Gebruik duidelijke taal en noem eventueel je bedrijfsnaam."}
                      />
                    </div>
                    <Textarea
                        id="greeting"
                        value={voiceSettings.welcomePhrase}
                        onChange={(e) => {
                          const value = e.target.value
                          updateVoiceSettings(prev => {
                            if (prev.welcomePhrase === value) return prev
                            return { ...prev, welcomePhrase: value }
                          })
                        }}
                        rows={3}
                        placeholder="Enter the greeting message"
                    />
                    <p className="text-xs text-gray-500 mt-1">Deze boodschap wordt uitgesproken zodra het gesprek begint</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="personality" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>AI persoonlijkheid</span>
                  <InfoTooltip
                    label="AI persoonlijkheid"
                    content={"Bepaal de toon en stijl van antwoorden. Elke persoonlijkheid past de woordkeuze en houding van de agent automatisch aan."}
                  />
                </CardTitle>
                <CardDescription>Bepaal hoe je AI-agent met bellers omgaat</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Label>Persoonlijkheidstype</Label>
                    <InfoTooltip
                      label="Persoonlijkheidstype"
                      content={"Selecteer het profiel dat het beste past bij je merk. Dit bepaalt hoe formeel, informeel of empathisch antwoorden klinken."}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {personalities.map((personality) => (
                      <div
                        key={personality.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          agentSettings.name === personality.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => updateAgentSettings(prev => {
                          if (prev.name === personality.id) return prev
                          return {
                            ...prev,
                            name: personality.id,
                            description: replyStyleDescriptions[personality.id],
                          }
                        })}
                      >
                        <h4 className="font-medium">{personality.name}</h4>
                        <p className="text-sm text-gray-600">{personality.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/*<TabsContent value="behavior" className="space-y-6">*/}
        {/*  <Card>*/}
        {/*    <CardHeader>*/}
        {/*      <CardTitle>Call Behavior</CardTitle>*/}
        {/*      <CardDescription>Configure how your agent handles calls</CardDescription>*/}
        {/*    </CardHeader>*/}
        {/*    <CardContent className="space-y-6">*/}
        {/*      <div>*/}
        {/*        <Label htmlFor="max-duration">Maximum Call Duration (minutes)</Label>*/}
        {/*        <Input*/}
        {/*          id="max-duration"*/}
        {/*          type="number"*/}
        {/*          value={agentSettings.maxCallDuration}*/}
        {/*          onChange={(e) =>*/}
        {/*            setAgentSettings({ ...agentSettings, maxCallDuration: Number.parseInt(e.target.value) })*/}
        {/*          }*/}
        {/*          min="1"*/}
        {/*          max="120"*/}
        {/*        />*/}
        {/*      </div>*/}

        {/*      <div className="space-y-4">*/}
        {/*        <div className="flex items-center justify-between">*/}
        {/*          <div>*/}
        {/*            <Label>Call Recording</Label>*/}
        {/*            <p className="text-sm text-gray-500">Record all calls for quality assurance</p>*/}
        {/*          </div>*/}
        {/*          <Switch*/}
        {/*            checked={agentSettings.enableRecording}*/}
        {/*            onCheckedChange={(checked) => setAgentSettings({ ...agentSettings, enableRecording: checked })}*/}
        {/*          />*/}
        {/*        </div>*/}

        {/*        <div className="flex items-center justify-between">*/}
        {/*          <div>*/}
        {/*            <Label>Live Transcription</Label>*/}
        {/*            <p className="text-sm text-gray-500">Generate real-time transcripts</p>*/}
        {/*          </div>*/}
        {/*          <Switch*/}
        {/*            checked={agentSettings.enableTranscription}*/}
        {/*            onCheckedChange={(checked) => setAgentSettings({ ...agentSettings, enableTranscription: checked })}*/}
        {/*          />*/}
        {/*        </div>*/}

        {/*        <div className="flex items-center justify-between">*/}
        {/*          <div>*/}
        {/*            <Label>Sentiment Analysis</Label>*/}
        {/*            <p className="text-sm text-gray-500">Analyze caller emotions and tone</p>*/}
        {/*          </div>*/}
        {/*          <Switch*/}
        {/*            checked={agentSettings.enableSentimentAnalysis}*/}
        {/*            onCheckedChange={(checked) =>*/}
        {/*              setAgentSettings({ ...agentSettings, enableSentimentAnalysis: checked })*/}
        {/*            }*/}
        {/*          />*/}
        {/*        </div>*/}
        {/*      </div>*/}
        {/*    </CardContent>*/}
        {/*  </Card>*/}
        {/*</TabsContent>*/}

        {/*<TabsContent value="advanced" className="space-y-6">*/}
        {/*  <Card>*/}
        {/*    <CardHeader>*/}
        {/*      <CardTitle>Advanced Settings</CardTitle>*/}
        {/*      <CardDescription>Configure advanced AI and technical parameters</CardDescription>*/}
        {/*    </CardHeader>*/}
        {/*    <CardContent className="space-y-6">*/}
        {/*      <div>*/}
        {/*        <Label htmlFor="ai-model">AI Model</Label>*/}
        {/*        <Select defaultValue="gpt-4">*/}
        {/*          <SelectTrigger>*/}
        {/*            <SelectValue />*/}
        {/*          </SelectTrigger>*/}
        {/*          <SelectContent>*/}
        {/*            <SelectItem value="gpt-4">GPT-4 (Recommended)</SelectItem>*/}
        {/*            <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>*/}
        {/*            <SelectItem value="claude">Claude 3</SelectItem>*/}
        {/*          </SelectContent>*/}
        {/*        </Select>*/}
        {/*      </div>*/}

        {/*      <div>*/}
        {/*        <Label htmlFor="response-timeout">Response Timeout (seconds)</Label>*/}
        {/*        <Input id="response-timeout" type="number" defaultValue="5" min="1" max="30" />*/}
        {/*      </div>*/}

        {/*      <div>*/}
        {/*        <Label htmlFor="webhook-url">Webhook URL</Label>*/}
        {/*        <Input id="webhook-url" placeholder="https://your-app.com/webhook" />*/}
        {/*        <p className="text-xs text-gray-500 mt-1">Receive real-time call events and data</p>*/}
        {/*      </div>*/}

        {/*      <div>*/}
        {/*        <Label htmlFor="custom-instructions">Custom Instructions</Label>*/}
        {/*        <Textarea*/}
        {/*          id="custom-instructions"*/}
        {/*          placeholder="Add specific instructions for your AI agent..."*/}
        {/*          rows={4}*/}
        {/*        />*/}
        {/*      </div>*/}
        {/*    </CardContent>*/}
        {/*  </Card>*/}
        {/*</TabsContent>*/}
      </Tabs>
      </div>
    </TooltipProvider>
  )
}
