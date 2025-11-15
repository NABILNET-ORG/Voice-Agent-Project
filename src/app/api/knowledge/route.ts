import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/knowledge
 * List all knowledge sources for the authenticated user
 * Query params: ?source_type=website|text|pdf&is_active=true|false
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const sourceType = searchParams.get('source_type');
    const isActive = searchParams.get('is_active');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('knowledge_sources')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (sourceType) {
      query = query.eq('source_type', sourceType);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching knowledge sources:', error);
      return NextResponse.json(
        { error: 'Failed to fetch knowledge sources', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/knowledge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge
 * Create a new knowledge source
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

    // Validate required fields
    const requiredFields = ['source_type', 'title'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: 'Missing required fields', fields: missingFields },
        { status: 400 }
      );
    }

    // Validate source_type
    const validSourceTypes = ['website', 'text', 'pdf', 'url'];
    if (!validSourceTypes.includes(body.source_type)) {
      return NextResponse.json(
        {
          error: 'Invalid source_type',
          allowed: validSourceTypes
        },
        { status: 400 }
      );
    }

    // Prepare knowledge source data
    const knowledgeData = {
      user_id: user.id,
      source_type: body.source_type,
      url: body.url || null,
      title: body.title,
      content: body.content || null,
      summary: body.summary || null,
      metadata: body.metadata || null,
      priority: body.priority || 0,
      is_active: body.is_active !== undefined ? body.is_active : true,
      auto_update: body.auto_update !== undefined ? body.auto_update : false,
      last_fetched_at: body.last_fetched_at || null,
      next_fetch_scheduled_at: body.next_fetch_scheduled_at || null,
    };

    const { data, error } = await supabase
      .from('knowledge_sources')
      .insert([knowledgeData])
      .select()
      .single();

    if (error) {
      console.error('Error creating knowledge source:', error);
      return NextResponse.json(
        { error: 'Failed to create knowledge source', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Knowledge source created successfully',
      data
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/knowledge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
