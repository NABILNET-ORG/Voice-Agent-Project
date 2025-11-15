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
    let { url, method = 'smart_crawl', options = {} } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Auto-add https:// if protocol missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
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

    if (method === 'all_products') {
      // All Products mode: Only crawl product/service/menu pages
      const pages = await smartCrawlProductsOnly(url, maxPages);
      const totalWords = pages.reduce((sum, p) => sum + p.wordCount, 0);
      const estimatedTokens = Math.ceil(totalWords / 0.75);

      return NextResponse.json({
        pages,
        totalWords,
        estimatedTokens
      });
    }

    // Smart crawl (original behavior)
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

async function fetchAndCleanPage(url: string): Promise<{url: string, title: string, content: string, wordCount: number, excerpt: string, selected: boolean, error?: string, html?: string}> {
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
      selected: true,
      html: html  // Return HTML for link extraction
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

// Normalize URL to prevent duplicates - more aggressive normalization
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Remove www. from hostname
    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }

    // Normalize path - remove trailing slash except for root
    let pathname = parsed.pathname;
    if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }

    // Remove ALL query params and fragments for better deduplication
    // Construct normalized URL
    const normalized = `${parsed.protocol}//${hostname}${pathname}`;

    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

// Content fingerprint to detect duplicate content even with different URLs
function getContentFingerprint(content: string): string {
  const cleaned = content.replace(/\s+/g, ' ').trim();
  return cleaned.substring(0, 300) + ':' + cleaned.length;
}

// Check if URL is likely a product/service/menu page
function isProductServicePage(url: string): boolean {
  const urlLower = url.toLowerCase();

  // Exclude media files and assets
  const mediaExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico',
    '.pdf', '.doc', '.docx', '.zip', '.rar',
    '.mp4', '.mp3', '.avi', '.mov',
    '.css', '.js', '.json', '.xml'
  ];

  for (const ext of mediaExtensions) {
    if (urlLower.endsWith(ext)) {
      return false;
    }
  }

  // Exclude wp-content uploads and assets
  if (urlLower.includes('/wp-content/uploads/') ||
      urlLower.includes('/wp-content/themes/') ||
      urlLower.includes('/wp-includes/') ||
      urlLower.includes('/assets/') ||
      urlLower.includes('/static/')) {
    return false;
  }

  // Include URLs containing these keywords
  const includeKeywords = [
    'product', 'service', 'menu', 'shop', 'store', 'catalog',
    'item', 'booking', 'order', 'buy', 'pricing', 'price',
    'package', 'plan', 'offer', 'deals', 'cart', 'checkout',
    'category', 'collection', 'goods', 'merchandise'
  ];

  // Exclude URLs containing these keywords
  const excludeKeywords = [
    'about', 'contact', 'blog', 'news', 'article', 'post',
    'team', 'career', 'job', 'privacy', 'terms', 'policy',
    'faq', 'help', 'support', 'login', 'register', 'account'
  ];

  // Check if URL contains exclude keywords
  for (const keyword of excludeKeywords) {
    if (urlLower.includes(keyword)) {
      return false;
    }
  }

  // Check if URL contains include keywords
  for (const keyword of includeKeywords) {
    if (urlLower.includes(keyword)) {
      return true;
    }
  }

  // If no specific keywords, allow it (might be a product page)
  return true;
}

// Smart crawl for products/services only
async function smartCrawlProductsOnly(
  startUrl: string,
  maxPages: number
): Promise<any[]> {
  const visited = new Set<string>();
  const contentFingerprints = new Set<string>();
  const pages: any[] = [];
  const queue: string[] = [startUrl];

  const baseUrl = new URL(startUrl);
  const baseDomain = baseUrl.hostname.replace('www.', '');

  console.log(`[All Products Mode] Starting crawl from ${startUrl}, max pages: ${maxPages}`);

  while (queue.length > 0 && pages.length < maxPages) {
    const url = queue.shift()!;
    const normalizedUrl = normalizeUrl(url);

    // Skip if already visited
    if (visited.has(normalizedUrl)) {
      continue;
    }

    // Check if this is a product/service page
    if (!isProductServicePage(url)) {
      console.log(`[All Products] Skipping non-product page: ${url}`);
      visited.add(normalizedUrl);
      continue;
    }

    visited.add(normalizedUrl);

    const page = await fetchAndCleanPage(url);

    // Skip if error or duplicate content
    if (page.error) {
      console.log(`[All Products] Error fetching ${url}: ${page.error}`);
      continue;
    }

    const fingerprint = getContentFingerprint(page.content);
    if (contentFingerprints.has(fingerprint)) {
      console.log(`[All Products] Duplicate content detected: ${url}`);
      continue;
    }

    contentFingerprints.add(fingerprint);
    pages.push(page);

    console.log(`[All Products] Crawled ${pages.length}/${maxPages}: ${page.title}`);

    // Extract and queue product/service links from this page
    if (page.html) {
      const links = extractLinksFromHTML(page.html, baseDomain);

      // Filter to product/service pages only
      const productLinks = links.filter(link => isProductServicePage(link));

      // Add to queue
      for (const link of productLinks) {
        const normalizedLink = normalizeUrl(link);
        if (!visited.has(normalizedLink) && !queue.includes(link)) {
          queue.push(link);
        }
      }

      console.log(`[All Products] Discovered ${productLinks.length} product/service links`);
    }
  }

  console.log(`[All Products] Completed. Crawled ${pages.length} product/service pages`);
  return pages;
}

// Extract links from HTML
function extractLinksFromHTML(html: string, baseDomain: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];

  $('a[href]').each((_, elem) => {
    try {
      const href = $(elem).attr('href');
      if (!href) return;

      // Build absolute URL
      const absoluteUrl = href.startsWith('http')
        ? href
        : new URL(href, `https://${baseDomain}`).href;

      // Only same domain
      const urlDomain = new URL(absoluteUrl).hostname.replace('www.', '');
      if (urlDomain === baseDomain) {
        links.push(absoluteUrl);
      }
    } catch (e) {
      // Skip invalid URLs
    }
  });

  return links;
}

async function smartCrawl(
  startUrl: string,
  maxDepth: number,
  maxPages: number,
  priorityKeywords: string[]
): Promise<any[]> {
  const visited = new Set<string>();
  const contentFingerprints = new Set<string>();
  const pages: any[] = [];
  const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];

  const baseUrl = new URL(startUrl);
  const baseDomain = baseUrl.hostname.replace('www.', '');

  while (queue.length > 0 && pages.length < maxPages) {
    const { url, depth } = queue.shift()!;
    const normalizedUrl = normalizeUrl(url);

    // Skip if URL already visited
    if (visited.has(normalizedUrl) || depth > maxDepth) {
      continue;
    }

    visited.add(normalizedUrl);

    const page = await fetchAndCleanPage(url);

    // Check for duplicate content using fingerprint
    if (page.content) {
      const fingerprint = getContentFingerprint(page.content);
      if (contentFingerprints.has(fingerprint)) {
        console.log(`Skipping duplicate content from: ${url}`);
        continue;  // Skip this page - duplicate content
      }
      contentFingerprints.add(fingerprint);
    }

    pages.push(page);

    // Don't crawl further if we hit an error or reached max depth
    if (page.error || depth >= maxDepth) {
      continue;
    }

    // Extract links from the page (reuse HTML from fetchAndCleanPage to avoid double-fetch)
    if (!page.html) {
      continue;  // Skip link extraction if no HTML available
    }

    try {
      const $ = cheerio.load(page.html);

      const links: { url: string; priority: number }[] = [];

      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (!href) return;

        try {
          const absoluteUrl = new URL(href, url).href;
          const linkUrl = new URL(absoluteUrl);

          // Only follow links on same domain (normalize both for comparison)
          const linkDomain = linkUrl.hostname.replace('www.', '');
          if (linkDomain !== baseDomain) return;

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
