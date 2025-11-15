import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/profile/avatar
 * Upload and set user avatar
 * Expects multipart/form-data with an 'avatar' file field
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

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          allowed: ['JPEG', 'JPG', 'PNG', 'GIF', 'WEBP']
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large', maxSize: '5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('user-uploads') // Make sure this bucket exists in your Supabase project
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);

      // If bucket doesn't exist, provide helpful message
      if (uploadError.message.includes('not found')) {
        return NextResponse.json(
          {
            error: 'Storage bucket not configured',
            details: 'Please create a "user-uploads" bucket in Supabase Storage',
            supabaseError: uploadError.message
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to upload avatar', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('user-uploads')
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    // Update profile with new avatar URL
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile with avatar:', updateError);

      // Avatar was uploaded but profile update failed
      // Try to delete the uploaded file to avoid orphaned files
      await supabase.storage.from('user-uploads').remove([filePath]);

      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Avatar uploaded successfully',
      data: {
        avatar_url: avatarUrl,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type
      },
      profile
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/profile/avatar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/avatar
 * Remove user avatar
 */
export async function DELETE(request: NextRequest) {
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

    // Get current profile to find avatar URL
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    // Update profile to remove avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error removing avatar from profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove avatar', details: updateError.message },
        { status: 500 }
      );
    }

    // Try to delete the file from storage if it exists
    if (profile?.avatar_url) {
      try {
        // Extract file path from URL
        const urlParts = profile.avatar_url.split('/');
        const bucketIndex = urlParts.indexOf('user-uploads');
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/');
          await supabase.storage.from('user-uploads').remove([filePath]);
        }
      } catch (storageError) {
        console.error('Error deleting avatar file from storage:', storageError);
        // Continue anyway - profile was updated
      }
    }

    return NextResponse.json({
      message: 'Avatar removed successfully'
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/profile/avatar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
