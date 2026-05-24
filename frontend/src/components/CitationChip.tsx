'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Citation {
  id: string
  document_chunk_id: string
  step_id: string
  citation_text: string
  confidence_score: number
  page_number: number | null
  bbox: {
    x: number
    y: number
    width: number
    height: number
  } | null
}

interface Document {
  id: string
  name: string
  file_path: string
}

interface CitationChipProps {
  citation: Citation
  document: Document | null
}

export default function CitationChip({ citation, document }: CitationChipProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!document || !citation.page_number) return

    setLoading(true)

    try {
      // Get signed URL for the PDF
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.file_path, 3600) // 1 hour expiry

      if (urlError || !signedUrlData) {
        console.error('Error getting signed URL:', urlError)
        return
      }

      // Build URL with page and bbox parameters for PDF viewer
      const pdfUrl = new URL(signedUrlData.signedUrl)
      pdfUrl.hash = `page=${citation.page_number}`

      // If we have bbox coordinates, add them for highlighting
      if (citation.bbox) {
        pdfUrl.hash += `&highlight=${citation.bbox.x},${citation.bbox.y},${citation.bbox.width},${citation.bbox.height}`
      }

      // Open PDF in new tab
      window.open(pdfUrl.toString(), '_blank')
    } catch (error) {
      console.error('Error opening PDF:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className="bp-citation-chip"
      onClick={handleClick}
      disabled={loading || !document || !citation.page_number}
      title={citation.citation_text}
    >
      <span className="bp-citation-icon">📄</span>
      <span className="bp-citation-page">
        {citation.page_number ? `p.${citation.page_number}` : 'Citation'}
      </span>
      {citation.confidence_score && (
        <span className="bp-citation-confidence">
          {Math.round(citation.confidence_score * 100)}%
        </span>
      )}
    </button>
  )
}

// CSS for citation chip
const styles = `
.bp-citation-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--bp-blue-tint);
  border: 1px solid var(--bp-blue-soft);
  border-radius: 3px;
  font-size: 12px;
  color: var(--bp-blue);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.bp-citation-chip:hover:not(:disabled) {
  background: var(--bp-blue-soft);
  border-color: var(--bp-blue);
  transform: translateY(-1px);
}

.bp-citation-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bp-citation-icon {
  font-size: 11px;
}

.bp-citation-page {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  font-weight: 500;
}

.bp-citation-confidence {
  font-size: 10px;
  color: var(--bp-graphite);
  margin-left: 2px;
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  document.head.appendChild(styleEl)
}