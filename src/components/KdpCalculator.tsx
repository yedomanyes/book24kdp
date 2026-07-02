import { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Download } from 'lucide-react';

export interface KdpCalculatorProps {
  theme?: 'light' | 'dark';
}

export default function KdpCalculator(_props: KdpCalculatorProps) {
  // Simulator Inputs
  const [booksPerMonth, setBooksPerMonth] = useState<number>(18);
  const [sellingPrice, setSellingPrice] = useState<number>(12.95);
  const [salesPerBook, setSalesPerBook] = useState<number>(19);
  const [projectionMonths, setProjectionMonths] = useState<number>(1);
  const currency = '€';

  // KDP Dashboard State
  const [timeframe, setTimeframe] = useState<'Heute' | 'Gestern' | 'Diesen Monat'>('Diesen Monat');
  const [activeTab, setActiveTab] = useState<'Bestellungen' | 'KENP' | 'Tantiemen'>('Tantiemen');
  const [chartType, setChartType] = useState<'Liniendiagramm' | 'Balkendiagramm'>('Balkendiagramm');

  // Royalties calculation
  // Royalty ist abhängig vom Verkaufspreis (ca. 50% nach Abzug der Druckkosten von 2.95€)
  const marginPerSale = (sellingPrice - 2.95) / 2;
  const totalBooks = booksPerMonth * projectionMonths;
  const monthlyOrders = salesPerBook * totalBooks;
  const monthlyRoyalties = marginPerSale * monthlyOrders;
  const royaltyPerBook = marginPerSale;

  // Daily averages
  const dailyOrders = Math.floor(monthlyOrders / 30);

  // Generate 30 days of chart data
  const chartData = useMemo(() => {
    const data = [];
    let currentOrdersSum = 0;
    let currentRoyaltiesSum = 0;

    for (let i = 1; i <= 30; i++) {
      // Add some random variance (+/- 40%)
      const variance = 0.6 + (Math.random() * 0.8);
      let dayOrders = Math.round(dailyOrders * variance);
      let dayRoyalties = dayOrders * royaltyPerBook;

      // Ensure the sum doesn't exceed the target too wildly, but it's just a simulation
      data.push({
        date: `${i < 10 ? '0'+i : i} Juni`,
        Bestellungen: dayOrders,
        KENP: 0,
        Tantiemen: parseFloat(dayRoyalties.toFixed(2))
      });
      currentOrdersSum += dayOrders;
      currentRoyaltiesSum += dayRoyalties;
    }

    // Scale to exact target
    const orderScale = monthlyOrders / Math.max(1, currentOrdersSum);
    const royaltyScale = monthlyRoyalties / Math.max(1, currentRoyaltiesSum);

    return data.map(d => ({
      ...d,
      Bestellungen: Math.round(d.Bestellungen * orderScale),
      KENP: 0,
      Tantiemen: parseFloat((d.Tantiemen * royaltyScale).toFixed(2))
    }));
  }, [monthlyOrders, monthlyRoyalties, royaltyPerBook, dailyOrders]);

  const kdpBlue = '#005276';
  const kdpTeal = '#008296';
  const kdpBg = '#f2f2f2';

  const formatNumber = (num: number) => num.toLocaleString('de-DE');
  const formatCurrency = (num: number) => `${currency} ${num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Metric to display in top cards based on timeframe
  const getMetric = (type: 'orders' | 'kenp' | 'royalties') => {
    const isDay = timeframe === 'Heute' || timeframe === 'Gestern';
    const scale = isDay ? 1/30 : 1;
    
    // Add slight variance for Heute vs Gestern
    const variance = timeframe === 'Heute' ? 1.05 : (timeframe === 'Gestern' ? 0.95 : 1);

    if (type === 'orders') return Math.round(monthlyOrders * scale * variance);
    if (type === 'kenp') return 0;
    if (type === 'royalties') return monthlyRoyalties * scale * variance;
    return 0;
  };

  const currentDataKey = activeTab === 'Bestellungen' ? 'Bestellungen' : activeTab === 'KENP' ? 'KENP' : 'Tantiemen';

  return (
    <div style={{ 
      background: '#ffffff', 
      color: '#0f1111',
      fontFamily: '"Amazon Ember", Arial, sans-serif',
      width: '100%',
      minHeight: '100%'
    } as any}>
      {/* --- PARAMETER SIMULATOR (Top Bar) --- */}
      <div style={{ background: '#ffffff', color: '#0f1111', padding: '16px 16px', borderBottom: '1px solid #d5d9d9' }}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f1111', marginRight: '8px' }}>
            Simulations-Parameter:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '100px' }}>
            <label style={{ fontSize: '11px', color: '#555', fontWeight: 700 }}>Zeithorizont</label>
            <select value={projectionMonths} onChange={e => setProjectionMonths(Number(e.target.value))} style={{ background: '#fff', color: '#0f1111', border: '1px solid #d5d9d9', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', outline: 'none', cursor: 'pointer', boxShadow: '0 1px 2px rgba(15,17,17,.15)' }}>
              <option value={1}>30 Tage</option>
              <option value={12}>1 Jahr</option>
              <option value={60}>5 Jahre</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '130px' }}>
            <label style={{ fontSize: '11px', color: '#555', fontWeight: 700 }}>Bücher / Monat: <strong>{booksPerMonth}</strong></label>
            <input type="range" min="1" max="50" value={booksPerMonth} onChange={e => setBooksPerMonth(Number(e.target.value))} style={{ accentColor: '#007185', height: '4px', cursor: 'pointer' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '100px' }}>
            <label style={{ fontSize: '11px', color: '#555', fontWeight: 700 }}>Verkaufspreis</label>
            <select value={sellingPrice} onChange={e => setSellingPrice(Number(e.target.value))} style={{ background: '#fff', color: '#0f1111', border: '1px solid #d5d9d9', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', outline: 'none', cursor: 'pointer', boxShadow: '0 1px 2px rgba(15,17,17,.15)' }}>
              <option value={10.95}>10.95 {currency}</option>
              <option value={12.95}>12.95 {currency}</option>
              <option value={14.95}>14.95 {currency}</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '130px' }}>
            <label style={{ fontSize: '11px', color: '#555', fontWeight: 700 }}>Verkäufe/Buch: <strong>{salesPerBook}</strong></label>
            <input type="range" min="5" max="100" value={salesPerBook} onChange={e => setSalesPerBook(Number(e.target.value))} style={{ accentColor: '#007185', height: '4px', cursor: 'pointer' }} />
          </div>
        </div>
      </div>

      {/* --- KDP DASHBOARD CLONE --- */}
      <div style={{ background: kdpBg, padding: '16px', minHeight: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '1400px' }}>


          
          <div style={{ marginBottom: '16px' }}>
            <h1 style={{ fontFamily: 'Bookerly, serif', fontSize: '28px', fontWeight: 400, margin: '0 0 4px 0', color: '#0f1111' }}>
              Dashboard
            </h1>
            <p style={{ fontSize: '11px', color: '#555', margin: 0 }}>
              Alle Daten basieren auf der Zeitzone des Marketplace, auf dem die Bestellung aufgegeben wurde. Bitte beachten Sie, dass sich die monatlichen gelesenen KENP-Seiten ändern können. Die endgültige Anzahl steht um den 15. des Folgemonats fest. <span style={{ color: kdpTeal, textDecoration: 'none', cursor: 'pointer' }}>Erfahren Sie mehr über das Dashboard.</span>
            </p>
          </div>

          {/* Cards Section */}
          <div style={{ background: '#fff', border: '1px solid #d5d9d9', borderRadius: '4px', padding: '16px', marginBottom: '16px' }}>
            {/* Timeframe Tabs & Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #d5d9d9', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                {['Heute', 'Gestern', 'Diesen Monat'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setTimeframe(t as any)}
                    style={{ 
                      background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer',
                      color: timeframe === t ? '#0f1111' : '#555',
                      fontWeight: timeframe === t ? 700 : 400,
                      borderBottom: timeframe === t ? `2px solid ${kdpTeal}` : '2px solid transparent',
                      paddingBottom: '4px',
                      marginBottom: '-17px' // align with border
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button style={{ 
                display: 'flex', alignItems: 'center', gap: '6px',
                background: kdpTeal, color: '#fff', border: 'none', borderRadius: '4px',
                padding: '6px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
              }}>
                <Download size={14} />
                Bericht herunterladen
              </button>
            </div>

            {/* 3 Metrics */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0' }}>Geschätzte Tantiemen</h3>
                <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Bookerly, serif', margin: '0 0 2px 0' }}>
                  {formatCurrency(getMetric('royalties'))}*
                </div>
                <div style={{ fontSize: '11px', color: '#555', marginBottom: '12px' }}>({currency === '€' ? 'EUR' : 'USD'})</div>
                <div style={{ borderTop: '1px solid #d5d9d9', paddingTop: '8px' }}>
                  <span style={{ color: kdpTeal, textDecoration: 'none', fontSize: '12px', cursor: 'pointer' }}>Tantiemenschätzung anzeigen</span>
                </div>
              </div>
              
              <div style={{ flex: 1, minWidth: '150px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0' }}>Bestellungen</h3>
                <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Bookerly, serif', margin: '0 0 2px 0' }}>
                  {formatNumber(getMetric('orders'))}
                </div>
                <div style={{ fontSize: '11px', color: '#555', marginBottom: '25px' }}>Bearbeitete Bestellungen</div>
                <div style={{ borderTop: '1px solid #d5d9d9', paddingTop: '8px' }}>
                  <span style={{ color: kdpTeal, textDecoration: 'none', fontSize: '12px', cursor: 'pointer' }}>Bestellungen anzeigen</span>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '150px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px 0' }}>Gelesene KENP-Seiten</h3>
                <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Bookerly, serif', margin: '0 0 2px 0' }}>
                  {formatNumber(getMetric('kenp'))}
                </div>
                <div style={{ fontSize: '11px', color: '#555', marginBottom: '25px' }}>Gelesene Seiten</div>
                <div style={{ borderTop: '1px solid #d5d9d9', paddingTop: '8px' }}>
                  <span style={{ color: kdpTeal, textDecoration: 'none', fontSize: '12px', cursor: 'pointer' }}>Gelesene KENP-Seiten anzeigen</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div style={{ background: '#fff', border: '1px solid #d5d9d9', borderRadius: '4px', padding: '16px' }}>
            {/* Chart Tabs */}
            <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #d5d9d9', paddingBottom: '8px', marginBottom: '16px' }}>
              {['Bestellungen', 'Gelesene KENP-Seiten', 'Tantiemenschätzung'].map(t => {
                const shortT = t === 'Gelesene KENP-Seiten' ? 'KENP' : t === 'Tantiemenschätzung' ? 'Tantiemen' : 'Bestellungen';
                return (
                  <button 
                    key={t}
                    onClick={() => setActiveTab(shortT as any)}
                    style={{ 
                      background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer',
                      color: activeTab === shortT ? '#0f1111' : '#555',
                      fontWeight: activeTab === shortT ? 700 : 400,
                      borderBottom: activeTab === shortT ? `2px solid ${kdpTeal}` : '2px solid transparent',
                      paddingBottom: '4px',
                      marginBottom: '-13px'
                    }}
                  >
                    {t}
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                {projectionMonths === 1 ? 'Letzte 30 Tage' : projectionMonths === 12 ? 'Letztes 1 Jahr' : 'Letzte 5 Jahre'}
              </h2>
              <div style={{ display: 'flex', border: `1px solid ${kdpTeal}`, borderRadius: '4px', overflow: 'hidden' }}>
                {['Liniendiagramm', 'Balkendiagramm'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setChartType(t as any)}
                    style={{
                      background: chartType === t ? kdpTeal : '#fff',
                      color: chartType === t ? '#fff' : kdpTeal,
                      border: 'none', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', fontWeight: 600
                    }}
                  >
                    {chartType === t && <span style={{ marginRight: '6px' }}>✓</span>}
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'Balkendiagramm' ? (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e7e7" />
                    <XAxis dataKey="date" stroke="#555" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={30} />
                    <YAxis stroke="#555" fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f2f2f2' }} contentStyle={{ borderRadius: '4px', border: '1px solid #d5d9d9', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey={currentDataKey} fill={kdpBlue} maxBarSize={40} />
                  </BarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e7e7" />
                    <XAxis dataKey="date" stroke="#555" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={30} />
                    <YAxis stroke="#555" fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid #d5d9d9', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                    <Line type="linear" dataKey={currentDataKey} stroke={kdpTeal} strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: kdpTeal, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <span style={{ color: kdpTeal, textDecoration: 'none', fontSize: '13px', cursor: 'pointer' }}>
                {activeTab === 'Tantiemen' ? 'Tantiemenschätzung anzeigen' : activeTab === 'KENP' ? 'Gelesene KENP-Seiten anzeigen' : 'Bestellungen anzeigen'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
