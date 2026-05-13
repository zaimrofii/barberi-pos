// Dev Inspector - Klik Alt+Shift untuk lihat component info
if (import.meta.env.DEV) {
  window.addEventListener('click', (e) => {
    if (e.altKey && e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      
      let target = e.target
      let componentName = 'Unknown'
      
      // Cari data-component attribute
      while (target && target !== document.body) {
        if (target.getAttribute?.('data-component')) {
          componentName = target.getAttribute('data-component')
          break
        }
        target = target.parentElement
      }
      
      console.log('📍 Component:', componentName)
      console.log('🔍 Element:', e.target)
      console.log('📁 File: cari manual dengan nama', componentName)
      
      // Copy to clipboard
      navigator.clipboard.writeText(componentName)
      alert(`Copied: ${componentName}\nCari file di VS Code (Ctrl+P)`)
    }
  })
}
