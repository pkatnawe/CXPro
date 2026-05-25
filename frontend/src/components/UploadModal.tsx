'use client'

import { useState, useRef, useEffect } from 'react'
import { validateFile, generateStoragePath, uploadFileToStorage, uploadPDF } from '@/lib/storage'
import { supabase } from '@/lib/supabase'

interface UploadModalProps {
  projectId: string
  open: boolean
  onClose: () => void
}

export default function UploadModal({ projectId, open, onClose }: UploadModalProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setSelectedFile(null)
      setError(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [open])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    const validationError = validateFile(file)
    
    if (validationError) {
      setError(validationError.message)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setError('Authentication required')
        return
      }

      const result = await uploadPDF(selectedFile, projectId, session.user.id)
      
      if (!result.success) {
        setError(result.error || 'Upload failed')
      } else {
        onClose()
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('Unexpected error during upload')
    } finally {
      setUploading(false)
    }
  }

  if (!open) return null

  return (
    <>
      <style jsx>{`
        .bp-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }

        .bp-modal {
          background: var(--bp-bg-primary);
          border-radius: 8px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          max-width: 480px;
          width: 90%;
          max-height: 90vh;
          overflow: auto;
        }

        .bp-modal-header {
          padding: 24px 24px 0;
          border-bottom: 1px solid var(--bp-border);
        }

        .bp-modal-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--bp-text-primary);
          margin: 0 0 16px 0;
        }

        .bp-modal-body {
          padding: 24px;
        }

        .bp-upload-zone {
          border: 2px dashed var(--bp-border);
          border-radius: 8px;
          padding: 32px;
          text-align: center;
          transition: border-color 0.2s;
        }

        .bp-upload-zone:hover {
          border-color: var(--bp-accent);
        }

        .bp-upload-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          color: var(--bp-text-secondary);
        }

        .bp-upload-text {
          color: var(--bp-text-primary);
          margin-bottom: 8px;
        }

        .bp-upload-hint {
          color: var(--bp-text-secondary);
          font-size: 0.875rem;
        }

        .bp-file-input {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }

        .bp-file-label {
          display: inline-block;
          padding: 8px 16px;
          background: var(--bp-accent);
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background-color 0.2s;
          margin-top: 16px;
        }

        .bp-file-label:hover {
          background: var(--bp-accent-hover);
        }

        .bp-file-selected {
          background: var(--bp-bg-secondary);
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .bp-file-info {
          flex: 1;
        }

        .bp-file-name {
          color: var(--bp-text-primary);
          font-weight: 500;
          margin-bottom: 4px;
        }

        .bp-file-size {
          color: var(--bp-text-secondary);
          font-size: 0.875rem;
        }

        .bp-error {
          background: var(--bp-error-bg);
          color: var(--bp-error-text);
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 0.875rem;
        }

        .bp-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--bp-border);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .bp-btn {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          outline: none;
        }

        .bp-btn-cancel {
          background: var(--bp-bg-secondary);
          color: var(--bp-text-primary);
        }

        .bp-btn-cancel:hover {
          background: var(--bp-bg-tertiary);
        }

        .bp-btn-primary {
          background: var(--bp-accent);
          color: white;
        }

        .bp-btn-primary:hover {
          background: var(--bp-accent-hover);
        }

        .bp-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .bp-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid transparent;
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="bp-modal-overlay" onClick={onClose}>
        <div className="bp-modal" onClick={(e) => e.stopPropagation()}>
          <div className="bp-modal-header">
            <h2 className="bp-modal-title">Upload Submittal</h2>
          </div>

          <div className="bp-modal-body">
            {error && (
              <div className="bp-error">
                {error}
              </div>
            )}

            <div className="bp-upload-zone">
              <svg className="bp-upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              
              <div className="bp-upload-text">
                {selectedFile ? 'File selected' : 'Choose a PDF file to upload'}
              </div>
              <div className="bp-upload-hint">
                Maximum file size: 25MB
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileSelect}
                className="bp-file-input"
                id="file-upload"
                disabled={uploading}
              />
              <label htmlFor="file-upload" className="bp-file-label">
                Select PDF
              </label>
            </div>

            {selectedFile && (
              <div className="bp-file-selected">
                <div className="bp-file-info">
                  <div className="bp-file-name">{selectedFile.name}</div>
                  <div className="bp-file-size">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bp-modal-footer">
            <button 
              className="bp-btn bp-btn-cancel" 
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button 
              className="bp-btn bp-btn-primary"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading && <span className="bp-spinner" />}
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}