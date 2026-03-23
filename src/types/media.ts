export interface MediaAsset {
  id: number;
  workspace_id: number;
  uploaded_by: number;
  name: string;
  original_filename: string;
  mime_type: string;
  file_type: 'image' | 'video' | 'document';
  file_path: string | null;
  url: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  bunny_video_id: string | null;
  bunny_status: string | null;
  source: 'local' | 'bunny';
  description: string | null;
  tags: string;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

export interface StorageStats {
  image?: { count: number; total_size: number };
  video?: { count: number; total_size: number };
  document?: { count: number; total_size: number };
}
