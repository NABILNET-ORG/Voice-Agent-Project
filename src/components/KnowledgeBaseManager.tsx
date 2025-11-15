"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Globe, FileText, Loader2, Eye, Download, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { knowledgeApi, type KnowledgeSource } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface Props {
  userId: string;
}

export function KnowledgeBaseManager({ userId }: Props) {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchDialogOpen, setFetchDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [resummaryProgress, setResummaryProgress] = useState<{current: number, total: number, title: string} | null>(null);

  // Add website form
  const [newUrl, setNewUrl] = useState('');
  const [fetchMethod, setFetchMethod] = useState<'smart_crawl' | 'single_page'>('smart_crawl');
  const [maxDepth, setMaxDepth] = useState(2);
  const [maxPages, setMaxPages] = useState(20);

  // Preview data
  const [fetchedPages, setFetchedPages] = useState<any[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadSources();
  }, [userId]);

  const loadSources = async () => {
    try {
      setLoading(true);
      const data = await knowledgeApi.getAll(userId);
      setSources(data);
    } catch (error) {
      console.error('Error loading sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchWebsite = async () => {
    if (!newUrl) return;

    try {
      setFetching(true);
      const result = await knowledgeApi.fetchWebsite(newUrl, fetchMethod, {
        maxDepth,
        maxPages
      });

      setFetchedPages(result.pages);
      setSelectedPages(new Set(result.pages.map((_: any, i: number) => i)));
      setFetchDialogOpen(false);
      setPreviewDialogOpen(true);
    } catch (error: any) {
      alert(`Failed to fetch website: ${error.message}`);
    } finally {
      setFetching(false);
    }
  };

  const handleSummarize = async (pageIndex: number) => {
    try {
      setSummarizing(true);
      const page = fetchedPages[pageIndex];
      const result = await knowledgeApi.summarize(page.content);

      setFetchedPages(prev => prev.map((p, i) =>
        i === pageIndex ? { ...p, summary: result.summary, summaryTokens: result.summaryTokens } : p
      ));
    } catch (error: any) {
      alert(`Failed to summarize: ${error.message}`);
    } finally {
      setSummarizing(false);
    }
  };

  const handleSaveToKnowledgeBase = async () => {
    try {
      const selectedPagesData = fetchedPages.filter((_, i) => selectedPages.has(i));

      for (const page of selectedPagesData) {
        await knowledgeApi.create({
          user_id: userId,
          source_type: 'website',
          url: page.url,
          title: page.title,
          content: page.content,
          summary: page.summary || null,
          metadata: {
            word_count: page.wordCount,
            fetch_date: new Date().toISOString(),
            original_url: newUrl
          },
          priority: 3,
          is_active: true,
          last_fetched_at: new Date().toISOString()
        });
      }

      setPreviewDialogOpen(false);
      setFetchedPages([]);
      setNewUrl('');
      await loadSources();
    } catch (error: any) {
      alert(`Failed to save: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this knowledge source?')) return;

    try {
      await knowledgeApi.delete(id);
      await loadSources();
    } catch (error: any) {
      alert(`Failed to delete: ${error.message}`);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await knowledgeApi.update(id, { is_active: isActive });
      await loadSources();
    } catch (error: any) {
      alert(`Failed to update: ${error.message}`);
    }
  };

  const totalTokens = sources
    .filter(s => s.is_active)
    .reduce((sum, s) => {
      const content = s.summary || s.content || '';
      return sum + Math.ceil(content.split(/\s+/).length / 0.75);
    }, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-white">{sources.length}</div>
            <p className="text-sm text-gray-400">Total Sources</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-white">{sources.filter(s => s.is_active).length}</div>
            <p className="text-sm text-gray-400">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-white">{totalTokens.toLocaleString()}</div>
            <p className="text-sm text-gray-400">Est. Tokens</p>
          </CardContent>
        </Card>
      </div>

      {/* Re-summary Progress Banner */}
      {resummaryProgress && (
        <Card className="bg-blue-500/10 border-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              <div className="flex-1">
                <p className="text-blue-400 font-medium">
                  Re-summarizing: {resummaryProgress.title}
                </p>
                <p className="text-blue-300 text-sm">
                  Progress: {resummaryProgress.current} of {resummaryProgress.total} ({Math.round(resummaryProgress.current / resummaryProgress.total * 100)}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sources List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Knowledge Sources</CardTitle>
            <div className="flex gap-2">
              {sources.length > 0 && (
                <Button
                  onClick={async () => {
                    const sourcesToProcess = sources.filter(s => s.content);
                    setResummaryProgress({ current: 0, total: sourcesToProcess.length, title: 'Starting...' });

                    for (let i = 0; i < sourcesToProcess.length; i++) {
                      const source = sourcesToProcess[i];
                      setResummaryProgress({ current: i + 1, total: sourcesToProcess.length, title: source.title });

                      try {
                        const result = await knowledgeApi.summarize(source.content!);
                        await supabase
                          .from('knowledge_sources')
                          .update({ summary: result.summary })
                          .eq('id', source.id);
                      } catch (err) {
                        console.error(`Failed to re-summarize ${source.title}:`, err);
                      }
                    }

                    setResummaryProgress(null);
                    loadSources();
                  }}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                  disabled={resummaryProgress !== null}
                >
                  {resummaryProgress ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {resummaryProgress.current}/{resummaryProgress.total}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Re-summarize All
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={() => setFetchDialogOpen(true)}
                className="bg-[#84CC16] text-black hover:bg-[#65A30D]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Website
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : sources.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No knowledge sources yet. Add a website to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map(source => (
                <div key={source.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-[#84CC16]" />
                        <h4 className="text-white font-medium">{source.title}</h4>
                        <Badge className="bg-gray-700 text-white">Priority {source.priority}</Badge>
                        {source.summary && <Badge className="bg-blue-600">Summarized</Badge>}
                      </div>
                      {source.url && (
                        <p className="text-gray-400 text-sm mt-1">{source.url}</p>
                      )}
                      <p className="text-gray-500 text-sm mt-2">
                        {source.metadata?.word_count || 0} words ·
                        {source.summary ? ` ${Math.ceil((source.summary.split(/\s+/).length || 0) / 0.75)}` : ` ${Math.ceil(((source.content?.split(/\s+/).length || 0) / 0.75))}`} tokens
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={source.is_active}
                        onCheckedChange={(checked) => handleToggleActive(source.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-[#84CC16]"
                        onClick={async () => {
                          if (source.content) {
                            const result = await knowledgeApi.summarize(source.content);
                            // Update the source with new summary
                            await supabase
                              .from('knowledge_sources')
                              .update({ summary: result.summary })
                              .eq('id', source.id);
                            loadSources();
                          }
                        }}
                        title="Re-summarize content"
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => handleDelete(source.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Website Dialog */}
      <Dialog open={fetchDialogOpen} onOpenChange={setFetchDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Website Knowledge Source</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label>Fetch Method</Label>
              <Select value={fetchMethod} onValueChange={(v: any) => setFetchMethod(v)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-gray-700">
                  <SelectItem value="smart_crawl">Smart Full Website Crawl</SelectItem>
                  <SelectItem value="single_page">Single Page Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {fetchMethod === 'smart_crawl' && (
              <>
                <div className="space-y-2">
                  <Label>Max Depth (levels): {maxDepth}</Label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Pages: {maxPages}</Label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={maxPages}
                    onChange={(e) => setMaxPages(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </>
            )}

            <Button
              onClick={handleFetchWebsite}
              disabled={fetching || !newUrl}
              className="w-full bg-[#84CC16] text-black hover:bg-[#65A30D]"
            >
              {fetching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Fetch & Preview
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-gray-800 text-white max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Preview Fetched Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-400">
                {fetchedPages.length} pages found · {fetchedPages.reduce((sum, p) => sum + p.wordCount, 0)} words
              </p>
              <Button
                onClick={handleSaveToKnowledgeBase}
                className="bg-[#84CC16] text-black hover:bg-[#65A30D]"
              >
                <Download className="h-4 w-4 mr-2" />
                Save Selected ({selectedPages.size})
              </Button>
            </div>

            <ScrollArea className="h-[60vh]">
              <div className="space-y-3">
                {fetchedPages.map((page, index) => (
                  <Card key={index} className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedPages.has(index)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedPages);
                              if (e.target.checked) {
                                newSelected.add(index);
                              } else {
                                newSelected.delete(index);
                              }
                              setSelectedPages(newSelected);
                            }}
                            className="h-4 w-4"
                          />
                          <h4 className="text-white font-medium">{page.title}</h4>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSummarize(index)}
                          disabled={summarizing || !!page.summary}
                          className="border-gray-700 text-gray-300"
                        >
                          {page.summary ? '✓ Summarized' : 'Summarize'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-400 text-sm mb-2">{page.url}</p>
                      <p className="text-gray-500 text-sm">
                        {page.wordCount} words · ~{Math.ceil(page.wordCount / 0.75)} tokens
                        {page.summaryTokens && ` → ${page.summaryTokens} tokens (${Math.round((1 - page.summaryTokens / Math.ceil(page.wordCount / 0.75)) * 100)}% reduction)`}
                      </p>
                      <details className="mt-2">
                        <summary className="text-[#84CC16] cursor-pointer text-sm">Preview content</summary>
                        <pre className="text-gray-400 text-xs mt-2 whitespace-pre-wrap max-h-40 overflow-auto">
                          {(page.summary || page.content).substring(0, 500)}...
                        </pre>
                      </details>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
