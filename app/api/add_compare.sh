#!/bin/bash
cd /workspaces/expert

# We'll add Compare mode by patching the existing page.tsx
# Strategy: Add compare state, compare button in topbar, and split-pane render

# Read current page.tsx, inject compare functionality
node -e "
const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Add compare state after other states
code = code.replace(
  'const [loadingConvs, setLoadingConvs] = useState(true);',
  \`const [loadingConvs, setLoadingConvs] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [compareResults, setCompareResults] = useState<{claude?: {text?: string; error?: string; model?: string; icon?: string; color?: string}; gpt?: {text?: string; error?: string; model?: string; icon?: string; color?: string}} | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);\`
);

// 2. Add compare send logic - modify the send function
// Find the send function and add compare branch
code = code.replace(
  'const send = useCallback(async () => {',
  \`const sendCompare = useCallback(async () => {
    if (!input.trim() || compareLoading) return;
    const q = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setInput(''); setCompareLoading(true); setCompareResults(null);
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: q }], mode }),
      });
      const data = await res.json();
      setCompareResults(data);
    } catch { setCompareResults({ claude: { error: 'Failed' }, gpt: { error: 'Failed' } }); }
    setCompareLoading(false);
  }, [input, compareLoading, mode]);

  const send = useCallback(async () => {
    if (compareMode) { sendCompare(); return; }\`
);

// 3. Add compare button in topbar - after model selector
code = code.replace(
  \`<div style={{ width: 1, height: 20, background: \"var(--border)\" }} />\`,
  \`{!isMobile && <button onClick={() => { setCompareMode(!compareMode); setCompareResults(null); }} style={{ background: compareMode ? 'rgba(192,132,252,.15)' : 'rgba(255,255,255,.03)', border: '1px solid ' + (compareMode ? 'rgba(192,132,252,.3)' : 'var(--border)'), borderRadius: 8, padding: '5px 12px', color: compareMode ? '#c084fc' : 'var(--dim)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>\\u2194 Compare</button>}
          <div style={{ width: 1, height: 20, background: \"var(--border)\" }} />\`
);

// 4. Add compare results UI - before the endRef div in the messages area
code = code.replace(
  '<div ref={endRef} />',
  \`{compareMode && compareResults && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, margin: '16px 0', animation: 'slideUp .3s ease' }}>
                {[compareResults.claude, compareResults.gpt].map((r, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.02)' }}>
                      <span style={{ fontSize: 16, color: r?.color || '#888' }}>{r?.icon || '?'}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{r?.model || (i === 0 ? 'Claude' : 'GPT-4o')}</span>
                    </div>
                    <div style={{ padding: '14px 16px', fontSize: 14, lineHeight: 1.75, maxHeight: 500, overflow: 'auto' }}>
                      {r?.error ? <span style={{ color: '#fca5a5' }}>{r.error}</span> : r?.text ? <MarkdownContent content={r.text} /> : 'No response'}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {compareMode && compareLoading && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, margin: '16px 0' }}>
                {[0, 1].map(i => (
                  <div key={i} style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Spinner />
                  </div>
                ))}
              </div>
            )}
            <div ref={endRef} />\`
);

// 5. Add sendCompare to the dependency arrays
code = code.replace(
  '}, [input, loading, messages, model.id, mode, activeConv]);',
  '}, [input, loading, messages, model.id, mode, activeConv, compareMode, sendCompare]);'
);

fs.writeFileSync('app/page.tsx', code);
console.log('page.tsx patched with Compare mode! Lines:', code.split('\\n').length);
"

echo "Done! Committing..."
git add -A && git commit -m "feat: side-by-side model comparison" && git push origin main
