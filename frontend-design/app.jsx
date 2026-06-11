/* app.jsx — composes the design canvas with all wireframe variations */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "showNotes": true,
  "accent": "azure",
  "density": "balanced"
}/*EDITMODE-END*/;

function applyTheme(theme, accent) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-accent', accent);
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => { applyTheme(t.theme, t.accent); }, [t.theme, t.accent]);
  React.useEffect(() => {
    document.documentElement.classList.toggle('hide-notes', !t.showNotes);
    document.documentElement.setAttribute('data-density', t.density);
  }, [t.showNotes, t.density]);

  return (
    <>
      <DesignCanvas>
        <DCSection id="framework" title="Framework" subtitle="Vision, AI surfaces, and information architecture">
          <DCArtboard id="overview" label="01 · system overview" width={1200} height={720}>
            <FrameworkOverview />
          </DCArtboard>
        </DCSection>

        <DCSection id="dashboard" title="Project Dashboard" subtitle="Role-aware overview · 3 directions">
          <DCArtboard id="dash-v1" label="A · command center (Linear-like)" width={1280} height={820}>
            <DashboardV1 />
          </DCArtboard>
          <DCArtboard id="dash-v2" label="B · bay-map first (spatial)" width={1280} height={820}>
            <DashboardV2 />
          </DCArtboard>
          <DCArtboard id="dash-v3" label="C · prompt-first (agentic)" width={1280} height={820}>
            <DashboardV3 />
          </DCArtboard>
        </DCSection>

        <DCSection id="asset-nav" title="Asset Detail · navigation A/B" subtitle="Same page, two chromes — how should we move through 9 sections? (recommendation: left rail)">
          <DCArtboard id="asset-tabs" label="A · top tab strip (current style)" width={1440} height={900}>
            <AssetDetail tab="overview" nav="tabs" />
          </DCArtboard>
          <DCArtboard id="asset-rail" label="B · left section rail (recommended)" width={1440} height={900}>
            <AssetDetail tab="overview" nav="rail" />
          </DCArtboard>
        </DCSection>

        <DCSection id="asset-detail" title="Asset Detail · all tabs" subtitle="Every section built for CxA / construction manager / owner · left-rail chrome">
          <DCArtboard id="t-overview" label="Overview" width={1440} height={900}>
            <AssetDetail tab="overview" nav="rail" />
          </DCArtboard>
          <DCArtboard id="t-devices" label="Devices · sub-assets" width={1440} height={900}>
            <AssetDetail tab="devices" nav="rail" />
          </DCArtboard>
          <DCArtboard id="t-checklists" label="Checklists" width={1440} height={900}>
            <AssetDetail tab="checklists" nav="rail" />
          </DCArtboard>
          <DCArtboard id="t-tests" label="Tests · functional / performance" width={1440} height={900}>
            <AssetDetail tab="tests" nav="rail" />
          </DCArtboard>
          <DCArtboard id="t-issues" label="Issues · punch list" width={1440} height={900}>
            <AssetDetail tab="issues" nav="rail" />
          </DCArtboard>
          <DCArtboard id="t-files" label="Files & documents" width={1440} height={900}>
            <AssetDetail tab="files" nav="rail" />
          </DCArtboard>
          <DCArtboard id="t-rfis" label="RFIs & submittals" width={1440} height={900}>
            <AssetDetail tab="rfis" nav="rail" />
          </DCArtboard>
          <DCArtboard id="t-history" label="History · audit log" width={1440} height={900}>
            <AssetDetail tab="history" nav="rail" />
          </DCArtboard>
          <DCArtboard id="t-linked" label="Linked · drawings / systems" width={1440} height={900}>
            <AssetDetail tab="linked" nav="rail" />
          </DCArtboard>
        </DCSection>

        <DCSection id="asset-register" title="Asset Register · list directions" subtitle="The asset list · register w/ type filter + 3 directions">
          <DCArtboard id="eq-register" label="E · register w/ type filter" width={1440} height={900}>
            <EquipmentRegister />
          </DCArtboard>
          <DCArtboard id="eq-v1" label="A · dense table + AI command" width={1280} height={820}>
            <EquipmentV1 />
          </DCArtboard>
          <DCArtboard id="eq-v2" label="B · kanban by phase" width={1280} height={820}>
            <EquipmentV2 />
          </DCArtboard>
          <DCArtboard id="eq-v3" label="C · hierarchy + detail" width={1280} height={820}>
            <EquipmentV3 />
          </DCArtboard>
        </DCSection>

        <DCSection id="checklists" title="Checklists" subtitle="Field execution + desktop configuration + templates">
          <DCArtboard id="cl-config" label="D · desktop configurator" width={1440} height={900}>
            <ChecklistConfig />
          </DCArtboard>
          <DCArtboard id="cl-templates" label="E · template library" width={1440} height={900}>
            <ChecklistTemplates />
          </DCArtboard>
          <DCArtboard id="cl-v1" label="A · mobile field, one item at a time" width={760} height={820}>
            <ChecklistsV1 />
          </DCArtboard>
          <DCArtboard id="cl-v2" label="B · desktop spreadsheet" width={1280} height={820}>
            <ChecklistsV2 />
          </DCArtboard>
          <DCArtboard id="cl-v3" label="C · AI-guided wizard" width={1280} height={820}>
            <ChecklistsV3 />
          </DCArtboard>
        </DCSection>

        <DCSection id="documents" title="Documents & Drawings" subtitle="BIM + spec library + markup/collab">
          <DCArtboard id="doc-collab" label="D · markup + RFI collab" width={1440} height={900}>
            <DrawingCollab />
          </DCArtboard>
          <DCArtboard id="doc-v1" label="A · library with AI search" width={1280} height={820}>
            <DocumentsV1 />
          </DCArtboard>
          <DCArtboard id="doc-v2" label="B · drawing viewer with pins" width={1280} height={820}>
            <DocumentsV2 />
          </DCArtboard>
          <DCArtboard id="doc-v3" label="C · revision diff" width={1280} height={820}>
            <DocumentsV3 />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Wireframe tweaks">
        <TweakSection label="Theme">
          <TweakRadio label="mode" value={t.theme} options={['light', 'dark']}
            onChange={(v) => setTweak('theme', v)} />
          <TweakSelect label="primary accent" value={t.accent}
            options={['azure', 'cobalt', 'copper', 'emerald']}
            onChange={(v) => setTweak('accent', v)} />
        </TweakSection>
        <TweakSection label="Wireframe">
          <TweakRadio label="density" value={t.density}
            options={['compact', 'balanced', 'roomy']}
            onChange={(v) => setTweak('density', v)} />
          <TweakToggle label="show margin notes" value={t.showNotes}
            onChange={(v) => setTweak('showNotes', v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
