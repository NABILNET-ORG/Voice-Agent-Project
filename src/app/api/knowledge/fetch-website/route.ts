import { NextResponse } from "next/server";
import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import { JSDOM } from 'jsdom';

interface FetchOptions {
  maxDepth?: number;
  maxPages?: number;
  priorityKeywords?: string[];
}

export async function POST(request: Request) {
  try {
    const { url, method = 'smart_crawl', options = {} } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const {
      maxDepth = 2,
      maxPages = 100,
      priorityKeywords = ['service', 'pricing', 'price', 'menu', 'about', 'contact', 'product']
    }: FetchOptions = options;

    console.log('Fetching website:', { url, method, maxDepth, maxPages });

    if (method === 'single_page') {
      const page = await fetchAndCleanPage(url);
      return NextResponse.json({
        pages: [page],
        totalWords: page.wordCount,
        estimatedTokens: Math.ceil(page.wordCount / 0.75)
      });
    }

    // Smart crawl
    const pages = await smartCrawl(url, maxDepth, maxPages, priorityKeywords);

    const totalWords = pages.reduce((sum, p) => sum + p.wordCount, 0);
    const estimatedTokens = Math.ceil(totalWords / 0.75);

    return NextResponse.json({
      pages,
      totalWords,
      estimatedTokens
    });

  } catch (error: any) {
    console.error('Fetch website error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch website', details: error.message },
      { status: 500 }
    );
  }
}

async function fetchAndCleanPage(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Booking-Agent/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Parse with JSDOM for Readability
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('Could not extract main content');
    }

    // Convert HTML to Markdown
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });

    const markdown = turndownService.turndown(article.content);

    const wordCount = markdown.split(/\s+/).length;

    return {
      url,
      title: article.title || new URL(url).hostname,
      content: markdown,
      wordCount,
      excerpt: article.excerpt || markdown.substring(0, 200),
      selected: true
    };
  } catch (error: any) {
    console.error(`Failed to fetch ${url}:`, error.message);
    return {
      url,
      title: 'Error',
      content: `Failed to fetch: ${error.message}`,
      wordCount: 0,
      excerpt: '',
      selected: false,
      error: error.message
    };
  }
}

// Normalize URL to prevent duplicates
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slash, convert to lowercase, remove www
    let normalized = parsed.href.toLowerCase();
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    // Remove fragment
    normalized = normalized.split('#')[0];
    // Remove common query params that don't change content
    const urlObj = new URL(normalized);
    urlObj.searchParams.delete('utm_source');
    urlObj.searchParams.delete('utm_medium');
    urlObj.searchParams.delete('utm_campaign');
    return urlObj.href;
  } catch {
    return url;
  }
}

async function smartCrawl(
  startUrl: string,
  maxDepth: number,
  maxPages: number,
  priorityKeywords: string[]
): Promise<any[]> {
  const visited = new Set<string>();
  const pages: any[] = [];
  const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];

  const baseUrl = new URL(startUrl);
  const baseDomain = baseUrl.hostname;

  while (queue.length > 0 && pages.length < maxPages) {
    const { url, depth } = queue.shift()!;
    const normalizedUrl = normalizeUrl(url);

    if (visited.has(normalizedUrl) || depth > maxDepth) {
      continue;
    }

    visited.add(normalizedUrl);

    const page = await fetchAndCleanPage(url);
    pages.push(page);

    // Don't crawl further if we hit an error or reached max depth
    if (page.error || depth >= maxDepth) {
      continue;
    }

    // Extract links from the page
    try {
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);

      const links: { url: string; priority: number }[] = [];

      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (!href) return;

        try {
          const absoluteUrl = new URL(href, url).href;
          const linkUrl = new URL(absoluteUrl);

          // Only follow links on same domain
          if (linkUrl.hostname !== baseDomain) return;

          // Skip already visited (use normalized URL)
          const normalizedLink = normalizeUrl(absoluteUrl);
          if (visited.has(normalizedLink)) return;

          // Skip certain file types
          if (absoluteUrl.match(/\.(pdf|jpg|jpeg|png|gif|zip|exe|dmg)$/i)) return;

          // Calculate priority based on keywords
          const text = $(element).text().toLowerCase();
          const urlPath = linkUrl.pathname.toLowerCase();

          let priority = 0;
          priorityKeywords.forEach(keyword => {
            if (text.includes(keyword) || urlPath.includes(keyword)) {
              priority += 1;
            }
          });

          links.push({ url: absoluteUrl, priority });
        } catch (e) {
          // Invalid URL, skip
        }
      });

      // Sort by priority and add to queue
      links
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 10) // Only queue top 10 links per page
        .forEach(link => {
          if (!visited.has(link.url) && pages.length < maxPages) {
            queue.push({ url: link.url, depth: depth + 1 });
          }
        });

    } catch (error) {
      console.error(`Failed to extract links from ${url}:`, error);
    }

    // Small delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return pages;
}
