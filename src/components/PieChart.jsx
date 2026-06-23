import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js/auto'
import { fmt } from '../finance'

export default function PieChart({ expByCat, getCat }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }

    const labels = []
    const data = []
    const colors = []
    Object.entries(expByCat).forEach(([id, v]) => {
      const c = getCat('expense', id)
      labels.push(c.name)
      data.push(v)
      colors.push(c.color)
    })

    if (!data.length) {
      ctx.clearRect(0, 0, 300, 240)
      ctx.fillStyle = '#8888a0'
      ctx.font = '13px Segoe UI'
      ctx.textAlign = 'center'
      ctx.fillText('Sin gastos registrados', 150, 120)
      return
    }

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: '#1a1a1d', borderWidth: 3, hoverOffset: 7 }] },
      options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.label}: ${fmt(c.parsed)}` } } }, cutout: '60%' }
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [expByCat, getCat])

  return <canvas ref={canvasRef} height={240} />
}