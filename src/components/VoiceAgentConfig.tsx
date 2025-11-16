"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, DollarSign, Zap, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { businessConfigApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  VOICE_MODELS,
  VOICE_NAMES,
  VOICE_PERSONALITIES,
  VOICE_PROVIDERS,
  getModelsForProvider,
  getVoicesForProvider,
  getDefaultModelForProvider,
  getDefaultVoiceForProvider,
  type VoiceProvider
} from "@/lib/voice-agent/constants";

interface VoiceAgentConfigProps {
  businessConfig: any;
  onSave?: () => void;
}

export function VoiceAgentConfig({ businessConfig, onSave }: VoiceAgentConfigProps) {
  const { user } = useAuth();
  const [provider, setProvider] = useState<VoiceProvider>('gemini');
  const [model, setModel] = useState('');
  const [voice, setVoice] = useState('');
  const [personality, setPersonality] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize from business config
  useEffect(() => {
    if (businessConfig) {
      const configProvider = businessConfig.voice_agent_provider || businessConfig.ai_voice_agent_provider || 'gemini';
      setProvider(configProvider);

      const configModel = businessConfig.voice_agent_model || getDefaultModelForProvider(configProvider);
      setModel(configModel);

      const configVoice = businessConfig.voice_agent_voice_name || businessConfig.ai_voice || getDefaultVoiceForProvider(configProvider);
      setVoice(configVoice);

      const configPersonality = businessConfig.voice_agent_personality || 'Friendly - Warm, approachable, conversational';
      setPersonality(configPersonality);
    }
  }, [businessConfig]);

  // When provider changes, update model and voice to defaults for that provider
  useEffect(() => {
    if (provider) {
      setModel(getDefaultModelForProvider(provider));
      setVoice(getDefaultVoiceForProvider(provider));
    }
  }, [provider]);

  const availableModels = getModelsForProvider(provider);
  const availableVoices = getVoicesForProvider(provider);
  const providerInfo = VOICE_PROVIDERS.find(p => p.value === provider);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Use businessConfigApi to update business_config table
      await businessConfigApi.update(user.id, {
        voice_agent_provider: provider,
        voice_agent_model: model,
        voice_agent_voice_name: voice,
        voice_agent_personality: personality,
      });

      toast.success('Voice agent configuration saved!');
      onSave?.();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Voice Agent Configuration
        </CardTitle>
        <CardDescription>
          Configure your AI voice agent for phone bookings and customer service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">AI Provider</Label>
          <RadioGroup value={provider} onValueChange={(value) => setProvider(value as VoiceProvider)}>
            {VOICE_PROVIDERS.map((p) => (
              <div
                key={p.value}
                className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent cursor-pointer"
              >
                <RadioGroupItem value={p.value} id={p.value} />
                <div className="flex-1" onClick={() => setProvider(p.value as VoiceProvider)}>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={p.value} className="cursor-pointer font-medium">
                      {p.label}
                    </Label>
                    {p.recommended && (
                      <Badge variant="default" className="bg-green-600">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Recommended
                      </Badge>
                    )}
                    <Badge variant="outline">
                      <DollarSign className="h-3 w-3" />
                      {p.costPerMinute.toFixed(3)}/min
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {p.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>

          {/* Cost Comparison */}
          {provider === 'gemini' && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3">
              <p className="text-sm text-green-800 dark:text-green-200">
                <Zap className="h-4 w-4 inline mr-1" />
                <strong>Cost Savings:</strong> Using Gemini saves 94.7% compared to OpenAI ($0.016/min vs $0.30/min)
              </p>
            </div>
          )}
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model">Voice Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="model">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  <div className="flex flex-col">
                    <span>{m.label}</span>
                    <span className="text-xs text-muted-foreground">{m.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Model optimized for real-time voice conversations
          </p>
        </div>

        {/* Voice Selection */}
        <div className="space-y-2">
          <Label htmlFor="voice">AI Voice</Label>
          <Select value={voice} onValueChange={setVoice}>
            <SelectTrigger id="voice">
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent>
              {availableVoices.map((v) => (
                <SelectItem key={v.value} value={v.value}>
                  <div className="flex flex-col">
                    <span>{v.label}</span>
                    <span className="text-xs text-muted-foreground">{v.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Voice changes based on selected provider
          </p>
        </div>

        {/* Personality Selection */}
        <div className="space-y-2">
          <Label htmlFor="personality">Voice Personality</Label>
          <Select value={personality} onValueChange={setPersonality}>
            <SelectTrigger id="personality">
              <SelectValue placeholder="Select personality" />
            </SelectTrigger>
            <SelectContent>
              {VOICE_PERSONALITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  <div className="flex flex-col">
                    <span>{p.label}</span>
                    <span className="text-xs text-muted-foreground">{p.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Personality affects how the AI speaks and responds to customers
          </p>
        </div>

        {/* Configuration Summary */}
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <h4 className="font-medium text-sm">Current Configuration:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Provider:</span>{" "}
              <span className="font-medium">{providerInfo?.label}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cost/min:</span>{" "}
              <span className="font-medium">${providerInfo?.costPerMinute.toFixed(3)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Model:</span>{" "}
              <span className="font-medium text-xs">{model.substring(0, 30)}...</span>
            </div>
            <div>
              <span className="text-muted-foreground">Voice:</span>{" "}
              <span className="font-medium">{voice}</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
