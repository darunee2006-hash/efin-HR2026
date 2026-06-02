import React, { useState, useEffect } from 'react'
import { Search, X, ChevronDown, RefreshCw } from 'lucide-react'

export function Badge({ children, color = 'gray' }) {
  const colors = {
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-[#E6F9F0] text-[#5A9020]',
    purple: 'bg-purple-100 text-purple-700',
    gray: 'bg-gray-100 text-gray-600',
    indigo: 'bg-[#D0F0C0] text-[#5A9020]',
    orange: 'bg-orange-100 text-orange-700',
  }
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.gray}`}>{children}</span>
}

export function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-[#E6F9F0] text-[#7DC242]',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-[#f0fce8] text-[#7DC242]',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function Card({ title, children, action, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7DC242] focus:border-transparent outline-none"
      />
    </div>
  )
}

export function Button({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false }) {
  const variants = {
    primary: 'bg-[#7DC242] text-white hover:bg-[#5A9020] shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-gray-600 hover:bg-gray-100',
  }
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-sm',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Modal({ open, isOpen, onClose, title, children, wide = false, maxWidth }) {
  if (!open && !isOpen) return null
  const maxWidthMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', '3xl': 'max-w-3xl', '4xl': 'max-w-4xl', '5xl': 'max-w-5xl', '6xl': 'max-w-6xl' }
  const widthClass = maxWidth ? (maxWidthMap[maxWidth] || 'max-w-4xl') : (wide ? 'max-w-4xl' : 'max-w-lg')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl ${widthClass} w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export function Select({ value, onChange, options, placeholder, className = '', children, label, name, error, required }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</label>}
      <select
        value={value}
        name={name}
        onChange={onChange}
        className={`border ${error ? 'border-red-300' : 'border-gray-200'} rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7DC242] outline-none bg-white w-full ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children ? children : options?.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function Input({ label, error, required, ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && <span className="text-red-500"> *</span>}</label>}
      <input {...props} className={`w-full border ${error ? 'border-red-300' : 'border-gray-200'} rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7DC242] outline-none ${props.className || ''}`} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function Table({ columns, data, onRowClick, emptyText = 'No data' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col, i) => (
              <th key={i} className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center py-8 text-gray-400">{emptyText}</td></tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-gray-50 ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              >
                {columns.map((col, j) => (
                  <td key={j} className="py-2.5 px-3 whitespace-nowrap">{col.render ? col.render(row) : row[col.key]}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  const [internalActive, setInternalActive] = React.useState(0)
  const hasContent = tabs.some(t => t.content)
  const currentIdx = hasContent ? internalActive : null

  return (
    <div>
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab, i) => {
          const key = tab.key || i
          const isActive = hasContent ? i === currentIdx : active === tab.key
          return (
            <button
              key={key}
              onClick={() => {
                if (hasContent) setInternalActive(i)
                else onChange?.(tab.key)
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-white text-[#5A9020] shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {hasContent && tabs[currentIdx]?.content}
    </div>
  )
}

export function LoadingSpinner({ onRetry }) {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-8 h-8 border-3 border-[#C5E888] border-t-[#7DC242] rounded-full animate-spin" />
      {slow && (
        <div className="text-center mt-2">
          <p className="text-sm text-gray-400 mb-2">โหลดนานกว่าปกติ...</p>
          <button
            onClick={() => {
              if (onRetry) onRetry()
              else window.location.reload()
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E6F9F0] hover:bg-[#D0F0C0] text-[#5A9020] text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            รีเฟรช
          </button>
        </div>
      )}
    </div>
  )
}
