import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/knowledge/[id]
 * Get a single knowledge source by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data, error } = await supabase
      .from('knowledge_sources')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Knowledge source not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching knowledge source:', error);
      return NextResponse.json(
        { error: 'Failed to fetch knowledge source', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Unexpected error in GET /api/knowledge/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/knowledge/[id]
 * Update a knowledge source
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Fields that can be updated
    const allowedFields = [
      'source_type',
      'url',
      'title',
      'content',
      'summary',
      'metadata',
      'priority',
      'is_active',
      'auto_update',
      'last_fetched_at',
      'next_fetch_scheduled_at'
    ];

    // Filter out fields that aren't allowed to be updated
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('knowledge_sources')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Knowledge source not found' },
          { status: 404 }
        );
      }
      console.error('Error updating knowledge source:', error);
      return NextResponse.json(
        { error: 'Failed to update knowledge source', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Knowledge source updated successfully',
      data
    });

  } catch (error) {
    console.error('Unexpected error in PATCH /api/knowledge/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge/[id]
 * Delete a knowledge source
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { error } = await supabase
      .from('knowledge_sources')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting knowledge source:', error);
      return NextResponse.json(
        { error: 'Failed to delete knowledge source', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Knowledge source deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/knowledge/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
