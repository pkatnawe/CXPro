import { supabase } from './supabase'

// File validation constants
export const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB in bytes
export const ALLOWED_MIME_TYPES = ['application/pdf']

export interface FileValidationError {
  type: 'invalid-type' | 'too-large'
  message: string
}

export function validateFile(file: File): FileValidationError | null {
  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      type: 'invalid-type',
      message: 'Only PDF files are allowed'
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      type: 'too-large',
      message: 'File size must be less than 25MB'
    }
  }

  return null
}

export function generateStoragePath(projectId: string, filename: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `projects/${projectId}/documents/${timestamp}-${sanitizedFilename}`
}

export async function uploadFileToStorage(
  file: File, 
  storagePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected storage error:', error)
    return { success: false, error: 'Unexpected error during upload' }
  }
}

export async function createDocumentRecord(
  projectId: string,
  filename: string,
  originalFilename: string,
  fileSize: number,
  mimeType: string,
  storagePath: string,
  uploadedBy: string
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .rpc('create_document_with_outbox', {
        p_project_id: projectId,
        p_filename: filename,
        p_original_filename: originalFilename,
        p_file_size: fileSize,
        p_mime_type: mimeType,
        p_storage_path: storagePath,
        p_uploaded_by: uploadedBy
      })

    if (error) {
      console.error('Document creation error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, documentId: data }
  } catch (error) {
    console.error('Unexpected document creation error:', error)
    return { success: false, error: 'Unexpected error creating document record' }
  }
}

export async function uploadPDF(
  file: File, 
  projectId: string, 
  userId: string
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  // Validate file
  const validationError = validateFile(file)
  if (validationError) {
    return { success: false, error: validationError.message }
  }

  // Generate storage path
  const storagePath = generateStoragePath(projectId, file.name)
  const filename = storagePath.split('/').pop() || file.name

  // Upload to storage
  const uploadResult = await uploadFileToStorage(file, storagePath)
  if (!uploadResult.success) {
    return { success: false, error: uploadResult.error }
  }

  // Create document record with outbox event
  const recordResult = await createDocumentRecord(
    projectId,
    filename,
    file.name,
    file.size,
    file.type,
    storagePath,
    userId
  )

  return recordResult
}