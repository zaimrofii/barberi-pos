import { useState, useEffect } from 'react'
import { getBarbers } from './services/barberService'

function App() {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState({ ok: false, message: '' })

  useEffect(() => {
    let cancelled = false

    async function testConnection() {
      try {
        const response = await getBarbers()
        if (!cancelled) {
          console.log('Barbers:', response.data)
          setStatus({ ok: true, message: 'Koneksi berhasil! Data barber diterima.' })
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Gagal menghubungi backend:', err)
          setStatus({ ok: false, message: `Gagal: ${err.message}` })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    testConnection()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          BarberShop POS
        </h1>

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500">Menghubungi backend…</p>
          </div>
        ) : (
          <div
            className={`p-4 rounded-lg ${
              status.ok
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <p className="font-medium">{status.message}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
