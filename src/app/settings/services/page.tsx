"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Loader2, Edit, Sparkles, Database, Link as LinkIcon, GripVertical, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { businessConfigApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Service {
  id?: string;
  name: string;
  category: string;
  duration?: number;
  price: number;
  description: string;
  source?: string;
  selected?: boolean;
}

export default function ServicesManagement() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newService, setNewService] = useState<Service>({
    name: "",
    category: "",
    duration: 60,
    price: 0,
    description: ""
  });

  // Service fetching state
  const [fetchUrl, setFetchUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [extractedServices, setExtractedServices] = useState<Service[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [businessCategory, setBusinessCategory] = useState("general");
  const [extractionMode, setExtractionMode] = useState<'simple-query' | 'full-context' | 'batch'>('simple-query');
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; percentage: number } | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadServices();
    }
  }, [user]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const config = await businessConfigApi.get(user!.id);
      setServices(config.services || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await businessConfigApi.update(user!.id, { services });
      setMessage("Services saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error('Error saving services:', error);
      setMessage("Error saving services");
    } finally {
      setSaving(false);
    }
  };

  const addService = () => {
    if (!newService.name || newService.price <= 0) {
      setMessage("Please enter a service name and price");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    const service = {
      ...newService,
      id: Date.now().toString()
    };

    setServices([...services, service]);
    setNewService({
      name: "",
      category: "",
      duration: 60,
      price: 0,
      description: ""
    });
  };

  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const startEdit = (service: Service) => {
    setEditingId(service.id!);
  };

  const updateService = (id: string, field: keyof Service, value: any) => {
    setServices(services.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const finishEdit = () => {
    setEditingId(null);
  };

  // Service fetching functions
  const fetchFromUrl = async () => {
    if (!fetchUrl.trim()) {
      setMessage("Please enter a URL");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      setFetching(true);
      setMessage("Extracting services from URL...");

      const response = await fetch('/api/services/extract-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fetchUrl, businessCategory })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract services');
      }

      setExtractedServices(data.services);
      setShowReviewModal(true);
      setMessage(`Found ${data.count} services!`);
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      setMessage(error.message || "Error extracting services");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setFetching(false);
    }
  };

  const fetchFromKnowledge = async () => {
    try {
      setFetching(true);
      setBatchProgress(null);
      setExtractedServices([]);

      if (extractionMode === 'batch') {
        // Batch mode: iterate through sources one at a time
        setMessage("Starting batch extraction...");
        let allServices: Service[] = [];
        let batchIndex = 0;
        let hasMore = true;

        while (hasMore) {
          const response = await fetch('/api/services/extract-from-knowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessCategory,
              mode: 'batch',
              batchIndex
            })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to extract services');
          }

          // Update progress
          if (data.batchProgress) {
            setBatchProgress(data.batchProgress);
            setMessage(`Extracting ${data.batchProgress.current}/${data.batchProgress.total} (${data.batchProgress.percentage}%)`);
          }

          // Add services from this batch
          if (data.services && data.services.length > 0) {
            allServices = [...allServices, ...data.services];
          }

          hasMore = data.batchProgress?.hasMore || false;
          batchIndex++;

          // Small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        setExtractedServices(allServices);
        setShowReviewModal(true);
        setBatchProgress(null);
        setMessage(`Found ${allServices.length} services from batch extraction!`);
      } else {
        // Simple-query or full-context mode
        const modeText = extractionMode === 'simple-query' ? 'quick' : 'comprehensive';
        setMessage(`Running ${modeText} extraction from knowledge base...`);

        const response = await fetch('/api/services/extract-from-knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessCategory,
            mode: extractionMode
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to extract services');
        }

        setExtractedServices(data.services);
        setShowReviewModal(true);
        setMessage(`Found ${data.count} services from ${data.sourcesAnalyzed} sources!`);
      }

      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      setMessage(error.message || "Error extracting services");
      setBatchProgress(null);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setFetching(false);
    }
  };

  const toggleServiceSelection = (id: string) => {
    setExtractedServices(extractedServices.map(s =>
      s.id === id ? { ...s, selected: !s.selected } : s
    ));
  };

  const toggleAllServices = () => {
    const allSelected = extractedServices.every(s => s.selected);
    setExtractedServices(extractedServices.map(s => ({ ...s, selected: !allSelected })));
  };

  const updateExtractedService = (id: string, field: keyof Service, value: any) => {
    setExtractedServices(extractedServices.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const addSelectedServices = () => {
    const selected = extractedServices.filter(s => s.selected);
    const newServices = selected.map(s => ({
      ...s,
      id: `${Date.now()}-${Math.random()}`,
      selected: undefined // Remove selection flag
    }));

    setServices([...services, ...newServices]);
    setShowReviewModal(false);
    setExtractedServices([]);
    setFetchUrl("");
    setMessage(`Added ${newServices.length} services!`);
    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Services Management</h1>
          <p className="text-gray-400 mt-2">Manage your services and products</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#84CC16] text-black hover:bg-[#65A30D]"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save All Services"}
        </Button>
      </div>

      {message && (
        <Card className={message.includes('Error') ? 'bg-red-500/10 border-red-500' : 'bg-green-500/10 border-green-500'}>
          <CardContent className="pt-6">
            <p className={message.includes('Error') ? 'text-red-400' : 'text-green-400'}>{message}</p>
          </CardContent>
        </Card>
      )}

      {/* Current Services */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Current Services ({services.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No services configured yet. Add your first service below.
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {services.map((service) => (
                  <div key={service.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    {editingId === service.id ? (
                      <div className="space-y-3">
                        <Input
                          value={service.name}
                          onChange={(e) => updateService(service.id!, 'name', e.target.value)}
                          className="bg-gray-900 border-gray-700 text-white"
                          placeholder="Service name"
                        />
                        <Input
                          value={service.category}
                          onChange={(e) => updateService(service.id!, 'category', e.target.value)}
                          className="bg-gray-900 border-gray-700 text-white"
                          placeholder="Category"
                        />
                        <Textarea
                          value={service.description}
                          onChange={(e) => updateService(service.id!, 'description', e.target.value)}
                          className="bg-gray-900 border-gray-700 text-white"
                          placeholder="Description"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            value={service.price}
                            onChange={(e) => updateService(service.id!, 'price', parseFloat(e.target.value))}
                            className="bg-gray-900 border-gray-700 text-white"
                            placeholder="Price"
                          />
                          <Input
                            type="number"
                            value={service.duration || 60}
                            onChange={(e) => updateService(service.id!, 'duration', parseInt(e.target.value))}
                            className="bg-gray-900 border-gray-700 text-white"
                            placeholder="Duration (min)"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={finishEdit}
                            className="bg-[#84CC16] text-black hover:bg-[#65A30D]"
                          >
                            Done
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                            className="border-gray-700 text-gray-300"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-lg">{service.name}</h4>
                          <p className="text-gray-400 text-sm mt-1">{service.category}</p>
                          {service.description && (
                            <p className="text-gray-500 text-sm mt-2">{service.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-3">
                            <Badge className="bg-[#84CC16] text-black">${service.price}</Badge>
                            {service.duration && (
                              <Badge className="bg-gray-700 text-white">{service.duration} min</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
                            onClick={() => startEdit(service)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-red-500"
                            onClick={() => removeService(service.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* AI-Powered Service Fetching */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#84CC16]" />
            <CardTitle className="text-white">AI Service Extraction</CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            Automatically extract services from your website or knowledge base using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fetch from URL */}
          <div className="space-y-3">
            <Label className="text-gray-300">Extract from Website URL</Label>
            <div className="flex gap-2">
              <Input
                value={fetchUrl}
                onChange={(e) => setFetchUrl(e.target.value)}
                placeholder="https://example.com/services or /products"
                className="bg-gray-800 border-gray-700 text-white flex-1"
              />
              <Button
                onClick={fetchFromUrl}
                disabled={fetching || !fetchUrl.trim()}
                className="bg-[#84CC16] text-black hover:bg-[#65A30D]"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                {fetching ? "Extracting..." : "Fetch Services"}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Enter the URL of your services or products page
            </p>
          </div>

          <Separator className="bg-gray-800" />

          {/* Fetch from Knowledge Base */}
          <div className="space-y-3">
            <Label className="text-gray-300">Extract from Knowledge Base</Label>

            {/* Mode Selection */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => setExtractionMode('simple-query')}
                variant={extractionMode === 'simple-query' ? 'default' : 'outline'}
                size="sm"
                disabled={fetching}
                className={extractionMode === 'simple-query'
                  ? 'bg-[#84CC16] text-black hover:bg-[#65A30D]'
                  : 'border-gray-700 text-gray-400 hover:text-white'
                }
              >
                Quick
              </Button>
              <Button
                onClick={() => setExtractionMode('full-context')}
                variant={extractionMode === 'full-context' ? 'default' : 'outline'}
                size="sm"
                disabled={fetching}
                className={extractionMode === 'full-context'
                  ? 'bg-[#84CC16] text-black hover:bg-[#65A30D]'
                  : 'border-gray-700 text-gray-400 hover:text-white'
                }
              >
                Full
              </Button>
              <Button
                onClick={() => setExtractionMode('batch')}
                variant={extractionMode === 'batch' ? 'default' : 'outline'}
                size="sm"
                disabled={fetching}
                className={extractionMode === 'batch'
                  ? 'bg-[#84CC16] text-black hover:bg-[#65A30D]'
                  : 'border-gray-700 text-gray-400 hover:text-white'
                }
              >
                Batch
              </Button>
            </div>

            {/* Mode Description */}
            <p className="text-xs text-gray-500">
              {extractionMode === 'simple-query' && "Quick: Extracts from top 2-3 sources (fast, minimal context)"}
              {extractionMode === 'full-context' && "Full: Processes all sources in batches (comprehensive)"}
              {extractionMode === 'batch' && "Batch: Processes one source at a time with progress tracking"}
            </p>

            {/* Progress Bar for Batch Mode */}
            {batchProgress && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Progress: {batchProgress.current}/{batchProgress.total}</span>
                  <span>{batchProgress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-[#84CC16] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${batchProgress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={fetchFromKnowledge}
              disabled={fetching}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:text-white"
            >
              <Database className="h-4 w-4 mr-2" />
              {fetching ? (batchProgress ? `Extracting ${batchProgress.current}/${batchProgress.total}...` : "Analyzing...") : "Extract from Knowledge Base"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add New Service */}
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Add New Service Manually</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Service Name *</Label>
              <Input
                value={newService.name}
                onChange={(e) => setNewService({...newService, name: e.target.value})}
                placeholder="e.g., Haircut, Pizza Delivery"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Category</Label>
              <Input
                value={newService.category}
                onChange={(e) => setNewService({...newService, category: e.target.value})}
                placeholder="e.g., Hair Services, Main Dishes"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Price *</Label>
              <Input
                type="number"
                value={newService.price}
                onChange={(e) => setNewService({...newService, price: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Duration (minutes)</Label>
              <Input
                type="number"
                value={newService.duration || ''}
                onChange={(e) => setNewService({...newService, duration: parseInt(e.target.value) || undefined})}
                placeholder="60"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Description</Label>
            <Textarea
              value={newService.description}
              onChange={(e) => setNewService({...newService, description: e.target.value})}
              placeholder="Describe this service..."
              className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
            />
          </div>

          <Button
            onClick={addService}
            className="bg-[#84CC16] text-black hover:bg-[#65A30D]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </CardContent>
      </Card>

      {/* Service Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="bg-[#1A1A1A] border-gray-800 text-white max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Review Extracted Services</DialogTitle>
            <DialogDescription className="text-gray-400">
              Review and edit extracted services before adding them. Select which services to keep.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={extractedServices.length > 0 && extractedServices.every(s => s.selected)}
                  onCheckedChange={toggleAllServices}
                  className="border-gray-600"
                />
                <Label className="text-gray-300 font-medium cursor-pointer">
                  Select All ({extractedServices.filter(s => s.selected).length} of {extractedServices.length} selected)
                </Label>
              </div>
              <Button
                onClick={addSelectedServices}
                disabled={!extractedServices.some(s => s.selected)}
                className="bg-[#84CC16] text-black hover:bg-[#65A30D]"
              >
                <Check className="h-4 w-4 mr-2" />
                Add Selected ({extractedServices.filter(s => s.selected).length})
              </Button>
            </div>

            {/* Extracted Services List */}
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {extractedServices.map((service) => (
                  <div
                    key={service.id}
                    className={`p-4 rounded-lg border transition-all ${
                      service.selected
                        ? 'bg-gray-800 border-[#84CC16]'
                        : 'bg-gray-900 border-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <Checkbox
                        checked={service.selected || false}
                        onCheckedChange={() => toggleServiceSelection(service.id!)}
                        className="mt-1 border-gray-600"
                      />

                      {/* Service Details (Editable) */}
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-gray-400">Service Name</Label>
                            <Input
                              value={service.name}
                              onChange={(e) => updateExtractedService(service.id!, 'name', e.target.value)}
                              className="bg-gray-900 border-gray-700 text-white mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-400">Category</Label>
                            <Input
                              value={service.category}
                              onChange={(e) => updateExtractedService(service.id!, 'category', e.target.value)}
                              className="bg-gray-900 border-gray-700 text-white mt-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs text-gray-400">Description</Label>
                          <Textarea
                            value={service.description}
                            onChange={(e) => updateExtractedService(service.id!, 'description', e.target.value)}
                            className="bg-gray-900 border-gray-700 text-white mt-1 min-h-[60px]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-gray-400">Price</Label>
                            <Input
                              type="number"
                              value={service.price}
                              onChange={(e) => updateExtractedService(service.id!, 'price', parseFloat(e.target.value))}
                              className="bg-gray-900 border-gray-700 text-white mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-400">Duration (minutes)</Label>
                            <Input
                              type="number"
                              value={service.duration || ''}
                              onChange={(e) => updateExtractedService(service.id!, 'duration', parseInt(e.target.value) || undefined)}
                              className="bg-gray-900 border-gray-700 text-white mt-1"
                              placeholder="Optional"
                            />
                          </div>
                        </div>

                        {service.source && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <LinkIcon className="h-3 w-3" />
                            Source: {service.source}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {extractedServices.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No services extracted yet
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
