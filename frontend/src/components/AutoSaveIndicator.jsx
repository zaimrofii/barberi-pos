import React from 'react'
import { Cloud, CloudOff, Loader2 } from 'lucide-react'
import useUIStore from '../stores/uiStore'

export default function AutoSaveIndicator() {
  const { saveStatus, lastSaveTime } = useUIStore()

  if (saveStatus === 'idle') return null

  const formatTime = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="fixed bottom-16 left-4 z-40 hidden md:flex items-center gap-1.5 bg-gray-900/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full shadow">
      {saveStatus === 'saving' && (
        <Loader2 size={12} className="animate-spin text-gray-300" />
      )}
      {saveStatus === 'saved' && (
        <Cloud size={12} className="text-green-400" />
      )}
      {saveStatus === 'error' && (
        <CloudOff size={12} className="text-red-400" />
      )}
      <span className="text-gray-300">
        {saveStatus === 'saving' && 'Menyimpan...'}
        {saveStatus === 'saved' && `Tersimpan ${formatTime(lastSaveTime)}`}
        {saveStatus === 'error' && 'Gagal simpan'}
      </span>
    </div>
  )
}
