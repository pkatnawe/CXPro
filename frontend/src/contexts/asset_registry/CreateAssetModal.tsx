'use client'

import { useState, useEffect, useCallback, KeyboardEvent } from 'react'
import {
  createAsset,
  type Asset,
  type AssetType,
  type Space,
} from '@/contexts/asset_registry/api'
import {
  WBox,
  WPill,
  WT,
  WBtn,
} from '@/lib/frontend-kit'

interface KVRow {
  key: string
  value: string
}

interface FieldErrors {
  tag?: string
  asset_type_id?: string
  [key: string]: string | undefined
}

interface CreateAssetModalProps {
  projectId: string
  assetTypes: AssetType[]
  spaces: Space[]
  assets: Asset[]
  onClose: () => void
  onCreated: (asset: Asset) => void
}

function buildSpaceLevels(spaces: Space[]): {
  roots: Space[]
  childrenOf: Map<string | null, Space[]>
} {
  const childrenOf = new Map<string | null, Space[]>()
  for (const s of spaces) {
    const parentId = s.parent_space_id ?? null
    const arr = childrenOf.get(parentId) ?? []
    arr.push(s)
    childrenOf.set(parentId, arr)
  }
  const roots = childrenOf.get(null) ?? []
  return { roots, childrenOf }
}

export function CreateAssetModal({
  projectId,
  assetTypes,
  spaces,
  assets,
  onClose,
  onCreated,
}: CreateAssetModalProps) {
  const [tag, setTag] = useState('')
  const [name, setName] = useState('')
  const [assetTypeId, setAssetTypeId] = useState('')
  const [spaceLevel1, setSpaceLevel1] = useState('')
  const [spaceLevel2, setSpaceLevel2] = useState('')
  const [spaceLevel3, setSpaceLevel3] = useState('')
  const [parentAssetId, setParentAssetId] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [model, setModel] = useState('')
  const [serial, setSerial] = useState('')
  const [vendorName, setVendorName] = useState('')
  const [kvRows, setKvRows] = useState<KVRow[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [generalError, setGeneralError] = useState('')

  const { roots, childrenOf } = buildSpaceLevels(spaces)

  const level2Options = spaceLevel1 ? (childrenOf.get(spaceLevel1) ?? []) : []
  const level3Options = spaceLevel2 ? (childrenOf.get(spaceLevel2) ?? []) : []

  const resolvedSpaceId = spaceLevel3 || spaceLevel2 || spaceLevel1 || null

  const handleEsc = useCallback(
    (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [handleEsc])

  const addKvRow = () => setKvRows(r => [...r, { key: '', value: '' }])
  const removeKvRow = (i: number) => setKvRows(r => r.filter((_, idx) => idx !== i))
  const updateKvRow = (i: number, field: 'key' | 'value', val: string) => {
    setKvRows(r => r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)))
  }

  const validate = (): boolean => {
    const errors: FieldErrors = {}
    if (!tag.trim()) errors.tag = 'Tag is required'
    if (!assetTypeId) errors.asset_type_id = 'Asset type is required'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    setGeneralError('')
    if (!validate()) return
    setSubmitting(true)
    try {
      const nameplateData: Record<string, unknown> = {}
      for (const row of kvRows) {
        if (row.key.trim()) nameplateData[row.key.trim()] = row.value
      }
      const created = await createAsset(projectId, {
        tag: tag.trim(),
        name: name.trim() || null,
        asset_type_id: assetTypeId,
        space_id: resolvedSpaceId,
        parent_asset_id: parentAssetId || null,
        manufacturer: manufacturer.trim() || null,
        model: model.trim() || null,
        serial: serial.trim() || null,
        vendor_name: vendorName.trim() || null,
        nameplate_data: nameplateData,
      })
      onCreated(created)
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string }
      if (e?.status === 409) {
        setFieldErrors(prev => ({ ...prev, tag: 'Tag already exists in this project' }))
      } else {
        setGeneralError(e?.message ?? 'Failed to create asset')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '16px',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <style jsx>{`
        .cam-modal { min-width: 0; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; padding: 24px; }
        .cam-title { font-size: 15px; font-weight: 600; color: var(--bp-ink); margin: 0 0 4px 0; }
        .cam-hint { font-size: 12px; color: var(--bp-text-secondary); margin: 0 0 20px 0; }
        .cam-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
        .cam-label { font-size: 11px; font-weight: 500; color: var(--bp-text-secondary); letter-spacing: 0.04em; text-transform: uppercase; }
        .cam-input { background: var(--bp-paper-2); border: 1px solid var(--bp-line-softer); border-radius: 6px; padding: 7px 10px; font-size: 13px; color: var(--bp-ink); outline: none; width: 100%; box-sizing: border-box; }
        .cam-input:focus { border-color: var(--bp-blue); }
        .cam-input.is-error { border-color: var(--bp-red, #e53e3e); }
        .cam-select { background: var(--bp-paper-2); border: 1px solid var(--bp-line-softer); border-radius: 6px; padding: 7px 10px; font-size: 13px; color: var(--bp-ink); outline: none; width: 100%; box-sizing: border-box; appearance: none; cursor: pointer; }
        .cam-select:focus { border-color: var(--bp-blue); }
        .cam-select.is-error { border-color: var(--bp-red, #e53e3e); }
        .cam-error { font-size: 11px; color: var(--bp-red, #e53e3e); }
        .cam-divider { border: none; border-top: 1px solid var(--bp-line-softest, var(--bp-line-softer)); margin: 16px 0; }
        .cam-section-label { font-size: 11px; font-weight: 600; color: var(--bp-text-secondary); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px; }
        .cam-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .cam-kv-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 6px; margin-bottom: 6px; align-items: center; }
        .cam-kv-del { background: none; border: none; cursor: pointer; color: var(--bp-text-secondary); font-size: 16px; padding: 0 4px; line-height: 1; }
        .cam-kv-del:hover { color: var(--bp-red, #e53e3e); }
        .cam-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
        .cam-general-error { background: var(--bp-red-bg, #fff5f5); border: 1px solid var(--bp-red, #e53e3e); border-radius: 6px; padding: 8px 12px; font-size: 12px; color: var(--bp-red, #e53e3e); margin-bottom: 12px; }
      `}</style>

      <WBox className="cam-modal">
        <p className="cam-title">New Asset</p>
        <p className="cam-hint">Tag must be unique within this project.</p>

        {generalError && <div className="cam-general-error">{generalError}</div>}

        <div className="cam-field">
          <label className="cam-label">Tag *</label>
          <input
            className={`cam-input${fieldErrors.tag ? ' is-error' : ''}`}
            value={tag}
            onChange={e => { setTag(e.target.value); setFieldErrors(p => ({ ...p, tag: undefined })) }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. AHU-A-01"
            autoFocus
          />
          {fieldErrors.tag && <span className="cam-error">{fieldErrors.tag}</span>}
        </div>

        <div className="cam-field">
          <label className="cam-label">Name</label>
          <input
            className="cam-input"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Air Handling Unit A-01"
          />
        </div>

        <div className="cam-field">
          <label className="cam-label">Asset Type *</label>
          <select
            className={`cam-select${fieldErrors.asset_type_id ? ' is-error' : ''}`}
            value={assetTypeId}
            onChange={e => { setAssetTypeId(e.target.value); setFieldErrors(p => ({ ...p, asset_type_id: undefined })) }}
          >
            <option value="">— select type —</option>
            {assetTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {fieldErrors.asset_type_id && <span className="cam-error">{fieldErrors.asset_type_id}</span>}
        </div>

        <hr className="cam-divider" />
        <div className="cam-section-label">Location</div>

        <div className="cam-field">
          <label className="cam-label">Building / Top-level Space</label>
          <select
            className="cam-select"
            value={spaceLevel1}
            onChange={e => { setSpaceLevel1(e.target.value); setSpaceLevel2(''); setSpaceLevel3('') }}
          >
            <option value="">— none —</option>
            {roots.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {spaceLevel1 && level2Options.length > 0 && (
          <div className="cam-field">
            <label className="cam-label">Hall / Sub-space</label>
            <select
              className="cam-select"
              value={spaceLevel2}
              onChange={e => { setSpaceLevel2(e.target.value); setSpaceLevel3('') }}
            >
              <option value="">— none —</option>
              {level2Options.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {spaceLevel2 && level3Options.length > 0 && (
          <div className="cam-field">
            <label className="cam-label">Row / Sub-sub-space</label>
            <select
              className="cam-select"
              value={spaceLevel3}
              onChange={e => setSpaceLevel3(e.target.value)}
            >
              <option value="">— none —</option>
              {level3Options.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="cam-field">
          <label className="cam-label">Parent Asset (optional)</label>
          <select
            className="cam-select"
            value={parentAssetId}
            onChange={e => setParentAssetId(e.target.value)}
          >
            <option value="">— none —</option>
            {assets.map(a => (
              <option key={a.id} value={a.id}>{a.tag}{a.name ? ` · ${a.name}` : ''}</option>
            ))}
          </select>
        </div>

        <hr className="cam-divider" />
        <div className="cam-section-label">Details</div>

        <div className="cam-row">
          <div className="cam-field">
            <label className="cam-label">Manufacturer</label>
            <input
              className="cam-input"
              value={manufacturer}
              onChange={e => setManufacturer(e.target.value)}
              placeholder="e.g. Daikin"
            />
          </div>
          <div className="cam-field">
            <label className="cam-label">Model</label>
            <input
              className="cam-input"
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="e.g. VRVIV-S"
            />
          </div>
        </div>

        <div className="cam-row">
          <div className="cam-field">
            <label className="cam-label">Serial</label>
            <input
              className="cam-input"
              value={serial}
              onChange={e => setSerial(e.target.value)}
              placeholder="e.g. SN-2024-001"
            />
          </div>
          <div className="cam-field">
            <label className="cam-label">Vendor</label>
            <input
              className="cam-input"
              value={vendorName}
              onChange={e => setVendorName(e.target.value)}
              placeholder="e.g. Hudson DC LLC"
            />
          </div>
        </div>

        <hr className="cam-divider" />
        <div className="cam-section-label">Nameplate Data</div>

        {kvRows.map((row, i) => (
          <div key={i} className="cam-kv-row">
            <input
              className="cam-input"
              value={row.key}
              onChange={e => updateKvRow(i, 'key', e.target.value)}
              placeholder="Key"
            />
            <input
              className="cam-input"
              value={row.value}
              onChange={e => updateKvRow(i, 'value', e.target.value)}
              placeholder="Value"
            />
            <button className="cam-kv-del" onClick={() => removeKvRow(i)} title="Remove row">×</button>
          </div>
        ))}

        <WPill
          variant="chip"
          style={{ cursor: 'pointer', marginTop: 4 }}
          onClick={addKvRow}
        >
          + add row
        </WPill>

        <div className="cam-footer">
          <WBtn variant="ghost" onClick={onClose} disabled={submitting}>Cancel</WBtn>
          <WBtn variant="blue" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Asset'}
          </WBtn>
        </div>
      </WBox>
    </div>
  )
}
