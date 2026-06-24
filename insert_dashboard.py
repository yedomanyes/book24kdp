import sys

DASHBOARD = r"""        {/* Tab: Dashboard */}
        {activeTab === 'dashboard' && (
          <div style={{ padding: '32px 40px', overflowY: 'auto', height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column', gap: '32px', background: 'var(--bg-main)' }}>

            {/* TOP BAR */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>KDP Publishing Studio</div>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1 }}>Übersicht</h1>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'right' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <div style={{ marginTop: '2px' }}>{books.filter(b => b.bookStatus === 'uploaded').length} von {books.length} Büchern hochgeladen</div>
              </div>
            </div>

            {/* KPI CARDS */}
            {(() => {
              const total = books.length;
              const uploaded = books.filter(b => b.bookStatus === 'uploaded').length;
              const done = books.filter(b => b.bookStatus === 'done').length;
              const inProgress = books.filter(b => !b.bookStatus || b.bookStatus === 'working').length;
              const totalPagesGenerated = books.reduce((s, b) => s + Object.values(b.pagesStatus || {}).filter((x: string) => x === 'completed').length, 0);
              const thisMonth = books.filter(b => {
                if (!b.uploadedAt) return false;
                const d = new Date(b.uploadedAt);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length;
              const kpis = [
                { value: total,               label: 'Buchprojekte',    sub: 'gesamt',            accent: '#6366f1', bar: total > 0 ? uploaded / total : 0 },
                { value: uploaded,            label: 'Hochgeladen',     sub: 'auf Amazon KDP',    accent: '#22c55e', bar: total > 0 ? uploaded / total : 0 },
                { value: done,                label: 'Fertig',          sub: 'bereit zum Upload', accent: '#3b82f6', bar: total > 0 ? done / total : 0 },
                { value: totalPagesGenerated, label: 'Seiten generiert',sub: 'aller Bücher',      accent: '#a855f7', bar: Math.min(totalPagesGenerated / Math.max(total * 100, 1), 1) },
                { value: inProgress,          label: 'In Bearbeitung',  sub: 'aktive Projekte',   accent: '#f59e0b', bar: total > 0 ? inProgress / total : 0 },
                { value: thisMonth,           label: 'Diesen Monat',    sub: 'hochgeladen',       accent: '#ec4899', bar: uploaded > 0 ? thisMonth / uploaded : 0 },
              ];
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {kpis.map((k, i) => (
                    <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px 26px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: k.accent + '18', filter: 'blur(20px)', pointerEvents: 'none' }} />
                      <div style={{ fontSize: '42px', fontWeight: 900, color: k.accent, lineHeight: 1, letterSpacing: '-0.04em' }}>{k.value.toLocaleString('de-DE')}</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginTop: '8px' }}>{k.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{k.sub}</div>
                      <div style={{ marginTop: '16px', height: '3px', background: 'var(--border-color)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: (k.bar * 100) + '%', background: k.accent, borderRadius: '99px', transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* CHART + PIPELINE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px' }}>
              {/* Bar Chart */}
              {(() => {
                const now = new Date();
                type MonthItem = { label: string; fullLabel: string; count: number };
                const months: MonthItem[] = [];
                for (let i = 11; i >= 0; i--) {
                  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                  months.push({
                    label: d.toLocaleDateString('de-DE', { month: 'short' }),
                    fullLabel: d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
                    count: books.filter(b => {
                      if (!b.uploadedAt) return false;
                      const ud = new Date(b.uploadedAt);
                      return ud.getMonth() === d.getMonth() && ud.getFullYear() === d.getFullYear();
                    }).length,
                  });
                }
                const maxVal = Math.max(...months.map(m => m.count), 1);
                const totalUploaded = months.reduce((s, m) => s + m.count, 0);
                return (
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '26px 28px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '24px' }}>
                      <div>
                        <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>KDP-Uploads</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Letzte 12 Monate &middot; {totalUploaded} Bücher hochgeladen</div>
                      </div>
                      <div style={{ display: 'flex', gap: '14px', fontSize: '11px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#6366f1', display: 'inline-block' }} />Vergangen
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#22c55e', display: 'inline-block' }} />Aktuell
                        </span>
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '6px', height: '140px' }}>
                      {months.map((m, i) => {
                        const isCurrent = i === months.length - 1;
                        const pct = (m.count / maxVal) * 100;
                        return (
                          <div key={i} title={m.fullLabel + ': ' + m.count + ' Uploads'} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                            {m.count > 0 && <span style={{ fontSize: '10px', fontWeight: 800, color: isCurrent ? '#22c55e' : '#6366f1', lineHeight: 1 }}>{m.count}</span>}
                            <div style={{
                              width: '100%',
                              height: Math.max(pct, m.count > 0 ? 12 : 3) + '%',
                              minHeight: '3px',
                              borderRadius: '5px 5px 3px 3px',
                              background: isCurrent ? 'linear-gradient(180deg,#4ade80,#22c55e)' : m.count > 0 ? 'linear-gradient(180deg,#a5b4fc,#6366f1)' : 'var(--border-color)',
                              transition: 'height 0.5s ease',
                            }} />
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: isCurrent ? 700 : 400 }}>{m.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Pipeline */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '26px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>Pipeline</div>
                {(['working', 'done', 'uploaded'] as const).map(s => {
                  const cfg = {
                    working:  { label: 'In Bearbeitung', accent: '#f59e0b' },
                    done:     { label: 'Fertig',          accent: '#3b82f6' },
                    uploaded: { label: 'Hochgeladen',     accent: '#22c55e' },
                  }[s];
                  const count = books.filter(b => (b.bookStatus || 'working') === s).length;
                  const pct = books.length > 0 ? Math.round((count / books.length) * 100) : 0;
                  return (
                    <div key={s}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '7px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{cfg.label}</span>
                        <span style={{ fontSize: '22px', fontWeight: 900, color: cfg.accent, lineHeight: 1 }}>{count}</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: cfg.accent, borderRadius: '99px', transition: 'width 0.5s ease' }} />
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{pct}% aller Projekte</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOOK TABLE */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 155px 100px 100px', padding: '14px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
                {['Buchprojekt', 'Fortschritt', 'Status', 'Hochgeladen', ''].map((h, i) => (
                  <div key={i} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
                ))}
              </div>
              {books.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Noch keine Buchprojekte</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Erstelle dein erstes Buch in der Mediathek</div>
                </div>
              ) : books.map((b, idx) => {
                const status = b.bookStatus || 'working';
                const donePages = Object.values(b.pagesStatus || {}).filter((s: string) => s === 'completed').length;
                const totalPages = b.outline?.target_pages || 0;
                const pct = totalPages > 0 ? Math.round((donePages / totalPages) * 100) : 0;
                const cfg = {
                  working:  { label: 'In Bearbeitung', accent: '#f59e0b' },
                  done:     { label: 'Fertig',          accent: '#3b82f6' },
                  uploaded: { label: 'Hochgeladen',     accent: '#22c55e' },
                }[status];
                return (
                  <div key={b.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 130px 155px 100px 100px',
                    alignItems: 'center', padding: '16px 24px',
                    borderBottom: idx < books.length - 1 ? '1px solid var(--border-color)' : 'none',
                    transition: 'background 0.12s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-main)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title || 'Unbenanntes Buch'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <span style={{ padding: '1px 7px', borderRadius: '99px', background: cfg.accent + '18', color: cfg.accent, fontWeight: 600, fontSize: '10px', marginRight: '6px' }}>{cfg.label}</span>
                        {b.language === 'de' ? 'Deutsch' : 'Englisch'} &middot; {totalPages} Seiten
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '5px', background: 'var(--border-color)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: pct + '%', background: pct === 100 ? '#22c55e' : '#6366f1', borderRadius: '99px', transition: 'width 0.4s' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{pct}%</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{donePages}/{totalPages}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {(['working', 'done', 'uploaded'] as const).map(s => {
                        const sc = ({ working: '#f59e0b', done: '#3b82f6', uploaded: '#22c55e' } as Record<string,string>)[s];
                        const sl = ({ working: 'Arbeit', done: 'Fertig', uploaded: 'Upload' } as Record<string,string>)[s];
                        const isActive = status === s;
                        return (
                          <button key={s}
                            onClick={() => setBooks(prev => prev.map(bk => bk.id === b.id ? { ...bk, bookStatus: s, uploadedAt: s === 'uploaded' ? (bk.uploadedAt || new Date().toISOString()) : bk.uploadedAt } : bk))}
                            style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, border: '1.5px solid ' + (isActive ? sc : 'var(--border-color)'), background: isActive ? sc + '20' : 'transparent', color: isActive ? sc : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s' }}
                          >{sl}</button>
                        );
                      })}
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {b.uploadedAt
                        ? <><div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{new Date(b.uploadedAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}</div><div style={{ fontSize: '11px' }}>{new Date(b.uploadedAt).getFullYear()}</div></>
                        : <span style={{ opacity: 0.4 }}>—</span>
                      }
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <button onClick={() => { setActiveBookId(b.id); setActiveTab('studio'); }}
                        style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                      >Öffnen</button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

"""

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with Tab 2: Studio Layout Panel Grid
insert_before = None
for i, line in enumerate(lines):
    if '/* Tab 2: Studio Layout Panel Grid */' in line:
        insert_before = i
        break

if insert_before is None:
    print("ERROR: Could not find insertion point")
    sys.exit(1)

print(f"Inserting dashboard before line {insert_before + 1}")
new_lines = lines[:insert_before] + [DASHBOARD] + lines[insert_before:]

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Done!")
