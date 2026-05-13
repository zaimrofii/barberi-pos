import { useEffect } from 'react'

export default function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault()
        const searchInput = document.querySelector('[data-search-input]')
        if (searchInput) searchInput.focus()
      }
      if (e.key === 'F4') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('pos:open-quick-pick'))
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('pos:close-modals'))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
