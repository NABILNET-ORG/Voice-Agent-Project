import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/knowledge/refresh
 * Refresh content for knowledge sources
 * Body: { source_id?: string } - If provided, refreshes single source, otherwise refreshes all with auto_update enabled
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const sourceId = body.source_id;

    // Determine which sources to refresh
    let sourcesToRefresh;

    if (sourceId) {
      // Refresh specific source
      const { data: source, error } = await supabase
        .from('knowledge_sources')
        .select('*')
        .eq('id', sourceId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Knowledge source not found' },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { error: 'Failed to fetch knowledge source', details: error.message },
          { status: 500 }
        );
      }

      sourcesToRefresh = [source];
    } else {
      // Refresh all sources with auto_update enabled
      const { data: sources, error } = await supabase
        .from('knowledge_sources')
        .select('*')
        .eq('user_id', user.id)
        .eq('auto_update', true)
        .eq('is_active', true);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch knowledge sources', details: error.message },
          { status: 500 }
        );
      }

      sourcesToRefresh = sources || [];
    }

    if (sourcesToRefresh.length === 0) {
      return NextResponse.json({
        message: 'No sources to refresh',
        refreshed: 0
      });
    }

    // Refresh each source
    const results = [];
    const errors = [];

    for (const source of sourcesToRefresh) {
      try {
        let updatedContent = source.content;
        let updatedSummary = source.summary;

        // If source has a URL, re-fetch the content
        if (source.url && source.source_type === 'website') {
          // Call the fetch-website endpoint
          const fetchResponse = await fetch(`${request.nextUrl.origin}/api/knowledge/fetch-website`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: source.url,
              mode: 'single'
            })
          });

          if (fetchResponse.ok) {
            const fetchData = await fetchResponse.json();
            updatedContent = fetchData.content || source.content;

            // Re-summarize if we have new content
            if (updatedContent && updatedContent !== source.content) {
              const summarizeResponse = await fetch(`${request.nextUrl.origin}/api/knowledge/summarize`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  content: updatedContent,
                  title: source.title
                })
              });

              if (summarizeResponse.ok) {
                const summarizeData = await summarizeResponse.json();
                updatedSummary = summarizeData.summary || source.summary;
              }
            }
          }
        }

        // Update the source
        const { data: updated, error: updateError } = await supabase
          .from('knowledge_sources')
          .update({
            content: updatedContent,
            summary: updatedSummary,
            last_fetched_at: new Date().toISOString(),
            next_fetch_scheduled_at: source.auto_update
              ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Next refresh in 24 hours
              : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', source.id)
          .select()
          .single();

        if (updateError) {
          errors.push({
            source_id: source.id,
            title: source.title,
            error: updateError.message
          });
        } else {
          results.push({
            source_id: source.id,
            title: source.title,
            status: 'success',
            content_updated: updatedContent !== source.content,
            summary_updated: updatedSummary !== source.summary
          });
        }

      } catch (refreshError: any) {
        errors.push({
          source_id: source.id,
          title: source.title,
          error: refreshError.message || 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: `Refreshed ${results.length} knowledge source(s)`,
      refreshed: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/knowledge/refresh:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
