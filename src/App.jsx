import { useState, useEffect } from 'react'
import { SWATCHES, DEFAULT_CATS, fmt, today, thisMonth, ld, sv } from './finance'
import TxItem from './components/TxItem'
import PieChart from './components/PieChart'
import PieLegend from './components/PieLegend'
import VasoChart from './components/VasoChart'
import MovementFilters from './components/MovementFilters'

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab,    setActiveTab]    = useState('resumen')
  const [transactions, setTransactions] = useState(() => ld('mf_tx', []))
  const [budgets,      setBudgets]      = useState(() => ld('mf_budgets', []))
  const [cats,         setCats]         = useState(() => ld('mf_cats', DEFAULT_CATS))

  // modal states
  const [txModal,     setTxModal]     = useState(false)
  const [budgetModal, setBudgetModal] = useState(false)
  const [catModal,    setCatModal]    = useState(false)

  // tx form
  const [editId,       setEditId]       = useState(null)
  const [currentType,  setCurrentType]  = useState('income')
  const [txAmount,     setTxAmount]     = useState('')
  const [txCat,        setTxCat]        = useState('')
  const [txNote,       setTxNote]       = useState('')
  const [txDate,       setTxDate]       = useState(today())

  // budget form
  const [budgetCat,    setBudgetCat]    = useState('')
  const [budgetAmount, setBudgetAmount] = useState('')

  // cat form
  const [currentCatType, setCurrentCatType] = useState('expense')
  const [catName,        setCatName]        = useState('')
  const [catColor,       setCatColor]       = useState('#82b4f5')

  // filters
  const [fSearch, setFSearch] = useState('')
  const [fType,   setFType]   = useState('')
  const [fCat,    setFCat]    = useState('')

  // cat tab in categorías section
  const [catTab, setCatTab] = useState('expense')

  // ─── PERSIST ───────────────────────────────────────────────────────────────
  useEffect(() => { sv('mf_tx',      transactions) }, [transactions])
  useEffect(() => { sv('mf_budgets', budgets)      }, [budgets])
  useEffect(() => { sv('mf_cats',    cats)          }, [cats])

  useEffect(() => {
    if (!fCat) return
    const allowedCats = fType ? (cats[fType] || []) : [...(cats.income || []), ...(cats.expense || [])]
    if (!allowedCats.some(c => c.id === fCat)) setFCat('')
  }, [fType, cats, fCat])

  // ─── DERIVED ───────────────────────────────────────────────────────────────
  const getCat = (type, id) => cats[type]?.find(c => c.id === id) || {name: id, color:'#8888a0'}

  const month = thisMonth()
  const mTx   = transactions.filter(t => t.date.startsWith(month))
  const totalInc  = mTx.filter(t => t.type === 'income').reduce((a,t) => a+t.amount, 0)
  const totalExp  = mTx.filter(t => t.type === 'expense').reduce((a,t) => a+t.amount, 0)
  const bal       = totalInc - totalExp

  const expByCat = {}
  mTx.filter(t => t.type === 'expense').forEach(t => {
    expByCat[t.category] = (expByCat[t.category] || 0) + t.amount
  })

  const recent = [...transactions].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5)

  // filtered movimientos
  const filteredTx = [...transactions]
    .sort((a,b) => b.date.localeCompare(a.date))
    .filter(t => !fType || t.type === fType)
    .filter(t => !fCat  || t.category === fCat)
    .filter(t => {
      if (!fSearch) return true
      const q = fSearch.toLowerCase()
      const c = getCat(t.type, t.category)
      return (t.note||'').toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    })

  // ─── TX MODAL ──────────────────────────────────────────────────────────────
  function openModal(id = null) {
    setEditId(id)
    if (id) {
      const tx = transactions.find(t => t.id === id)
      setCurrentType(tx.type)
      setTxAmount(tx.amount)
      setTxNote(tx.note)
      setTxDate(tx.date)
      setTxCat(tx.category)
    } else {
      setCurrentType('income')
      setTxAmount('')
      setTxNote('')
      setTxDate(today())
      const firstCat = cats['income']?.[0]?.id || ''
      setTxCat(firstCat)
    }
    setTxModal(true)
  }

  function handleSetType(t) {
    setCurrentType(t)
    const firstCat = cats[t]?.[0]?.id || ''
    setTxCat(firstCat)
  }

  function saveTx() {
    const amount = parseFloat(txAmount)
    if (!amount || amount <= 0) { alert('Ingresa un monto válido.'); return }
    if (editId) {
      setTransactions(prev => prev.map(t => t.id === editId ? {...t, type:currentType, amount, category:txCat, note:txNote, date:txDate} : t))
      setEditId(null)
    } else {
      setTransactions(prev => [...prev, {id: Date.now().toString(), type:currentType, amount, category:txCat, note:txNote, date:txDate}])
    }
    setTxModal(false)
  }

  function deleteTx(id) {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  // ─── BUDGET MODAL ──────────────────────────────────────────────────────────
  function openBudgetModal() {
    setBudgetCat(cats.expense[0]?.id || '')
    setBudgetAmount('')
    setBudgetModal(true)
  }

  function saveBudget() {
    const amount = parseFloat(budgetAmount)
    if (!amount || amount <= 0) { alert('Ingresa un monto válido.'); return }
    setBudgets(prev => {
      const i = prev.findIndex(b => b.category === budgetCat)
      if (i > -1) return prev.map((b,idx) => idx === i ? {...b, amount} : b)
      return [...prev, {id: Date.now().toString(), category: budgetCat, amount}]
    })
    setBudgetModal(false)
  }

  function deleteBudget(id) {
    setBudgets(prev => prev.filter(b => b.id !== id))
  }

  // ─── CAT MODAL ─────────────────────────────────────────────────────────────
  function openCatModal() {
    setCurrentCatType(catTab || 'expense')
    setCatName('')
    setCatColor('#82b4f5')
    setCatModal(true)
  }

  function saveCat() {
    if (!catName.trim()) { alert('Ingresa un nombre.'); return }
    const id = 'c' + Date.now()
    setCats(prev => ({
      ...prev,
      [currentCatType]: [...(prev[currentCatType] || []), {id, name: catName.trim(), color: catColor}]
    }))
    setCatModal(false)
  }

  function deleteCat(type, id) {
    const used = transactions.some(t => t.type === type && t.category === id)
    if (used && !confirm('Esta categoría tiene movimientos. ¿Eliminar de todas formas?')) return
    setCats(prev => ({...prev, [type]: prev[type].filter(c => c.id !== id)}))
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* HEADER */}
      <div className="header">
        <div>
          <h1>Mis Finanzas</h1>
          <p>Ingresos, gastos y presupuestos en un solo lugar</p>
        </div>
        <div className="header-right">
          <div className="bal-label">Balance mes</div>
          <div className={`bal-val ${bal >= 0 ? 'pos' : 'neg'}`}>{fmt(bal)}</div>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs">
        {[['resumen','📊 Resumen'],['movimientos','💸 Movimientos'],['presupuesto','🎯 Presupuesto'],['categorias','🏷 Categorías']].map(([id,label]) => (
          <button key={id} className={`tab ${activeTab===id?'active':''}`} onClick={() => setActiveTab(id)}>{label}</button>
        ))}
      </div>

      {/* MAIN */}
      <div className="main">

        {/* RESUMEN */}
        <div className={`section ${activeTab==='resumen'?'active':''}`}>
          <div className="cards-row">
            <div className="card"><div className="card-label">Ingresos</div><div className="card-value g">{fmt(totalInc)}</div></div>
            <div className="card"><div className="card-label">Gastos</div><div className="card-value r">{fmt(totalExp)}</div></div>
            <div className="card"><div className="card-label">Disponible</div><div className="card-value y">{fmt(bal)}</div></div>
          </div>
          <div className="chart-card">
            <h3>Distribución de gastos</h3>
            <div className="pie-wrap"><PieChart expByCat={expByCat} getCat={getCat} /></div>
            <PieLegend expByCat={expByCat} getCat={getCat} />
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
            <span style={{fontSize:'.88rem',fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.6px'}}>Últimos movimientos</span>
          </div>
          <div className="tx-list">
            {recent.length === 0
              ? <div className="empty"><div className="empty-icon">💳</div>Agrega tu primer movimiento con el botón +</div>
              : recent.map(tx => <TxItem key={tx.id} tx={tx} getCat={getCat} onDelete={deleteTx} onEdit={openModal} />)
            }
          </div>
        </div>

        {/* MOVIMIENTOS */}
        <div className={`section ${activeTab==='movimientos'?'active':''}`}>
          <MovementFilters
            search={fSearch}
            type={fType}
            category={fCat}
            categories={cats}
            onSearchChange={setFSearch}
            onTypeChange={setFType}
            onCategoryChange={setFCat}
          />
          <div className="filter-badge">{filteredTx.length ? `${filteredTx.length} resultado${filteredTx.length!==1?'s':''}…` : ''}</div>
          <div className="tx-list">
            {filteredTx.length === 0
              ? <div className="empty"><div className="empty-icon">🔍</div>Sin resultados para ese filtro</div>
              : filteredTx.map(tx => <TxItem key={tx.id} tx={tx} getCat={getCat} onDelete={deleteTx} onEdit={openModal} />)
            }
          </div>
        </div>

        {/* PRESUPUESTO */}
        <div className={`section ${activeTab==='presupuesto'?'active':''}`}>
          <div className="chart-card">
            <h3>Presupuesto vs Gasto — vista vaso</h3>
            <VasoChart budgets={budgets} expByCat={expByCat} getCat={getCat} />
            <div style={{display:'flex',gap:'16px',marginTop:'14px',flexWrap:'wrap'}}>
              <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'.75rem',color:'var(--muted)'}}>
                <div style={{width:'20px',height:'3px',borderTop:'2px dashed var(--muted)'}}></div> Límite del presupuesto
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'.75rem',color:'var(--muted)'}}>
                <div style={{width:'14px',height:'10px',background:'var(--muted)',borderRadius:'2px',opacity:.5}}></div> Gastado
              </div>
            </div>
          </div>
          <div className="budget-header">
            <h3>Mis presupuestos</h3>
            <button className="btn-sm" onClick={openBudgetModal}>+ Nuevo</button>
          </div>
          <div className="budget-list">
            {budgets.length === 0
              ? <div className="empty"><div className="empty-icon">🎯</div>Sin presupuestos aún</div>
              : budgets.map(b => {
                  const cat = getCat('expense', b.category)
                  const spent = expByCat[b.category] || 0
                  const pct = Math.min(spent / b.amount * 100, 100)
                  const over = spent > b.amount
                  return (
                    <div key={b.id} className="budget-item">
                      <div className="budget-item-top">
                        <div className="budget-cat"><div className="bdot" style={{background:cat.color}}></div>{cat.name}</div>
                        <div style={{display:'flex',alignItems:'center',gap:'9px'}}>
                          <div className="budget-amounts">{fmt(spent)} <span style={{color:cat.color}}>/ {fmt(b.amount)}</span></div>
                          <button className="budget-del" onClick={() => deleteBudget(b.id)}>✕</button>
                        </div>
                      </div>
                      <div className="budget-bar-bg">
                        <div className={`budget-bar-fill ${over?'over':''}`} style={{width:`${pct}%`,background:cat.color}}></div>
                      </div>
                      <div className="budget-pct" style={{color:over?'#f28b82':'#8888a0'}}>
                        {over ? '⚠ Límite superado' : `${pct.toFixed(0)}% usado`}
                      </div>
                    </div>
                  )
                })
            }
          </div>
        </div>

        {/* CATEGORÍAS */}
        <div className={`section ${activeTab==='categorias'?'active':''}`}>
          <div className="chart-card" style={{marginBottom:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
              <h3 style={{margin:0}}>Gestionar categorías</h3>
              <button className="btn-sm" onClick={openCatModal}>+ Nueva categoría</button>
            </div>
            <div className="cat-tabs">
              <button className={`cat-tab ${catTab==='expense'?'active':''}`} onClick={() => setCatTab('expense')}>Gastos</button>
              <button className={`cat-tab ${catTab==='income'?'active':''}`}  onClick={() => setCatTab('income')}>Ingresos</button>
            </div>
            <div className="cat-grid">
              {(cats[catTab]||[]).length === 0
                ? <div style={{color:'var(--muted)',fontSize:'.84rem'}}>Sin categorías. Crea una con el botón +</div>
                : (cats[catTab]||[]).map(c => (
                    <div key={c.id} className="cat-pill">
                      <div className="cat-pill-dot" style={{background:c.color}}></div>
                      {c.name}
                      <button className="cat-pill-del" onClick={() => deleteCat(catTab, c.id)} title="Eliminar">✕</button>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>

      </div>

      {/* FAB */}
      <button className="fab" onClick={() => openModal()}>+</button>

      {/* MODAL MOVIMIENTO */}
      {txModal && (
        <div className="overlay open" onClick={e => { if(e.target.classList.contains('overlay')) setTxModal(false) }}>
          <div className="modal">
            <h2>{editId ? 'Editar movimiento' : 'Nuevo movimiento'}</h2>
            <div className="fg">
              <label>Tipo</label>
              <div className="type-toggle">
                <button className={`type-btn ${currentType==='income'?'ai':''}`} onClick={() => handleSetType('income')}>↑ Ingreso</button>
                <button className={`type-btn ${currentType==='expense'?'ae':''}`} onClick={() => handleSetType('expense')}>↓ Gasto</button>
              </div>
            </div>
            <div className="fg">
              <label>Monto (COP $)</label>
              <input type="number" placeholder="0" min="0" step="100" value={txAmount} onChange={e => setTxAmount(e.target.value)} />
            </div>
            <div className="fg">
              <label>Categoría</label>
              <select value={txCat} onChange={e => setTxCat(e.target.value)}>
                {(cats[currentType]||[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Nota (opcional)</label>
              <textarea placeholder="Descripción del movimiento…" value={txNote} onChange={e => setTxNote(e.target.value)} />
            </div>
            <div className="fg">
              <label>Fecha</label>
              <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} />
            </div>
            <div className="form-actions">
              <button className="btn-cancel" onClick={() => setTxModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={saveTx}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRESUPUESTO */}
      {budgetModal && (
        <div className="overlay open" onClick={e => { if(e.target.classList.contains('overlay')) setBudgetModal(false) }}>
          <div className="modal">
            <h2>Nuevo presupuesto</h2>
            <div className="fg">
              <label>Categoría de gasto</label>
              <select value={budgetCat} onChange={e => setBudgetCat(e.target.value)}>
                {cats.expense.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Límite mensual (COP $)</label>
              <input type="number" placeholder="0" min="0" step="1000" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} />
            </div>
            <div className="form-actions">
              <button className="btn-cancel" onClick={() => setBudgetModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={saveBudget}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CATEGORÍA */}
      {catModal && (
        <div className="overlay open" onClick={e => { if(e.target.classList.contains('overlay')) setCatModal(false) }}>
          <div className="modal">
            <h2>Nueva categoría</h2>
            <div className="fg">
              <label>Tipo</label>
              <div className="type-toggle">
                <button className={`type-btn ${currentCatType==='income'?'ai':''}`} onClick={() => setCurrentCatType('income')}>↑ Ingreso</button>
                <button className={`type-btn ${currentCatType==='expense'?'ae':''}`} onClick={() => setCurrentCatType('expense')}>↓ Gasto</button>
              </div>
            </div>
            <div className="fg">
              <label>Nombre</label>
              <input type="text" placeholder="Ej: Suscripciones" value={catName} onChange={e => setCatName(e.target.value)} />
            </div>
            <div className="fg">
              <label>Color</label>
              <div className="color-row">
                <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} />
                <div className="color-swatches">
                  {SWATCHES.map(c => (
                    <div key={c} className={`swatch ${c.toLowerCase()===catColor.toLowerCase()?'sel':''}`} style={{background:c}} onClick={() => setCatColor(c)} />
                  ))}
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-cancel" onClick={() => setCatModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={saveCat}>Crear</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

