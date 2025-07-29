"use client"

import {useEffect, useState} from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export function VoiceAgentSettings() {
  const [isPlaying, setIsPlaying] = useState(false)
  const defaultVoiceSettings: VoiceSettings = {
    id: 0,
    companyId: 0,
    welcomePhrase: "Goeiedag, hoe kan ik u helpen?",
    talkingSpeed: 1.0,
    voiceId: VoiceId.Koen,
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

  const [agentSettings, setAgentSettings] = useState<ReplyStyle>(defaultReplyStyle)

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

  useEffect(() => {
    async function fetchAllSettings() {
      try {
        const token = localStorage.getItem("jwt")
        // fire both requests in parallel
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

        // update your two bits of state
        setVoiceSettings(dataVoice)
        setAgentSettings(dataReply)

        setAgentSettings(prev => ({
          ...prev,
          personality: dataReply.name,
        }))
      } catch (err: any) {
        setError(err.message || "Error fetching voice or reply-style settings")
      } finally {
        setLoading(false)
      }
    }

    fetchAllSettings()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    const token = localStorage.getItem("jwt")
    try {
      // send both updates in parallel
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
          // your agentSettings is actually a ReplyStyle
          body: JSON.stringify(agentSettings),
        }),
      ])

      if (!voiceRes.ok) throw new Error(`Voice save failed (${voiceRes.status})`)
      if (!replyRes.ok) throw new Error(`Personality save failed (${replyRes.status})`)

      // Optionally re-fetch or show a success toast here
      console.log("Saved OK")
    } catch (err: any) {
      setError(err.message || "Failed to save settings")
    } finally {
      setLoading(false)
    }
  }


  const handleVoicePreview = () => {
    setIsPlaying(!isPlaying)
    // Simulate voice preview
    setTimeout(() => setIsPlaying(false), 3000)
  }

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
          <p className="text-lg font-medium text-gray-700">Loading settings...</p>
        </div>
    )
  }

  if (error) {
    return <div>Error: {error}</div>
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Voice Agent Settings</h2>
          <p className="text-gray-600">Configure your AI voice agent's behavior and characteristics</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving…" : "Save All Changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="voice" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="voice" className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4" />
            <span>Voice</span>
          </TabsTrigger>
          <TabsTrigger value="personality" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Personality</span>
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
                <CardTitle className="flex items-center space-x-2">
                  <Mic className="h-5 w-5" />
                  <span>Voice Selection</span>
                </CardTitle>
                <CardDescription>Choose the voice for your AI agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {voices.map((voice) => (
                    <div
                      key={voice.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        voiceSettings?.voiceId === voice.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setVoiceSettings({ ...voiceSettings, voiceId: voice.id })}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{voice.name}</h4>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVoicePreview()
                          }}
                        >
                          {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
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
                <CardTitle>Voice Parameters</CardTitle>
                <CardDescription>Fine-tune voice characteristics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Speaking Speed</Label>
                  <div className="mt-2">
                    <Slider
                      value={[voiceSettings.talkingSpeed]}
                      onValueChange={(value) => setVoiceSettings({ ...voiceSettings, talkingSpeed: value[0] })}
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
                  <Label htmlFor="greeting">Greeting Message</Label>
                  <Textarea
                      id="greeting"
                      value={voiceSettings.welcomePhrase}
                      onChange={(e) => setVoiceSettings({ ...voiceSettings, welcomePhrase: e.target.value })}
                      rows={3}
                      placeholder="Enter the greeting message"
                  />
                  <p className="text-xs text-gray-500 mt-1">This message will be spoken when the call begins</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="personality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Personality</CardTitle>
              <CardDescription>Define how your AI agent interacts with callers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Personality Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {personalities.map((personality) => (
                    <div
                      key={personality.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        agentSettings.name === personality.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setAgentSettings({ ...agentSettings, name: personality.id })}
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
  )
}
