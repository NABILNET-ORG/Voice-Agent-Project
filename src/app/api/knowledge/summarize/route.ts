import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { content, maxTokens = 500, provider = 'openai' } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    console.log('Summarizing content:', {
      contentLength: content.length,
      maxTokens,
      provider
    });

    // Get Supabase client to fetch API key from business_config
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Fetch AI configuration from business_config
    const { data: config, error: configError } = await supabase
      .from('business_config')
      .select('ai_summarization_provider, ai_model_name, openai_api_key, gemini_api_key, openrouter_api_key')
      .single();

    if (configError || !config) {
      console.error('Failed to fetch business config:', configError);
      return NextResponse.json(
        { error: 'Failed to fetch configuration' },
        { status: 500 }
      );
    }

    // Determine which provider to use for summarization
    const summarizationProvider = config.ai_summarization_provider || 'openai';

    // Get the appropriate API key and model based on provider
    let apiKey: string | null = null;
    let modelToUse = 'gpt-4o-mini';

    if (summarizationProvider === 'openai') {
      apiKey = config.openai_api_key || process.env.OPENAI_API_KEY;
      modelToUse = config.ai_model_name || 'gpt-4o-mini';
    } else if (summarizationProvider === 'gemini') {
      apiKey = config.gemini_api_key;
      modelToUse = config.ai_model_name || 'gemini-2.5-flash';
    } else if (summarizationProvider === 'openrouter') {
      apiKey = config.openrouter_api_key;
      modelToUse = config.ai_model_name || 'auto';
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: `${summarizationProvider.toUpperCase()} API key not configured. Please add it in Settings → Integrations → AI Models.` },
        { status: 500 }
      );
    }

    console.log('Using AI provider for summarization:', summarizationProvider, 'Model:', modelToUse);

    // Prepare API request based on provider
    let apiUrl = '';
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    let requestBody: any = {};

    if (summarizationProvider === 'openai') {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      requestBody = {
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that summarizes website content for use in AI voice agent context. Create a concise summary that captures key information about services, pricing, policies, and important details. Keep it under ${maxTokens} tokens.`
          },
          {
            role: 'user',
            content: `Summarize this website content:\n\n${content.substring(0, 50000)}`
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.3
      };
    } else if (summarizationProvider === 'gemini') {
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent`;
      headers['x-goog-api-key'] = apiKey;
      requestBody = {
        contents: [{
          parts: [{
            text: `You are a helpful assistant that summarizes website content. Create a concise summary that captures key information about services, pricing, policies, and important details.\n\nSummarize this website content:\n\n${content.substring(0, 50000)}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.3
        }
      };
    } else if (summarizationProvider === 'openrouter') {
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      requestBody = {
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that summarizes website content for use in AI voice agent context. Create a concise summary that captures key information about services, pricing, policies, and important details. Keep it under ${maxTokens} tokens.`
          },
          {
            role: 'user',
            content: `Summarize this website content:\n\n${content.substring(0, 50000)}`
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.3
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`${summarizationProvider.toUpperCase()} API error:`, error);
      throw new Error(`Failed to summarize content using ${summarizationProvider}`);
    }

    const data = await response.json();

    console.log('API Response:', JSON.stringify(data).substring(0, 500));

    // Extract summary based on provider response format
    let summary = '';
    if (summarizationProvider === 'openai' || summarizationProvider === 'openrouter') {
      summary = data.choices?.[0]?.message?.content || '';
    } else if (summarizationProvider === 'gemini') {
      // Gemini response format: data.candidates[0].content.parts[0].text
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];

        // Check finish reason
        if (candidate.finishReason === 'MAX_TOKENS') {
          console.warn('Gemini hit MAX_TOKENS limit, increasing maxOutputTokens');
          // Try again with higher token limit if MAX_TOKENS
        }

        // Try to extract from parts
        if (candidate.content) {
          if (candidate.content.parts && candidate.content.parts.length > 0) {
            summary = candidate.content.parts[0].text;
          } else if (candidate.content.text) {
            // Alternative format
            summary = candidate.content.text;
          } else if (candidate.text) {
            // Another alternative
            summary = candidate.text;
          }
        }
      }
    }

    if (!summary) {
      console.error('Failed to extract summary from response:', data);
      console.error('Full response structure:', JSON.stringify(data, null, 2));
      throw new Error(`No summary content in ${summarizationProvider.toUpperCase()} API response. Check if maxTokens (${maxTokens}) is too low or response format changed.`);
    }

    const originalTokens = Math.ceil(content.split(/\s+/).length / 0.75);
    const summaryTokens = Math.ceil(summary.split(/\s+/).length / 0.75);

    console.log('Summarization complete:', {
      originalTokens,
      summaryTokens,
      reduction: `${Math.round((1 - summaryTokens / originalTokens) * 100)}%`
    });

    return NextResponse.json({
      summary,
      originalTokens,
      summaryTokens,
      compressionRatio: summaryTokens / originalTokens
    });

  } catch (error: any) {
    console.error('Summarize error:', error);
    return NextResponse.json(
      { error: 'Failed to summarize', details: error.message },
      { status: 500 }
    );
  }
}
