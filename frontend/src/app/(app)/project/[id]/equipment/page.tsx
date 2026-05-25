'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getEquipmentForProject, type EquipmentRow } from '@/lib/equipment';

function EquipGlyph({ type }: { type?: string | null }) {
  const s = 36;
  const stroke = "currentColor";
  const sw = 1.2;
  
  if (type === "Air Handling Unit" || type === "AHU") {
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none" stroke={stroke} strokeWidth={sw}>
        <rect x="6" y="22" width="68" height="36"/>
        <line x1="20" y1="22" x2="20" y2="58"/>
        <line x1="40" y1="22" x2="40" y2="58"/>
        <line x1="60" y1="22" x2="60" y2="58"/>
        <circle cx="13" cy="40" r="5"/>
        <path d="M13 35 L13 45 M8 40 L18 40 M9.5 36.5 L16.5 43.5 M9.5 43.5 L16.5 36.5"/>
        <rect x="24" y="30" width="12" height="20" fill="none" strokeDasharray="2 2"/>
        <path d="M44 28 L56 28 M44 32 L56 32 M44 36 L56 36 M44 40 L56 40 M44 44 L56 44 M44 48 L56 48 M44 52 L56 52"/>
        <circle cx="67" cy="40" r="5"/>
        <path d="M63 40 L71 40 M67 36 L67 44"/>
        <path d="M6 22 L6 14 L24 14 M74 22 L74 14 L56 14"/>
        <path d="M6 58 L6 66 M74 58 L74 66"/>
      </svg>
    );
  }
  
  if (type === "Chiller") {
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none" stroke={stroke} strokeWidth={sw}>
        <rect x="10" y="14" width="60" height="52"/>
        <circle cx="25" cy="32" r="8"/>
        <circle cx="55" cy="32" r="8"/>
        <path d="M25 24 L25 40 M17 32 L33 32 M55 24 L55 40 M47 32 L63 32"/>
        <path d="M10 52 L70 52"/>
        <path d="M16 60 L24 60 M30 60 L38 60 M44 60 L52 60 M58 60 L66 60"/>
      </svg>
    );
  }
  
  if (type === "Pump") {
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none" stroke={stroke} strokeWidth={sw}>
        <circle cx="40" cy="40" r="18"/>
        <circle cx="40" cy="40" r="3" fill={stroke}/>
        <path d="M40 22 L40 30 M40 50 L40 58 M22 40 L30 40 M50 40 L58 40 M27 27 L33 33 M47 47 L53 53 M27 53 L33 47 M47 33 L53 27"/>
        <path d="M40 58 L40 70 L20 70 M40 58 L40 70 L60 70"/>
        <path d="M6 40 L22 40"/>
      </svg>
    );
  }
  
  if (type === "Boiler") {
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none" stroke={stroke} strokeWidth={sw}>
        <rect x="14" y="10" width="52" height="60" rx="2"/>
        <circle cx="40" cy="34" r="12"/>
        <path d="M40 28 Q34 34 40 40 Q46 34 40 28"/>
        <path d="M14 50 L66 50"/>
        <circle cx="24" cy="60" r="3"/>
        <circle cx="40" cy="60" r="3"/>
        <circle cx="56" cy="60" r="3"/>
      </svg>
    );
  }
  
  // Default equipment icon
  return (
    <svg width={s} height={s} viewBox="0 0 80 80" fill="none" stroke={stroke} strokeWidth={sw}>
      <rect x="14" y="14" width="52" height="52"/>
      <path d="M14 30 L66 30 M14 50 L66 50 M30 14 L30 66 M50 14 L50 66"/>
    </svg>
  );
}

function ProgCell({ status }: { status?: string | null }) {
  // Map status to progress value
  let v = 0;
  if (status === 'complete' || status === 'passed') {
    v = 1;
  } else if (status === 'in_progress' || status === 'in_review') {
    v = 0.5;
  } else if (status === 'failed' || status === 'blocked') {
    v = 0;
  }
  
  if (v === 0) {
    return <div className="bp-equip-cell"><div className="bp-prog bp-prog-0">—</div></div>;
  }
  if (v === 1) {
    return <div className="bp-equip-cell"><div className="bp-prog bp-prog-done">✓</div></div>;
  }
  return (
    <div className="bp-equip-cell">
      <div className="bp-prog">
        <i style={{width:`${v*100}%`}}/>
        <span className="bp-mono">{Math.round(v*100)}%</span>
      </div>
    </div>
  );
}

export default function EquipmentPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadData();
  }, [projectId]);
  
  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      
      // Load project info
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', projectId)
        .single();
      
      if (projectError) throw projectError;
      if (!projectData) {
        setError('Project not found');
        return;
      }
      
      setProject(projectData);
      
      // Load equipment
      const equipmentData = await getEquipmentForProject(projectId);
      setEquipment(equipmentData);
    } catch (err) {
      console.error('Error loading equipment:', err);
      setError('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <div className="bp-screen">
        <div className="bp-page-head">
          <div>
            <div className="bp-eyebrow">— LOADING</div>
            <h1 className="bp-h1">Equipment</h1>
          </div>
        </div>
        <div className="bp-loading">Loading equipment...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bp-screen">
        <div className="bp-page-head">
          <div>
            <div className="bp-eyebrow">— ERROR</div>
            <h1 className="bp-h1">Equipment</h1>
          </div>
        </div>
        <div className="bp-error">{error}</div>
      </div>
    );
  }
  
  return (
    <>
      <div className="bp-screen">
        <div className="bp-page-head">
          <div>
            <div className="bp-eyebrow">— PROJECT · {project?.name?.toUpperCase()} · EQUIPMENT</div>
            <h1 className="bp-h1">
              Equipment 
              <span className="bp-mono bp-dim"> [ {equipment.length} items ]</span>
            </h1>
          </div>
        </div>
        
        {equipment.length === 0 ? (
          <div className="bp-empty">
            <p>No equipment found for this project.</p>
            <p className="bp-dim">Equipment will appear here after document processing.</p>
          </div>
        ) : (
          <div className="bp-equip-table">
            <div className="bp-equip-head bp-mono">
              <div>tag</div>
              <div>type</div>
              <div>manufacturer</div>
              <div>model</div>
              <div>status</div>
            </div>
            
            {equipment.map(item => (
              <Link
                key={item.tpi_id}
                href={`/entity/${item.tpi_id}`}
                className="bp-equip-row"
              >
                <div className="bp-equip-tag bp-mono">
                  <span className="bp-equip-glyph">
                    <EquipGlyph type={item.equipment_type} />
                  </span>
                  {item.asset_tag || item.tpi_id.slice(0, 8)}
                </div>
                <div className="bp-equip-cell">
                  {item.equipment_type || <span className="bp-dim">—</span>}
                </div>
                <div className="bp-equip-cell">
                  {item.manufacturer || <span className="bp-dim">—</span>}
                </div>
                <div className="bp-equip-cell bp-mono">
                  {item.model || <span className="bp-dim">—</span>}
                </div>
                <ProgCell status={item.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .bp-screen {
          padding: 24px;
          flex: 1;
        }
        
        .bp-page-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }
        
        .bp-eyebrow {
          font-size: 12px;
          letter-spacing: 0.08em;
          opacity: 0.6;
          margin-bottom: 8px;
        }
        
        .bp-h1 {
          font-size: 32px;
          font-weight: 600;
          margin: 0;
        }
        
        .bp-mono {
          font-family: var(--font-jetbrains-mono), monospace;
        }
        
        .bp-dim {
          opacity: 0.5;
        }
        
        .bp-loading, .bp-error, .bp-empty {
          padding: 40px;
          text-align: center;
          opacity: 0.6;
        }
        
        .bp-error {
          color: var(--bp-danger);
        }
        
        .bp-equip-table {
          border: 1px solid var(--bp-border);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .bp-equip-head {
          display: grid;
          grid-template-columns: 200px 1fr 1fr 1fr 120px;
          padding: 12px 16px;
          background: var(--bp-bg-subtle);
          border-bottom: 1px solid var(--bp-border);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.6;
        }
        
        .bp-equip-row {
          display: grid;
          grid-template-columns: 200px 1fr 1fr 1fr 120px;
          padding: 16px;
          border-bottom: 1px solid var(--bp-border);
          color: inherit;
          text-decoration: none;
          transition: background 0.15s;
        }
        
        .bp-equip-row:hover {
          background: var(--bp-bg-hover);
        }
        
        .bp-equip-row:last-child {
          border-bottom: none;
        }
        
        .bp-equip-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }
        
        .bp-equip-glyph {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          opacity: 0.7;
        }
        
        .bp-equip-cell {
          display: flex;
          align-items: center;
        }
        
        .bp-prog {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 24px;
          padding: 0 8px;
          background: var(--bp-bg-subtle);
          border: 1px solid var(--bp-border);
          border-radius: 4px;
          position: relative;
          min-width: 60px;
          font-size: 12px;
        }
        
        .bp-prog i {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          background: var(--bp-primary);
          opacity: 0.2;
          border-radius: 3px;
        }
        
        .bp-prog span {
          position: relative;
          z-index: 1;
        }
        
        .bp-prog-0 {
          opacity: 0.5;
        }
        
        .bp-prog-done {
          background: var(--bp-success);
          color: white;
          border-color: var(--bp-success);
        }
      `}</style>
    </>
  );
}