import api from './api'

/**
 * Fetch the list of barbers.
 * Returns mock data for now.
 *
 * @returns {Promise<Array>} Array of barbers.
 */
export async function getBarbers() {
  // Mock data
  const BARBERS = [
    { id: 1, name: 'Barber Ani', isActive: true },
    { id: 2, name: 'Barber Budi', isActive: true },
    { id: 3, name: 'Barber Cici', isActive: true },
    { id: 4, name: 'Barber Dodi', isActive: false },
  ]

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200))

  return BARBERS.filter((b) => b.isActive)
}

/**
 * Fetch items filtered by type (SERVICE or PRODUCT).
 * Returns mock data for now.
 *
 * @param {'SERVICE'|'PRODUCT'} type – Item type to filter by.
 * @returns {Promise<Array>} Array of items.
 */
export async function getItems(type) {
  // Mock data
  const SERVICES = [
    { id: 1, name: 'Haircut', price: 50000, type: 'SERVICE', stock: null, duration: 30, category: 'hair' },
    { id: 2, name: 'Shave', price: 30000, type: 'SERVICE', stock: null, duration: 20, category: 'beard' },
    { id: 3, name: 'Hair Wash', price: 20000, type: 'SERVICE', stock: null, duration: 15, category: 'hair' },
    { id: 4, name: 'Styling', price: 40000, type: 'SERVICE', stock: null, duration: 25, category: 'hair' },
  ]

  const PRODUCTS = [
    { id: 101, name: 'Shampoo Premium', price: 25000, type: 'PRODUCT', stock: 3, category: 'care' },
    { id: 102, name: 'Conditioner', price: 20000, type: 'PRODUCT', stock: 0, category: 'care' },
    { id: 103, name: 'Beard Oil', price: 35000, type: 'PRODUCT', stock: 8, category: 'beard' },
    { id: 104, name: 'Hair Wax', price: 15000, type: 'PRODUCT', stock: 12, category: 'hair' },
  ]

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  if (type === 'SERVICE') return SERVICES
  if (type === 'PRODUCT') return PRODUCTS
  return [...SERVICES, ...PRODUCTS]
}
  
/**
 * Create a new checkout (transaction).
 *
 * @param {Object} data – Checkout payload.
 * @param {string} data.local_id – Unique idempotency key.
 * @param {string} data.barber_id – UUID of the barber.
 * @param {number} [data.discount] – Optional discount amount.
 * @param {Array<{item_id: string, quantity: number}>} data.items – Items being purchased.
 * @returns {Promise<import('axios').AxiosResponse>} Axios response containing created transaction.
 */
export async function checkout(data) {
  return api.post('/checkout', data)
}

/**
 * Void (cancel) an existing transaction.
 *
 * @param {string} id – Transaction UUID.
 * @param {string} reason – Reason for voiding the transaction.
 * @returns {Promise<import('axios').AxiosResponse>} Axios response containing updated transaction.
 */
export async function voidTransaction(id, reason) {
  return api.patch(`/transactions/${id}/void`, { void_reason: reason })
}

/**
 * Fetch commission reports with optional filters.
 *
 * @param {Object} [params] – Query parameters.
 * @param {string} [params.barber_id] – Filter by barber UUID.
 * @param {string} [params.start_date] – Start date (ISO string or YYYY-MM-DD).
 * @param {string} [params.end_date] – End date (ISO string or YYYY-MM-DD).
 * @param {number} [params.page] – Page number for pagination.
 * @param {number} [params.per_page] – Items per page.
 * @returns {Promise<import('axios').AxiosResponse>} Axios response containing commission data.
 */
export async function getCommissionReport(params = {}) {
  return api.get('/reports/commissions', { params })
}
