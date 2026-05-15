import React, { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { User, Check, X } from 'lucide-react'
import useBarberStore from '../stores/barberStore'

const barberColors = [
  'bg-red-100',
  'bg-blue-100',
  'bg-green-100',
  'bg-purple-100',
  'bg-orange-100',
]

export default function BarberSelectionModal({ isOpen, onClose, onSelect }) {
  const { barbers, selectedBarber, setSelectedBarber } = useBarberStore()

  const handleBarberClick = (barber) => {
    setSelectedBarber(barber.id)
    onClose()
    if (onSelect) {
      onSelect(barber)  // Panggil setelah onClose
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-semibold text-gray-900 mb-4"
                >
                  Pilih Barber
                </Dialog.Title>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {barbers.map((barber, idx) => (
                    <button
                      key={barber.id}
                      onClick={() => handleBarberClick(barber)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        selectedBarber === barber.id
                          ? 'bg-success/10 text-success-dark ring-2 ring-accent'
                          : 'bg-gray-50 text-gray-800 hover:bg-success/5 hover:text-success-dark'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          barberColors[idx % barberColors.length]
                        }`}
                      >
                        <User size={20} className="text-gray-600" />
                      </div>
                      <span className="flex-1 text-left font-medium">{barber.name}</span>
                      {selectedBarber === barber.id && (
                        <Check size={18} className="text-success" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <X size={16} />
                    Batal
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
