import { NextResponse } from "next/server";

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

    // Use OpenAI for summarization
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to summarize content');
    }

    const data = await response.json();
    const summary = data.choices[0].message.content;

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
