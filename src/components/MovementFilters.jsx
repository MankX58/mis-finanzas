export default function MovementFilters({ search, type, category, categories, onSearchChange, onTypeChange, onCategoryChange }) {
  const categoryOptions = type ? (categories[type] || []) : [...(categories.income || []), ...(categories.expense || [])]

  return (
    <div className="filters">
      <input className="filter-search" placeholder="🔍  Buscar por nota o categoría…" value={search} onChange={e => onSearchChange(e.target.value)} />
      <select className="filter-sel" value={type} onChange={e => onTypeChange(e.target.value)}>
        <option value="">Todo</option>
        <option value="income">Solo ingresos</option>
        <option value="expense">Solo gastos</option>
      </select>
      <select className="filter-sel" value={category} onChange={e => onCategoryChange(e.target.value)}>
        <option value="">Todas las categorías</option>
        {categoryOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  )
}