export const SWATCHES = ['#f28b82','#ffb74d','#fdd663','#81c995','#4dd0e1','#82b4f5','#c58af9','#f48fb1','#a5d6a7','#80cbc4','#90caf9','#ce93d8','#ff8a65','#fff176','#b0bec5']

export const DEFAULT_CATS = {
  income:  [
    {id:'salary',   name:'Salario',    color:'#81c995'},
    {id:'freelance',name:'Freelance',  color:'#82b4f5'},
    {id:'extra',    name:'Extra',      color:'#fdd663'},
  ],
  expense: [
    {id:'comida',     name:'Comida',     color:'#f28b82'},
    {id:'transporte', name:'Transporte', color:'#ffb74d'},
    {id:'ocio',       name:'Ocio',       color:'#c58af9'},
    {id:'salud',      name:'Salud',      color:'#4dd0e1'},
    {id:'educacion',  name:'Educación',  color:'#82b4f5'},
    {id:'hogar',      name:'Hogar',      color:'#f48fb1'},
    {id:'ropa',       name:'Ropa',       color:'#fdd663'},
    {id:'otros',      name:'Otros',      color:'#8888a0'},
  ]
}

export const fmt = n => '$' + Math.abs(n).toLocaleString('es-CO', {maximumFractionDigits:0})
export const today = () => new Date().toISOString().slice(0,10)
export const thisMonth = () => new Date().toISOString().slice(0,7)

export const hexAlpha = (hex, a) => {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return `rgba(${r},${g},${b},${a})`
}

export function ld(k, d) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d }
}

export function sv(k, v) {
  localStorage.setItem(k, JSON.stringify(v))
}