/**
 * VYRA Media & Storage Client
 * Integrates directly with Supabase Storage buckets with local fallback
 * for zero-dependency development and tenant isolation.
 */
import { getSupabaseClient } from './supabase';

export type StorageBucket =
  | 'avatars'
  | 'business-logos'
  | 'business-banners'
  | 'product-images'
  | 'product-videos'
  | 'store-assets'
  | 'ad-creatives'
  | 'blog-media'
  | 'documents'
  | 'chat-attachments';

export interface MediaAsset {
  id: string;
  business_id: string;
  bucket: StorageBucket;
  file_name: string;
  file_path: string;
  public_url: string;
  file_type: string;
  file_size_bytes: number;
  dimensions?: { width: number; height: number };
  alt_text?: string;
  caption?: string;
  created_at: string;
}

const LOCAL_STORAGE_MEDIA_KEY = 'vyra_local_media_assets';
const LEGACY_STORAGE_MEDIA_KEY = 'nexvora_local_media_assets';

export function getLocalMediaAssets(businessId?: string): MediaAsset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MEDIA_KEY) || localStorage.getItem(LEGACY_STORAGE_MEDIA_KEY);
    if (!raw) return [];
    const parsed: MediaAsset[] = JSON.parse(raw);
    if (businessId) {
      return parsed.filter((m) => m.business_id === businessId);
    }
    return parsed;
  } catch (err) {
    console.error('Failed to parse local media assets:', err);
    return [];
  }
}

export function saveLocalMediaAsset(asset: MediaAsset): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalMediaAssets();
    const updated = [asset, ...existing.filter((a) => a.id !== asset.id)];
    localStorage.setItem(LOCAL_STORAGE_MEDIA_KEY, JSON.stringify(updated.slice(0, 100)));
  } catch (err) {
    console.error('Failed to save local media asset:', err);
  }
}

export function deleteLocalMediaAsset(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalMediaAssets();
    const updated = existing.filter((a) => a.id !== id);
    localStorage.setItem(LOCAL_STORAGE_MEDIA_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete local media asset:', err);
  }
}

/**
 * Validates file size and MIME type
 */
export function validateMediaFile(
  file: File,
  maxSizeBytes: number = 10 * 1024 * 1024, // 10MB
  allowedTypes: string[] = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'application/pdf',
  ]
): { valid: boolean; error?: string } {
  if (file.size > maxSizeBytes) {
    const sizeMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return { valid: false, error: `File size exceeds the ${sizeMb}MB maximum threshold.` };
  }

  const isTypeAllowed = allowedTypes.some((type) => {
    if (type.endsWith('/*')) {
      const prefix = type.replace('/*', '');
      return file.type.startsWith(prefix);
    }
    return file.type === type;
  });

  if (!isTypeAllowed) {
    return {
      valid: false,
      error: `File type "${file.type || 'unknown'}" is not supported. Supported formats: JPG, PNG, WEBP, SVG, MP4, PDF.`,
    };
  }

  return { valid: true };
}

/**
 * Uploads media file to Supabase Storage with graceful fallback to base64 object URL
 */
export async function uploadMediaAsset({
  file,
  bucket,
  businessId,
  altText,
  caption,
  onProgress,
}: {
  file: File;
  bucket: StorageBucket;
  businessId: string;
  altText?: string;
  caption?: string;
  onProgress?: (progressPercent: number) => void;
}): Promise<MediaAsset> {
  const validation = validateMediaFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const supabase = getSupabaseClient();
  const fileExt = file.name.split('.').pop() || 'dat';
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${businessId}/${Date.now()}-${cleanFileName}`;

  onProgress?.(25);

  let publicUrl = '';

  if (supabase) {
    try {
      onProgress?.(50);
      const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (!error && data) {
        onProgress?.(80);
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
        publicUrl = urlData.publicUrl;
      }
    } catch (err) {
      console.warn('Supabase storage upload failed, falling back to local object storage:', err);
    }
  }

  // Graceful local base64 fallback when Supabase Storage bucket isn't yet provisioned
  if (!publicUrl) {
    onProgress?.(70);
    publicUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  onProgress?.(100);

  const asset: MediaAsset = {
    id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    business_id: businessId,
    bucket,
    file_name: file.name,
    file_path: filePath,
    public_url: publicUrl,
    file_type: file.type,
    file_size_bytes: file.size,
    alt_text: altText || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
    caption: caption || '',
    created_at: new Date().toISOString(),
  };

  saveLocalMediaAsset(asset);
  return asset;
}
