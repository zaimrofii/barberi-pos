import api from './api'

/**
 * Fetch the list of barbers.
 *
 * @returns {Promise<import('axios').AxiosResponse>} Axios response containing barber array.
 */
export async function getBarbers() {
  return api.get('/barbers/')
}

/**
 * Fetch items filtered by type (SERVICE or PRODUCT).
 *
 * @param {'SERVICE'|'PRODUCT'} type – Item type to filter by.
 * @returns {Promise<import('axios').AxiosResponse>} Axios response containing item array.
 */
export async function getItems(type) {
  return api.get('/items/', { params: { type } })
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
