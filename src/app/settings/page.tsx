"use client";

import { useState, useEffect } from "react";
import { businessConfigApi, type BusinessConfig as DBBusinessConfig } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { KnowledgeBaseManager } from "@/components/KnowledgeBaseManager";
import { Save, RotateCcw, TestTube, Upload, Download, Plus, Trash2, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";

interface Service {
  id: string;
  name: string;
  category: string;
  duration?: number;
  price: number;
  description: string;
  requiresSlot?: boolean;
  bufferTime?: number;
  availableDays?: string[];
  availableForDelivery?: boolean;
  availableForPickup?: boolean;
  availableForDineIn?: boolean;
  dietaryInfo?: string[];
  preparationTime?: number;
  inStock?: boolean;
  serviceType?: string;
  priceType?: string;
  priorityLevel?: string;
  serviceAreas?: string;
  afterHoursAvailable?: boolean;
  requiredEquipment?: string;
}

interface BusinessConfig {
  businessName: string;
  businessType: string;
  businessCategory: string;
  businessDescription: string;
  phoneNumber: string;
  address: string;
  website: string;
  primaryLanguage: string;
  currency: string;
  timezone: string;
  services: Service[];
  businessHours: Record<string, { open: string; close: string } | null>;
  is247: boolean;
  aiVoice: string;
  aiVoicePersonality: string;
  aiSystemInstructions: string;
  greetingTemplate: string;
  confirmationTemplate: string;
  enableSmallTalk: boolean;
  askForEmail: boolean;
  confirmBeforeBooking: boolean;
  sendInstantConfirmation: boolean;
  maxCallDuration: number;
  voiceDetectionSensitivity: string;
  speechSpeed: string;
  enableCallRecording: boolean;
  backgroundNoiseHandling: string;
}

const businessTypes = [
  // Appointment-Based Services
  { value: "salon", label: "Salon & Spa", category: "appointment-based" },
  { value: "medical", label: "Medical & Dental Clinic", category: "appointment-based" },
  { value: "law", label: "Law Office", category: "appointment-based" },
  { value: "consulting", label: "Consulting Services", category: "appointment-based" },
  { value: "tutoring", label: "Tutoring & Education", category: "appointment-based" },
  { value: "fitness", label: "Fitness & Personal Training", category: "appointment-based" },
  { value: "photography", label: "Photography Studio", category: "appointment-based" },
  { value: "realestate", label: "Real Estate Agency", category: "appointment-based" },
  { value: "veterinary", label: "Veterinary Clinic", category: "appointment-based" },
  
  // Delivery & Pickup Services
  { value: "restaurant", label: "Restaurant & Food Delivery", category: "delivery" },
  { value: "grocery", label: "Grocery Delivery", category: "delivery" },
  { value: "pharmacy", label: "Pharmacy", category: "delivery" },
  { value: "flower", label: "Flower & Gift Shop", category: "delivery" },
  { value: "bakery", label: "Bakery & Pastry", category: "delivery" },
  { value: "coffee", label: "Coffee Shop", category: "delivery" },
  
  // Service Call & On-Demand
  { value: "plumbing", label: "Plumbing Services", category: "service-call" },
  { value: "electrical", label: "Electrical Services", category: "service-call" },
  { value: "hvac", label: "HVAC (Heating/Cooling)", category: "service-call" },
  { value: "cleaning", label: "Home Cleaning", category: "service-call" },
  { value: "landscaping", label: "Landscaping & Gardening", category: "service-call" },
  { value: "petgrooming", label: "Pet Grooming", category: "service-call" },
  { value: "carwash", label: "Mobile Car Wash", category: "service-call" },
  { value: "computer", label: "Computer Repair", category: "service-call" },
  
  { value: "custom", label: "Custom", category: "custom" }
];

const aiVoices = [
  { value: "alloy", label: "Alloy" },
  { value: "echo", label: "Echo" },
  { value: "fable", label: "Fable" },
  { value: "onyx", label: "Onyx" },
  { value: "nova", label: "Nova" },
  { value: "shimmer", label: "Shimmer" }
];

const voicePersonalities = [
  { value: "professional", label: "Professional - Formal, clear, business-focused" },
  { value: "friendly", label: "Friendly - Warm, approachable, conversational" },
  { value: "casual", label: "Casual - Relaxed, informal, easy-going" },
  { value: "formal", label: "Formal - Very polite, structured, traditional" },
  { value: "energetic", label: "Energetic - Upbeat, enthusiastic, positive" }
];

export default function BusinessSettings() {
  const { user } = useAuth();
  const [config, setConfig] = useState<BusinessConfig>({
    businessName: "My Business",
    businessType: "salon",
    businessCategory: "appointment-based",
    businessDescription: "",
    phoneNumber: "",
    address: "",
    website: "",
    primaryLanguage: "en",
    currency: "USD",
    timezone: "UTC",
    services: [],
    businessHours: {
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: { open: "10:00", close: "16:00" },
      sunday: null
    },
    is247: false,
    aiVoice: "alloy",
    aiVoicePersonality: "friendly",
    aiSystemInstructions: "You are a friendly business assistant helping customers book appointments or place orders. Be warm, professional, and efficient. Always verify information before confirming bookings.",
    greetingTemplate: "Hello! You've reached {business_name}. How can I help you today?",
    confirmationTemplate: "Hi {customer_name}! Your {service} appointment at {business_name} is confirmed for {date} at {time}. See you then!",
    enableSmallTalk: true,
    askForEmail: true,
    confirmBeforeBooking: true,
    sendInstantConfirmation: true,
    maxCallDuration: 10,
    voiceDetectionSensitivity: "medium",
    speechSpeed: "normal",
    enableCallRecording: false,
    backgroundNoiseHandling: "balanced"
  });

  const [newService, setNewService] = useState<Partial<Service>>({
    name: "",
    category: "",
    duration: 60,
    price: 0,
    description: "",
    requiresSlot: true,
    bufferTime: 15,
    availableDays: ["mon", "tue", "wed", "thu", "fri"],
    availableForDelivery: true,
    availableForPickup: true,
    availableForDineIn: false,
    dietaryInfo: [],
    preparationTime: 30,
    inStock: true,
    serviceType: "",
    priceType: "fixed",
    priorityLevel: "standard",
    serviceAreas: "",
    afterHoursAvailable: false,
    requiredEquipment: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadConfig();
    }
  }, [user]);

  const loadConfig = async (userId?: string) => {
    try {
      setLoadingData(true);
      const id = userId || user?.id;
      if (!id) return;

      const dbConfig = await businessConfigApi.get(id);

      // Map database config to local config
      setConfig({
        businessName: dbConfig.business_name,
        businessType: dbConfig.business_type,
        businessCategory: dbConfig.business_category,
        businessDescription: dbConfig.business_description || "",
        phoneNumber: dbConfig.phone_number || "",
        address: dbConfig.address || "",
        website: dbConfig.website || "",
        primaryLanguage: dbConfig.primary_language,
        currency: dbConfig.currency,
        timezone: dbConfig.timezone,
        services: dbConfig.services || [],
        businessHours: dbConfig.business_hours || {
          monday: { open: "09:00", close: "18:00" },
          tuesday: { open: "09:00", close: "18:00" },
          wednesday: { open: "09:00", close: "18:00" },
          thursday: { open: "09:00", close: "18:00" },
          friday: { open: "09:00", close: "18:00" },
          saturday: { open: "10:00", close: "16:00" },
          sunday: null
        },
        is247: dbConfig.is_24_7 || false,
        aiVoice: dbConfig.ai_voice,
        aiVoicePersonality: dbConfig.ai_voice_personality,
        aiSystemInstructions: dbConfig.ai_system_instructions,
        greetingTemplate: dbConfig.greeting_template,
        confirmationTemplate: dbConfig.confirmation_template,
        enableSmallTalk: dbConfig.enable_small_talk,
        askForEmail: dbConfig.ask_for_email,
        confirmBeforeBooking: dbConfig.confirm_before_booking,
        sendInstantConfirmation: dbConfig.send_instant_confirmation,
        maxCallDuration: dbConfig.max_call_duration_minutes,
        voiceDetectionSensitivity: dbConfig.voice_detection_sensitivity,
        speechSpeed: dbConfig.speech_speed,
        enableCallRecording: dbConfig.enable_call_recording,
        backgroundNoiseHandling: dbConfig.background_noise_handling
      });
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleBusinessTypeChange = (type: string) => {
    const businessType = businessTypes.find(bt => bt.value === type);
    if (businessType) {
      setConfig(prev => ({
        ...prev,
        businessType: type,
        businessCategory: businessType.category,
        aiSystemInstructions: getDefaultInstructions(type)
      }));
    }
  };

  const getDefaultInstructions = (type: string): string => {
    const instructions: Record<string, string> = {
      salon: "You are a friendly receptionist for [Business Name], a salon. Available Services: [auto-generated list]. Your role: Greet warmly, check calendar availability, present time slots, collect customer information, confirm details. Be warm, professional, and helpful.",
      restaurant: "You are a friendly order-taker for [Business Name], a restaurant. Menu Items: [auto-generated list]. Your role: Take orders item by item, suggest items, ask about delivery/pickup, calculate total, confirm order and timing. Be friendly, patient, and double-check details.",
      medical: "You are a professional medical receptionist for [Business Name]. Services: [auto-generated list]. Your role: Schedule appointments, collect patient information, verify insurance if needed, provide preparation instructions. Be empathetic, professional, and thorough.",
      plumbing: "You are a dispatcher for [Business Name], a plumbing service. Services: [auto-generated list]. Your role: Assess urgency, check service area, schedule appropriate time slot, provide pricing estimates, collect address and issue details. Be professional, efficient, and reassuring."
    };
    return instructions[type] || "You are a helpful business assistant.";
  };

  const addService = () => {
    if (!newService.name || !newService.price) return;
    
    const service: Service = {
      id: Date.now().toString(),
      name: newService.name,
      category: newService.category || "General",
      duration: newService.duration,
      price: newService.price,
      description: newService.description || "",
      requiresSlot: newService.requiresSlot,
      bufferTime: newService.bufferTime,
      availableDays: newService.availableDays,
      availableForDelivery: newService.availableForDelivery,
      availableForPickup: newService.availableForPickup,
      availableForDineIn: newService.availableForDineIn,
      dietaryInfo: newService.dietaryInfo,
      preparationTime: newService.preparationTime,
      inStock: newService.inStock,
      serviceType: newService.serviceType,
      priceType: newService.priceType,
      priorityLevel: newService.priorityLevel,
      serviceAreas: newService.serviceAreas,
      afterHoursAvailable: newService.afterHoursAvailable,
      requiredEquipment: newService.requiredEquipment
    };
    
    setConfig(prev => ({
      ...prev,
      services: [...prev.services, service]
    }));
    
    setNewService({
      name: "",
      category: "",
      duration: 60,
      price: 0,
      description: "",
      requiresSlot: true,
      bufferTime: 15,
      availableDays: ["mon", "tue", "wed", "thu", "fri"],
      availableForDelivery: true,
      availableForPickup: true,
      availableForDineIn: false,
      dietaryInfo: [],
      preparationTime: 30,
      inStock: true,
      serviceType: "",
      priceType: "fixed",
      priorityLevel: "standard",
      serviceAreas: "",
      afterHoursAvailable: false,
      requiredEquipment: ""
    });
  };

  const removeService = (id: string) => {
    setConfig(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== id)
    }));
  };

  const loadTemplate = (type: string) => {
    const templates: Record<string, Service[]> = {
      salon: [
        { id: "1", name: "Haircut", category: "Hair Services", duration: 60, price: 50, description: "Professional haircut and styling", requiresSlot: true, bufferTime: 15, availableDays: ["mon", "tue", "wed", "thu", "fri", "sat"] },
        { id: "2", name: "Hair Coloring", category: "Hair Services", duration: 120, price: 100, description: "Full hair coloring service", requiresSlot: true, bufferTime: 30, availableDays: ["mon", "tue", "wed", "thu", "fri"] },
        { id: "3", name: "Beard Trim", category: "Men's Services", duration: 30, price: 25, description: "Professional beard trimming and shaping", requiresSlot: true, bufferTime: 10, availableDays: ["mon", "tue", "wed", "thu", "fri", "sat"] }
      ],
      restaurant: [
        { id: "1", name: "Margherita Pizza", category: "Main Dishes", price: 12, description: "Classic margherita pizza", availableForDelivery: true, availableForPickup: true, availableForDineIn: true, preparationTime: 30, inStock: true },
        { id: "2", name: "Caesar Salad", category: "Salads", price: 8, description: "Fresh caesar salad with croutons", availableForDelivery: true, availableForPickup: true, availableForDineIn: true, preparationTime: 15, inStock: true },
        { id: "3", name: "Pasta Carbonara", category: "Pasta", price: 14, description: "Classic carbonara with bacon", availableForDelivery: true, availableForPickup: true, availableForDineIn: true, preparationTime: 25, inStock: true }
      ],
      plumbing: [
        { id: "1", name: "Emergency Plumbing", category: "Emergency", price: 150, description: "24/7 emergency plumbing service", serviceType: "Emergency", priceType: "Hourly", priorityLevel: "emergency", afterHoursAvailable: true, requiredEquipment: "Basic tools" },
        { id: "2", name: "Leak Repair", category: "Maintenance", price: 100, description: "Fix leaks and drips", serviceType: "Standard", priceType: "Fixed", priorityLevel: "standard", requiredEquipment: "Plumbing tools" },
        { id: "3", name: "Installation", category: "Installation", price: 120, description: "Install new fixtures", serviceType: "Standard", priceType: "Fixed", priorityLevel: "standard", requiredEquipment: "Installation tools" }
      ]
    };
    
    if (templates[type]) {
      setConfig(prev => ({
        ...prev,
        services: templates[type]
      }));
    }
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Map local config to database config
      await businessConfigApi.update(user.id, {
        business_name: config.businessName,
        business_type: config.businessType,
        business_category: config.businessCategory,
        business_description: config.businessDescription,
        phone_number: config.phoneNumber,
        address: config.address,
        website: config.website,
        primary_language: config.primaryLanguage,
        currency: config.currency,
        timezone: config.timezone,
        services: config.services,
        business_hours: config.businessHours,
        is_24_7: config.is247,
        ai_voice: config.aiVoice,
        ai_voice_personality: config.aiVoicePersonality,
        ai_system_instructions: config.aiSystemInstructions,
        greeting_template: config.greetingTemplate,
        confirmation_template: config.confirmationTemplate,
        enable_small_talk: config.enableSmallTalk,
        ask_for_email: config.askForEmail,
        confirm_before_booking: config.confirmBeforeBooking,
        send_instant_confirmation: config.sendInstantConfirmation,
        max_call_duration_minutes: config.maxCallDuration,
        voice_detection_sensitivity: config.voiceDetectionSensitivity,
        speech_speed: config.speechSpeed,
        enable_call_recording: config.enableCallRecording,
        background_noise_handling: config.backgroundNoiseHandling
      } as any);

      setTestResult("Settings saved successfully!");
      setTimeout(() => setTestResult(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setTestResult("Error saving settings. Please try again.");
      setTimeout(() => setTestResult(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const testAI = async () => {
    setIsLoading(true);
    // Simulate AI test
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    setTestResult("AI test completed successfully! The assistant is working properly.");
    setTimeout(() => setTestResult(null), 5000);
  };

  const updateBusinessHours = (day: string, field: 'open' | 'close' | null, value: string | null) => {
    if (value === null) {
      setConfig(prev => ({
        ...prev,
        businessHours: {
          ...prev.businessHours,
          [day]: null
        }
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        businessHours: {
          ...prev.businessHours,
          [day]: {
            ...prev.businessHours[day],
            [field]: value
          }
        }
      }));
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Business Settings</h1>
          <p className="text-gray-400 mt-2">Configure your AI business assistant</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-gray-700 text-gray-300 hover:text-white"
            onClick={() => setConfig({
              businessName: "My Business",
              businessType: "salon",
              businessCategory: "appointment-based",
              businessDescription: "",
              phoneNumber: "",
              address: "",
              website: "",
              primaryLanguage: "en",
              currency: "USD",
              timezone: "UTC",
              services: [],
              businessHours: {
                monday: { open: "09:00", close: "18:00" },
                tuesday: { open: "09:00", close: "18:00" },
                wednesday: { open: "09:00", close: "18:00" },
                thursday: { open: "09:00", close: "18:00" },
                friday: { open: "09:00", close: "18:00" },
                saturday: { open: "10:00", close: "16:00" },
                sunday: null
              },
              is247: false,
              aiVoice: "alloy",
              aiVoicePersonality: "friendly",
              aiSystemInstructions: "You are a friendly business assistant helping customers book appointments or place orders.",
              greetingTemplate: "Hello! You've reached {business_name}. How can I help you today?",
              confirmationTemplate: "Hi {customer_name}! Your {service} appointment at {business_name} is confirmed for {date} at {time}.",
              enableSmallTalk: true,
              askForEmail: true,
              confirmBeforeBooking: true,
              sendInstantConfirmation: true,
              maxCallDuration: 10,
              voiceDetectionSensitivity: "medium",
              speechSpeed: "normal",
              enableCallRecording: false,
              backgroundNoiseHandling: "balanced"
            })}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            variant="outline"
            className="border-gray-700 text-gray-300 hover:text-white"
            onClick={testAI}
            disabled={isLoading}
          >
            <TestTube className="h-4 w-4 mr-2" />
            Test AI Assistant
          </Button>
          <Button
            className="bg-[#84CC16] text-black hover:bg-[#65A30D]"
            onClick={saveSettings}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Save All Settings"}
          </Button>
        </div>
      </div>

      {testResult && (
        <Card className="bg-[#84CC16]/10 border-[#84CC16]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-[#84CC16]" />
              <p className="text-white">{testResult}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="business-info" className="space-y-6">
        <TabsList className="bg-[#1A1A1A] border-gray-800">
          <TabsTrigger value="business-info" className="data-[state=active]:bg-[#84CC16] data-[state=active]:text-black">Business Information</TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-[#84CC16] data-[state=active]:text-black">Services/Products</TabsTrigger>
          <TabsTrigger value="availability" className="data-[state=active]:bg-[#84CC16] data-[state=active]:text-black">Availability & Scheduling</TabsTrigger>
          <TabsTrigger value="ai-config" className="data-[state=active]:bg-[#84CC16] data-[state=active]:text-black">AI Assistant Configuration</TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-[#84CC16] data-[state=active]:text-black">Integrations & Notifications</TabsTrigger>
        </TabsList>

        {/* Tab 1: Business Information */}
        <TabsContent value="business-info">
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-gray-300">Business Name</Label>
                  <Input
                    id="businessName"
                    value={config.businessName}
                    onChange={(e) => setConfig(prev => ({ ...prev, businessName: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="businessType" className="text-gray-300">Business Type</Label>
                  <Select value={config.businessType} onValueChange={handleBusinessTypeChange}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-gray-700">
                      <SelectItem value="appointment-based" disabled>── Appointment-Based Services ──</SelectItem>
                      {businessTypes.filter(bt => bt.category === "appointment-based").map(bt => (
                        <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                      ))}
                      <SelectItem value="delivery" disabled>── Delivery & Pickup Services ──</SelectItem>
                      {businessTypes.filter(bt => bt.category === "delivery").map(bt => (
                        <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                      ))}
                      <SelectItem value="service-call" disabled>── Service Call & On-Demand ──</SelectItem>
                      {businessTypes.filter(bt => bt.category === "service-call").map(bt => (
                        <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                      ))}
                      <SelectItem value="custom" disabled>── Other ──</SelectItem>
                      {businessTypes.filter(bt => bt.category === "custom").map(bt => (
                        <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-gray-300">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={config.phoneNumber}
                    onChange={(e) => setConfig(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+1 234-567-8900"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-gray-300">Address</Label>
                  <Input
                    id="address"
                    value={config.address}
                    onChange={(e) => setConfig(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, City, State"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-gray-300">Website (Optional)</Label>
                  <Input
                    id="website"
                    value={config.website}
                    onChange={(e) => setConfig(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://example.com"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="primaryLanguage" className="text-gray-300">Primary Language</Label>
                  <Select value={config.primaryLanguage} onValueChange={(value) => setConfig(prev => ({ ...prev, primaryLanguage: value }))}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-gray-700">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-gray-300">Currency</Label>
                  <Select value={config.currency} onValueChange={(value) => setConfig(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-gray-700">
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="LBP">LBP - Lebanese Pound</SelectItem>
                      <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                      <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                      <SelectItem value="QAR">QAR - Qatari Riyal</SelectItem>
                      <SelectItem value="EGP">EGP - Egyptian Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-gray-300">Timezone</Label>
                  <Select value={config.timezone} onValueChange={(value) => setConfig(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-gray-700">
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessDescription" className="text-gray-300">Business Description</Label>
                <Textarea
                  id="businessDescription"
                  value={config.businessDescription}
                  onChange={(e) => setConfig(prev => ({ ...prev, businessDescription: e.target.value }))}
                  placeholder="Describe your business for AI context..."
                  className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Services/Products Configuration */}
        <TabsContent value="services">
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Services/Products Configuration</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:text-white"
                    onClick={() => loadTemplate(config.businessType)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Load Template
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Services */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Current {config.businessCategory === 'delivery' ? 'Products' : 'Services'}</h3>
                <ScrollArea className="h-64 w-full rounded-lg border border-gray-800 p-4">
                  <div className="space-y-4">
                    {config.services.map((service) => (
                      <div key={service.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium">{service.name}</h4>
                            <p className="text-gray-400 text-sm">{service.category}</p>
                            <p className="text-[#84CC16]">${service.price}</p>
                            {service.duration && <p className="text-gray-500 text-sm">{service.duration} minutes</p>}
                            {service.description && <p className="text-gray-400 text-sm mt-2">{service.description}</p>}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-red-500"
                            onClick={() => removeService(service.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {config.services.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No services configured yet</p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <Separator className="bg-gray-800" />

              {/* Add New Service */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Add New {config.businessCategory === 'delivery' ? 'Product' : 'Service'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceName" className="text-gray-300">Name *</Label>
                    <Input
                      id="serviceName"
                      value={newService.name}
                      onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="serviceCategory" className="text-gray-300">Category</Label>
                    <Input
                      id="serviceCategory"
                      value={newService.category}
                      onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Hair Services, Main Dishes"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="servicePrice" className="text-gray-300">Price *</Label>
                    <Input
                      id="servicePrice"
                      type="number"
                      value={newService.price}
                      onChange={(e) => setNewService(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  
                  {config.businessCategory === 'appointment-based' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="serviceDuration" className="text-gray-300">Duration (minutes)</Label>
                        <Select value={newService.duration?.toString()} onValueChange={(value) => setNewService(prev => ({ ...prev, duration: parseInt(value) }))}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1A1A] border-gray-700">
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                            <SelectItem value="90">90 minutes</SelectItem>
                            <SelectItem value="120">120 minutes</SelectItem>
                            <SelectItem value="180">180 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bufferTime" className="text-gray-300">Buffer Time After</Label>
                        <Select value={newService.bufferTime?.toString()} onValueChange={(value) => setNewService(prev => ({ ...prev, bufferTime: parseInt(value) }))}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1A1A] border-gray-700">
                            <SelectItem value="0">No buffer</SelectItem>
                            <SelectItem value="5">5 minutes</SelectItem>
                            <SelectItem value="10">10 minutes</SelectItem>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  
                  {config.businessCategory === 'delivery' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="preparationTime" className="text-gray-300">Preparation Time (minutes)</Label>
                        <Select value={newService.preparationTime?.toString()} onValueChange={(value) => setNewService(prev => ({ ...prev, preparationTime: parseInt(value) }))}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1A1A] border-gray-700">
                            <SelectItem value="10">10 minutes</SelectItem>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="20">20 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                            <SelectItem value="90">90 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  
                  {config.businessCategory === 'service-call' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="serviceType" className="text-gray-300">Service Type</Label>
                        <Input
                          id="serviceType"
                          value={newService.serviceType}
                          onChange={(e) => setNewService(prev => ({ ...prev, serviceType: e.target.value }))}
                          placeholder="e.g., Emergency, Maintenance"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="priceType" className="text-gray-300">Price Type</Label>
                        <Select value={newService.priceType} onValueChange={(value) => setNewService(prev => ({ ...prev, priceType: value }))}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1A1A] border-gray-700">
                            <SelectItem value="fixed">Fixed</SelectItem>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="quote">By Quote</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="priorityLevel" className="text-gray-300">Priority Level</Label>
                        <Select value={newService.priorityLevel} onValueChange={(value) => setNewService(prev => ({ ...prev, priorityLevel: value }))}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1A1A] border-gray-700">
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="serviceDescription" className="text-gray-300">Description</Label>
                  <Textarea
                    id="serviceDescription"
                    value={newService.description}
                    onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the service/product..."
                    className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                  />
                </div>
                
                {config.businessCategory === 'service-call' && (
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="serviceAreas" className="text-gray-300">Service Areas</Label>
                    <Textarea
                      id="serviceAreas"
                      value={newService.serviceAreas}
                      onChange={(e) => setNewService(prev => ({ ...prev, serviceAreas: e.target.value }))}
                      placeholder="Comma-separated list of covered zones/cities"
                      className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                    />
                  </div>
                )}
                
                <div className="flex items-center gap-4 mt-4">
                  {config.businessCategory === 'appointment-based' && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requiresSlot"
                        checked={newService.requiresSlot}
                        onCheckedChange={(checked) => setNewService(prev => ({ ...prev, requiresSlot: checked }))}
                      />
                      <Label htmlFor="requiresSlot" className="text-gray-300">Requires Calendar Slot</Label>
                    </div>
                  )}
                  
                  {config.businessCategory === 'delivery' && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="availableForDelivery"
                          checked={newService.availableForDelivery}
                          onCheckedChange={(checked) => setNewService(prev => ({ ...prev, availableForDelivery: checked }))}
                        />
                        <Label htmlFor="availableForDelivery" className="text-gray-300">Available for Delivery</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="availableForPickup"
                          checked={newService.availableForPickup}
                          onCheckedChange={(checked) => setNewService(prev => ({ ...prev, availableForPickup: checked }))}
                        />
                        <Label htmlFor="availableForPickup" className="text-gray-300">Available for Pickup</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="inStock"
                          checked={newService.inStock}
                          onCheckedChange={(checked) => setNewService(prev => ({ ...prev, inStock: checked }))}
                        />
                        <Label htmlFor="inStock" className="text-gray-300">In Stock</Label>
                      </div>
                    </>
                  )}
                  
                  {config.businessCategory === 'service-call' && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="afterHoursAvailable"
                        checked={newService.afterHoursAvailable}
                        onCheckedChange={(checked) => setNewService(prev => ({ ...prev, afterHoursAvailable: checked }))}
                      />
                      <Label htmlFor="afterHoursAvailable" className="text-gray-300">After Hours Available</Label>
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={addService}
                  className="mt-4 bg-[#84CC16] text-black hover:bg-[#65A30D]"
                  disabled={!newService.name || !newService.price}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {config.businessCategory === 'delivery' ? 'Product' : 'Service'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Availability & Scheduling */}
        <TabsContent value="availability">
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Availability & Scheduling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 24/7 Service Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="is247"
                  checked={config.is247}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is247: checked }))}
                />
                <Label htmlFor="is247" className="text-gray-300">24/7 Service (for delivery/emergency services)</Label>
              </div>
              
              {!config.is247 && (
                <>
                  <Separator className="bg-gray-800" />
                  
                  {/* Business Hours */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Business Hours</h3>
                    <div className="space-y-4">
                      {Object.entries(config.businessHours).map(([day, hours]) => (
                        <div key={day} className="flex items-center gap-4">
                          <div className="w-24">
                            <Label className="text-gray-300 capitalize">{day}</Label>
                          </div>
                          {hours ? (
                            <>
                              <Input
                                type="time"
                                value={hours.open}
                                onChange={(e) => updateBusinessHours(day, 'open', e.target.value)}
                                className="bg-gray-800 border-gray-700 text-white"
                              />
                              <span className="text-gray-400">to</span>
                              <Input
                                type="time"
                                value={hours.close}
                                onChange={(e) => updateBusinessHours(day, 'close', e.target.value)}
                                className="bg-gray-800 border-gray-700 text-white"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-700 text-gray-300 hover:text-white"
                                onClick={() => updateBusinessHours(day, null, null)}
                              >
                                Closed
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="text-gray-500">Closed</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-700 text-gray-300 hover:text-white"
                                onClick={() => updateBusinessHours(day, 'open', '09:00')}
                              >
                                Open
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {config.businessCategory === 'appointment-based' && (
                <>
                  <Separator className="bg-gray-800" />
                  
                  {/* Appointment-based Settings */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Appointment Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bookingBuffer" className="text-gray-300">Booking Buffer Time</Label>
                        <Select defaultValue="15">
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1A1A] border-gray-700">
                            <SelectItem value="0">No buffer</SelectItem>
                            <SelectItem value="5">5 minutes</SelectItem>
                            <SelectItem value="10">10 minutes</SelectItem>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="maxAdvanceBooking" className="text-gray-300">Maximum Advance Booking</Label>
                        <Select defaultValue="30">
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1A1A] border-gray-700">
                            <SelectItem value="7">1 week</SelectItem>
                            <SelectItem value="14">2 weeks</SelectItem>
                            <SelectItem value="30">1 month</SelectItem>
                            <SelectItem value="60">2 months</SelectItem>
                            <SelectItem value="90">3 months</SelectItem>
                            <SelectItem value="180">6 months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {config.businessCategory === 'delivery' && (
                <>
                  <Separator className="bg-gray-800" />
                  
                  {/* Delivery Settings */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Delivery Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="defaultDeliveryTime" className="text-gray-300">Default Delivery Time</Label>
                        <Select defaultValue="30">
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1A1A] border-gray-700">
                            <SelectItem value="20">20 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                            <SelectItem value="90">90 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="minimumOrderAmount" className="text-gray-300">Minimum Order Amount</Label>
                        <Input
                          id="minimumOrderAmount"
                          type="number"
                          placeholder="0.00"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: AI Assistant Configuration */}
        <TabsContent value="ai-config">
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">AI Assistant Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AI Model Selection */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">AI Model Provider</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Provider</Label>
                    <Select defaultValue="openai">
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-gray-700">
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                        <SelectItem value="openrouter">OpenRouter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Model</Label>
                    <Select defaultValue="gpt-4o-realtime">
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-gray-700">
                        <SelectItem value="gpt-4o-realtime">GPT-4o Realtime</SelectItem>
                        <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Coming Soon)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  Note: Currently only OpenAI Realtime API is supported. Gemini and OpenRouter support coming soon.
                </p>
              </div>

              <Separator className="bg-gray-800" />

              {/* Voice & Personality */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Voice & Personality</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aiVoice" className="text-gray-300">AI Voice</Label>
                    <Select value={config.aiVoice} onValueChange={(value) => setConfig(prev => ({ ...prev, aiVoice: value }))}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-gray-700">
                        {aiVoices.map(voice => (
                          <SelectItem key={voice.value} value={voice.value}>{voice.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="aiVoicePersonality" className="text-gray-300">Voice Personality</Label>
                    <Select value={config.aiVoicePersonality} onValueChange={(value) => setConfig(prev => ({ ...prev, aiVoicePersonality: value }))}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-gray-700">
                        {voicePersonalities.map(personality => (
                          <SelectItem key={personality.value} value={personality.value}>{personality.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <Separator className="bg-gray-800" />
              
              {/* Custom Instructions */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Custom Instructions</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="aiSystemInstructions" className="text-gray-300">AI System Instructions</Label>
                    <Textarea
                      id="aiSystemInstructions"
                      value={config.aiSystemInstructions}
                      onChange={(e) => setConfig(prev => ({ ...prev, aiSystemInstructions: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white min-h-[200px]"
                    />
                    <p className="text-gray-500 text-sm">Character count: {config.aiSystemInstructions.length}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="greetingTemplate" className="text-gray-300">Greeting Message</Label>
                    <Input
                      id="greetingTemplate"
                      value={config.greetingTemplate}
                      onChange={(e) => setConfig(prev => ({ ...prev, greetingTemplate: e.target.value }))}
                      placeholder="Hello! How can I help you today?"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmationTemplate" className="text-gray-300">Confirmation Message Template</Label>
                    <Textarea
                      id="confirmationTemplate"
                      value={config.confirmationTemplate}
                      onChange={(e) => setConfig(prev => ({ ...prev, confirmationTemplate: e.target.value }))}
                      placeholder="Your booking is confirmed for {date} at {time}."
                      className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                    />
                    <p className="text-gray-500 text-sm">Available variables: {'{customer_name}'}, {'{service}'}, {'{date}'}, {'{time}'}, {'{address}'}, {'{total}'}, {'{delivery_time}'}</p>
                  </div>
                </div>
              </div>
              
              <Separator className="bg-gray-800" />
              
              {/* Conversation Flow */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Conversation Flow</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableSmallTalk"
                      checked={config.enableSmallTalk}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableSmallTalk: checked }))}
                    />
                    <Label htmlFor="enableSmallTalk" className="text-gray-300">Enable Small Talk</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="askForEmail"
                      checked={config.askForEmail}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, askForEmail: checked }))}
                    />
                    <Label htmlFor="askForEmail" className="text-gray-300">Ask for Email Address</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="confirmBeforeBooking"
                      checked={config.confirmBeforeBooking}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, confirmBeforeBooking: checked }))}
                    />
                    <Label htmlFor="confirmBeforeBooking" className="text-gray-300">Confirm Details Before Booking</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sendInstantConfirmation"
                      checked={config.sendInstantConfirmation}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, sendInstantConfirmation: checked }))}
                    />
                    <Label htmlFor="sendInstantConfirmation" className="text-gray-300">Send Instant Confirmation</Label>
                  </div>
                </div>
              </div>
              
              <Separator className="bg-gray-800" />
              
              {/* Advanced Settings */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Advanced Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxCallDuration" className="text-gray-300">Maximum Call Duration</Label>
                    <Select value={config.maxCallDuration.toString()} onValueChange={(value) => setConfig(prev => ({ ...prev, maxCallDuration: parseInt(value) }))}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-gray-700">
                        <SelectItem value="3">3 minutes</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="voiceDetectionSensitivity" className="text-gray-300">Voice Detection Sensitivity</Label>
                    <Select value={config.voiceDetectionSensitivity} onValueChange={(value) => setConfig(prev => ({ ...prev, voiceDetectionSensitivity: value }))}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-gray-700">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="speechSpeed" className="text-gray-300">Speech Speed</Label>
                    <Select value={config.speechSpeed} onValueChange={(value) => setConfig(prev => ({ ...prev, speechSpeed: value }))}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-gray-700">
                        <SelectItem value="slow">Slow</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="fast">Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="backgroundNoiseHandling" className="text-gray-300">Background Noise Handling</Label>
                    <Select value={config.backgroundNoiseHandling} onValueChange={(value) => setConfig(prev => ({ ...prev, backgroundNoiseHandling: value }))}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-gray-700">
                        <SelectItem value="sensitive">Sensitive</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="tolerant">Tolerant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-4">
                  <Switch
                    id="enableCallRecording"
                    checked={config.enableCallRecording}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableCallRecording: checked }))}
                  />
                  <Label htmlFor="enableCallRecording" className="text-gray-300">Enable Call Recording</Label>
                </div>
              </div>

              <Separator className="bg-gray-800" />

              {/* Knowledge Base */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Knowledge Base</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Add websites and documents to provide context to your AI assistant. The AI will use this information to answer questions accurately.
                </p>
                {user?.id && <KnowledgeBaseManager userId={user.id} />}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Integrations & Notifications */}
        <TabsContent value="integrations">
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Integrations & Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Calendar Integration */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Google Calendar Integration</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div>
                      <p className="text-white font-medium">Google Calendar</p>
                      <p className="text-gray-400 text-sm">Sync bookings with your Google Calendar</p>
                    </div>
                    <Badge variant="secondary" className="bg-red-600 text-white">Not Connected</Badge>
                  </div>
                  
                  <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
                    Connect Calendar
                  </Button>
                </div>
              </div>
              
              <Separator className="bg-gray-800" />
              
              {/* Customer Notifications */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Customer Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="customerEmail" defaultChecked />
                    <Label htmlFor="customerEmail" className="text-gray-300">Send Email Confirmations</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="customerSMS" defaultChecked />
                    <Label htmlFor="customerSMS" className="text-gray-300">Send SMS Confirmations</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="sendReminders" />
                    <Label htmlFor="sendReminders" className="text-gray-300">Send Reminder Notifications</Label>
                  </div>
                </div>
              </div>
              
              <Separator className="bg-gray-800" />
              
              {/* Owner/Business Notifications */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Owner/Business Notifications</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerEmail" className="text-gray-300">Owner Email</Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      placeholder="owner@example.com"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ownerPhone" className="text-gray-300">Owner Phone Number</Label>
                    <Input
                      id="ownerPhone"
                      placeholder="+1 234-567-8900"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-300">Notification Triggers</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch id="newBooking" defaultChecked />
                        <Label htmlFor="newBooking" className="text-gray-300">New booking received</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch id="cancellation" defaultChecked />
                        <Label htmlFor="cancellation" className="text-gray-300">Booking cancelled</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch id="emergency" />
                        <Label htmlFor="emergency" className="text-gray-300">Emergency service requested</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator className="bg-gray-800" />
              
              {/* Payment Integration */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Payment Integration</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Payment Methods Accepted</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch id="cash" defaultChecked />
                        <Label htmlFor="cash" className="text-gray-300">Cash on Delivery/Service</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch id="card" />
                        <Label htmlFor="card" className="text-gray-300">Credit/Debit Card</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch id="online" />
                        <Label htmlFor="online" className="text-gray-300">Online Payment</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Stripe Integration</p>
                        <p className="text-gray-400 text-sm">Accept online payments</p>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-600 text-white">Coming Soon</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}