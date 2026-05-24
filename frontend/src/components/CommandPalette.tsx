'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface SearchResult {
  id: string
  type: 'project' | 'document' | 'test_procedure' | 'equipment'
  title: string
  subtitle?: string
  path?: string
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [open])

  const performSearch = useCallback(async (searchQuery: string) => {
    setLoading(true)
    const searchResults: SearchResult[] = []

    try {
      // Search projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .ilike('name', `%${searchQuery}%`)
        .limit(3)

      if (projects) {
        projects.forEach(project => {
          searchResults.push({
            id: project.id,
            type: 'project',
            title: project.name,
            subtitle: 'Project',
            path: `/project/${project.id}`
          })
        })
      }

      // Search documents
      const { data: documents } = await supabase
        .from('documents')
        .select('id, name, project_id')
        .ilike('name', `%${searchQuery}%`)
        .limit(3)

      if (documents) {
        documents.forEach(doc => {
          searchResults.push({
            id: doc.id,
            type: 'document',
            title: doc.name,
            subtitle: 'Document',
            path: `/project/${doc.project_id}/documents`
          })
        })
      }

      // Search test procedures
      const { data: testProcedures } = await supabase
        .from('test_procedure_instances')
        .select('id, equipment_type, asset_tag, manufacturer')
        .or(`equipment_type.ilike.%${searchQuery}%,asset_tag.ilike.%${searchQuery}%,manufacturer.ilike.%${searchQuery}%`)
        .limit(3)

      if (testProcedures) {
        testProcedures.forEach(tp => {
          searchResults.push({
            id: tp.id,
            type: 'test_procedure',
            title: `${tp.equipment_type}${tp.asset_tag ? ` - ${tp.asset_tag}` : ''}`,
            subtitle: tp.manufacturer || 'Test Procedure',
            path: `/entity/${tp.id}`
          })
        })
      }

      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Search as user types
  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([])
      return
    }

    const searchTimeout = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query, performSearch])

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open) return

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]?.path) {
          router.push(results[selectedIndex].path)
          onClose()
        }
        break
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results, selectedIndex])

  if (!open) return null

  return (
    <>
      <div className="bp-cmd-overlay" onClick={onClose} />
      <div className="bp-cmd-palette">
        <div className="bp-cmd-header">
          <input
            ref={inputRef}
            type="text"
            className="bp-cmd-input"
            placeholder="Search projects, documents, equipment..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="bp-cmd-close" onClick={onClose}>
            <span className="bp-kbd">ESC</span>
          </div>
        </div>

        {loading && (
          <div className="bp-cmd-loading">Searching...</div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="bp-cmd-empty">No results found for &quot;{query}&quot;</div>
        )}

        {!loading && results.length > 0 && (
          <div className="bp-cmd-results">
            {results.map((result, idx) => (
              <button
                key={result.id}
                className={`bp-cmd-result ${idx === selectedIndex ? 'is-selected' : ''}`}
                onClick={() => {
                  if (result.path) {
                    router.push(result.path)
                    onClose()
                  }
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="bp-cmd-result-icon">
                  {result.type === 'project' && '📁'}
                  {result.type === 'document' && '📄'}
                  {result.type === 'test_procedure' && '✓'}
                  {result.type === 'equipment' && '⚙️'}
                </div>
                <div className="bp-cmd-result-content">
                  <div className="bp-cmd-result-title">{result.title}</div>
                  {result.subtitle && (
                    <div className="bp-cmd-result-subtitle">{result.subtitle}</div>
                  )}
                </div>
                <div className="bp-cmd-result-action">
                  <span className="bp-kbd">↵</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="bp-cmd-footer">
          <div className="bp-cmd-hint">
            <span className="bp-kbd">↑↓</span> Navigate
          </div>
          <div className="bp-cmd-hint">
            <span className="bp-kbd">↵</span> Open
          </div>
          <div className="bp-cmd-hint">
            <span className="bp-kbd">ESC</span> Close
          </div>
        </div>
      </div>
    </>
  )
}

// CSS for command palette
const styles = `
.bp-cmd-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9998;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.bp-cmd-palette {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 600px;
  background: var(--bp-card-2);
  border: 1px solid var(--bp-line);
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  overflow: hidden;
  animation: slideIn 0.2s ease;
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to { 
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.bp-cmd-header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--bp-line-soft);
}

.bp-cmd-input {
  flex: 1;
  padding: 16px 20px;
  background: transparent;
  border: none;
  font-size: 16px;
  font-family: inherit;
  color: var(--bp-ink);
}

.bp-cmd-input:focus {
  outline: none;
}

.bp-cmd-close {
  padding: 0 20px;
  cursor: pointer;
}

.bp-cmd-loading,
.bp-cmd-empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--bp-graphite);
  font-size: 14px;
}

.bp-cmd-results {
  max-height: 400px;
  overflow-y: auto;
  border-bottom: 1px solid var(--bp-line-soft);
}

.bp-cmd-result {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  width: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  font-family: inherit;
}

.bp-cmd-result:hover,
.bp-cmd-result.is-selected {
  background: var(--bp-blue-tint);
}

.bp-cmd-result.is-selected {
  position: relative;
}

.bp-cmd-result.is-selected::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--bp-blue);
}

.bp-cmd-result-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.bp-cmd-result-content {
  flex: 1;
  min-width: 0;
}

.bp-cmd-result-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--bp-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bp-cmd-result-subtitle {
  font-size: 12px;
  color: var(--bp-graphite);
  margin-top: 2px;
}

.bp-cmd-result-action {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.bp-cmd-result:hover .bp-cmd-result-action,
.bp-cmd-result.is-selected .bp-cmd-result-action {
  opacity: 1;
}

.bp-cmd-footer {
  padding: 12px 20px;
  display: flex;
  gap: 20px;
  background: var(--bp-paper-2);
}

.bp-cmd-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--bp-graphite);
}

.bp-kbd {
  padding: 2px 6px;
  background: var(--bp-card);
  border: 1px solid var(--bp-line-soft);
  border-radius: 3px;
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  color: var(--bp-ink-2);
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  document.head.appendChild(styleEl)
}