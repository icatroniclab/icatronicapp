'use client'
import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

export function PhotoThumb({ url, onRemove }: { url: string; onRemove?: () => void }) {
  const [broken, setBroken] = useState(false)
  const isExternal = url.includes('google')

  return (
    <div className="relative group w-20 h-20 flex-shrink-0">
      {!broken ? (
        <a href={url} target="_blank" rel="noopener">
          <img
            src={url}
            alt=""
            className="w-20 h-20 object-cover rounded-lg border border-[#253652] hover:border-blue-500 transition"
            onError={() => setBroken(true)}
          />
        </a>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener"
          className="w-20 h-20 flex flex-col items-center justify-center rounded-lg border border-[#253652] bg-[#1e2d42] hover:border-blue-500 transition gap-1"
        >
          <ExternalLink size={18} className="text-blue-400" />
          <span className="text-[10px] text-gray-400 text-center px-1 leading-tight">
            {isExternal ? 'Ver en Google' : 'Abrir'}
          </span>
        </a>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5 hidden group-hover:flex"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      )}
    </div>
  )
}
