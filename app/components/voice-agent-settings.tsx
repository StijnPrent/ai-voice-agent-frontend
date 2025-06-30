"use client"

import { useState } from "react"
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

export function VoiceAgentSettings() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [voiceSettings, setVoiceSettings] = useState({
    voice: "sarah",
    speed: [1.0],
    pitch: [1.0],
    volume: [0.8],
    language: "en-US",
  })

  const [agentSettings, setAgentSettings] = useState({
    name: "Sarah",
    personality: "professional",
    greeting: "Hello! I'm Sarah, your AI assistant. How can I help you today?",
    maxCallDuration: 30,
    enableRecording: true,
    enableTranscription: true,
    enableSentimentAnalysis: true,
  })

  const voices = [
    { id: "sarah", name: "Sarah", description: "Professional female voice", accent: "American" },
    { id: "james", name: "James", description: "Confident male voice", accent: "British" },
    { id: "maria", name: "Maria", description: "Warm female voice", accent: "Spanish" },
    { id: "alex", name: "Alex", description: "Neutral voice", accent: "Canadian" },
  ]

  const personalities = [
    { id: "professional", name: "Professional", description: "Formal and business-focused" },
    { id: "friendly", name: "Friendly", description: "Warm and approachable" },
    { id: "casual", name: "Casual", description: "Relaxed and conversational" },
    { id: "enthusiastic", name: "Enthusiastic", description: "Energetic and positive" },
  ]

  const handleVoicePreview = () => {
    setIsPlaying(!isPlaying)
    // Simulate voice preview
    setTimeout(() => setIsPlaying(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Voice Agent Settings</h2>
          <p className="text-gray-600">Configure your AI voice agent's behavior and characteristics</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Play className="h-4 w-4 mr-2" />
            Test Agent
          </Button>
          <Button>Save All Changes</Button>
        </div>
      </div>

      <Tabs defaultValue="voice" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="voice" className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4" />
            <span>Voice</span>
          </TabsTrigger>
          <TabsTrigger value="personality" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Personality</span>
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Behavior</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Advanced</span>
          </TabsTrigger>
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
                        voiceSettings.voice === voice.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setVoiceSettings({ ...voiceSettings, voice: voice.id })}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{voice.name}</h4>
                          <p className="text-sm text-gray-600">{voice.description}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {voice.accent}
                          </Badge>
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
                      value={voiceSettings.speed}
                      onValueChange={(value) => setVoiceSettings({ ...voiceSettings, speed: value })}
                      max={2}
                      min={0.5}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Slow</span>
                      <span>{voiceSettings.speed[0]}x</span>
                      <span>Fast</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Pitch</Label>
                  <div className="mt-2">
                    <Slider
                      value={voiceSettings.pitch}
                      onValueChange={(value) => setVoiceSettings({ ...voiceSettings, pitch: value })}
                      max={2}
                      min={0.5}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Low</span>
                      <span>{voiceSettings.pitch[0]}x</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Volume</Label>
                  <div className="mt-2">
                    <Slider
                      value={voiceSettings.volume}
                      onValueChange={(value) => setVoiceSettings({ ...voiceSettings, volume: value })}
                      max={1}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Quiet</span>
                      <span>{Math.round(voiceSettings.volume[0] * 100)}%</span>
                      <span>Loud</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={voiceSettings.language}
                    onValueChange={(value) => setVoiceSettings({ ...voiceSettings, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="en-GB">English (UK)</SelectItem>
                      <SelectItem value="es-ES">Spanish</SelectItem>
                      <SelectItem value="fr-FR">French</SelectItem>
                      <SelectItem value="de-DE">German</SelectItem>
                    </SelectContent>
                  </Select>
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
                <Label htmlFor="agent-name">Agent Name</Label>
                <Input
                  id="agent-name"
                  value={agentSettings.name}
                  onChange={(e) => setAgentSettings({ ...agentSettings, name: e.target.value })}
                  placeholder="Enter agent name"
                />
              </div>

              <div>
                <Label>Personality Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {personalities.map((personality) => (
                    <div
                      key={personality.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        agentSettings.personality === personality.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setAgentSettings({ ...agentSettings, personality: personality.id })}
                    >
                      <h4 className="font-medium">{personality.name}</h4>
                      <p className="text-sm text-gray-600">{personality.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="greeting">Greeting Message</Label>
                <Textarea
                  id="greeting"
                  value={agentSettings.greeting}
                  onChange={(e) => setAgentSettings({ ...agentSettings, greeting: e.target.value })}
                  rows={3}
                  placeholder="Enter the greeting message"
                />
                <p className="text-xs text-gray-500 mt-1">This message will be spoken when the call begins</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Call Behavior</CardTitle>
              <CardDescription>Configure how your agent handles calls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="max-duration">Maximum Call Duration (minutes)</Label>
                <Input
                  id="max-duration"
                  type="number"
                  value={agentSettings.maxCallDuration}
                  onChange={(e) =>
                    setAgentSettings({ ...agentSettings, maxCallDuration: Number.parseInt(e.target.value) })
                  }
                  min="1"
                  max="120"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Call Recording</Label>
                    <p className="text-sm text-gray-500">Record all calls for quality assurance</p>
                  </div>
                  <Switch
                    checked={agentSettings.enableRecording}
                    onCheckedChange={(checked) => setAgentSettings({ ...agentSettings, enableRecording: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Live Transcription</Label>
                    <p className="text-sm text-gray-500">Generate real-time transcripts</p>
                  </div>
                  <Switch
                    checked={agentSettings.enableTranscription}
                    onCheckedChange={(checked) => setAgentSettings({ ...agentSettings, enableTranscription: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sentiment Analysis</Label>
                    <p className="text-sm text-gray-500">Analyze caller emotions and tone</p>
                  </div>
                  <Switch
                    checked={agentSettings.enableSentimentAnalysis}
                    onCheckedChange={(checked) =>
                      setAgentSettings({ ...agentSettings, enableSentimentAnalysis: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Configure advanced AI and technical parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="ai-model">AI Model</Label>
                <Select defaultValue="gpt-4">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4 (Recommended)</SelectItem>
                    <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="claude">Claude 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="response-timeout">Response Timeout (seconds)</Label>
                <Input id="response-timeout" type="number" defaultValue="5" min="1" max="30" />
              </div>

              <div>
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input id="webhook-url" placeholder="https://your-app.com/webhook" />
                <p className="text-xs text-gray-500 mt-1">Receive real-time call events and data</p>
              </div>

              <div>
                <Label htmlFor="custom-instructions">Custom Instructions</Label>
                <Textarea
                  id="custom-instructions"
                  placeholder="Add specific instructions for your AI agent..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
