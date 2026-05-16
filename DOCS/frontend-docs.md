# BARBERSHOP POS - Development Blueprint (English)

## 📋 Project Overview

**Project Name:** Barberi POS (Point of Sale for Barbershop)

**Tech Stack:**
- Frontend: React + Vite + Tailwind CSS
- Backend: Django (already ready)
- State Management: Zustand
- HTTP Client: Axios
- Notifications: React Hot Toast

---

## 🎯 Core Features (Priority Order)

### 1. Offline Mode & Sync
| Feature | Status | Priority |
|---------------------------|
| Red "OFFLINE MODE" banner in header | ⬜ | 🔴 Required |
| WiFi broken icon | ⬜ | 🔴 Required |
| Auto-save to localStorage every 5 seconds | ⬜ | 🔴 Required |
| Recovery popup after crash | ⬜ | 🔴 Required |
| Notification for pending sync transactions | ⬜ | 🟡 Required |

### 2. Search & Stock Management
| Feature | Status | Priority |
|---------|--------|----------|
| Red "Remaining X" text for low stock | ⬜ | 🔴 Required |
| Prevent "+" button when exceeding stock | ⬜ | 🔴 Required |
| Popup "Stock only X" | ⬜ | 🔴 Required |

### 3. Keyboard Shortcuts
| Shortcut | Function | Status | Priority |
|----------|----------|--------|----------|
| F1 | Focus search / select item | ⬜ | 🟢 Nice to have |
| F2 | Pay / checkout | ⬜ | 🟢 Nice to have |
| F3 | Cancel | ⬜ | 🟢 Nice to have |
| Enter | Calculate total | ⬜ | 🟢 Nice to have |
| ESC | Clear item from cart | ⬜ | 🟢 Nice to have |
    
---

## 📁 Final Folder Structure

```
barberi-frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── OfflineBanner.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── ShortcutsHelper.jsx
│   │   ├── cart/
│   │   │   ├── CartPanel.jsx
│   │   │   ├── CartItem.jsx
│   │   │   └── QuantityInput.jsx
│   │   ├── products/
│   │   │   ├── ProductGrid.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   └── ProductSearch.jsx
│   │   └── offline/
│   │       ├── SyncQueueModal.jsx
│   │       └── RecoveryPopup.jsx
│   ├── hooks/
│   │   ├── useOfflineSync.js
│   │   ├── useAutoSave.js
│   │   ├── useKeyboardShortcuts.js
│   │   └── useLowStockAlert.js
│   ├── stores/
│   │   ├── cartStore.js
│   │   ├── uiStore.js
│   │   ├── itemStore.js
│   │   └── barberStore.js
│   ├── services/
│   │   ├── api.js
│   │   ├── indexedDB.js
│   │   └── syncService.js
│   ├── layouts/
│   │   └── MainLayout.jsx
│   ├── pages/
│   │   ├── Checkout.jsx
│   │   ├── History.jsx
│   │   └── Reports.jsx
│   ├── utils/
│   │   ├── constants.js
│   │   └── formatters.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── .env.example
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🔧 Complete Dependencies List

### Core (Required)
```bash
npm install react-router-dom axios zustand react-hot-toast
```

### Offline & Sync
```bash
npm install @tanstack/react-query idb
```

### UI Components
```bash
npm install @headlessui/react @heroicons/react lucide-react
npm install @tailwindcss/forms @tailwindcss/typography
```

### Keyboard & Form
```bash
npm install react-hotkeys-hook react-hook-form zod @hookform/resolvers
```

### Utility
```bash
npm install date-fns clsx
```

### Development
```bash
npm install -D @testing-library/react @testing-library/jest-dom vitest
```

### One-Command Install
```bash
npm install react-router-dom axios zustand react-hot-toast @tanstack/react-query idb @headlessui/react @heroicons/react lucide-react @tailwindcss/forms @tailwindcss/typography react-hotkeys-hook react-hook-form zod @hookform/resolvers date-fns clsx
```

---

## 🌐 API Endpoints (Backend)

| Endpoint | Method | Function | Used In |
|----------|--------|----------|---------|
| `/api/v1/barbers/` | GET | List barbers | CartPanel |
| `/api/v1/items/?type=PRODUCT` | GET | List products | ProductGrid |
| `/api/v1/items/?type=SERVICE` | GET | List services | ProductGrid |
| `/api/v1/checkout` | POST | Process transaction | CartPanel |
| `/api/v1/transactions/{id}/void` | PATCH | Void transaction | History page |
| `/api/v1/reports/commissions` | GET | Commission report | Reports page |

---

## 📦 Store Structure (Zustand)

### cartStore.js
```javascript
{
  items: [],           // { id, name, price, quantity, type, stock }
  barberId: null,
  discount: 0,
  setBarber: (id) => {},
  addItem: (item) => {},
  updateQuantity: (id, delta) => {},
  removeItem: (id) => {},
  setDiscount: (value) => {},
  clearCart: () => {},
  getTotal: () => number,
  getSubtotal: () => number
}
```

### itemStore.js
```javascript
{
  items: { services: [], products: [] },
  loading: false,
  fetchItems: async () => {}
}
```

### barberStore.js
```javascript
{
  barbers: [],
  selectedBarber: null,
  loading: false,
  fetchBarbers: async () => {},
  setSelectedBarber: (id) => {}
}
```

### uiStore.js
```javascript
{
  isOffline: false,
  syncQueue: [],
  showRecoveryPopup: false,
  pendingTransaction: null,
  setOffline: (status) => {},
  addToSyncQueue: (transaction) => {},
  processSyncQueue: async () => {}
}
```

---

## 🚀 Development Phases

### Phase 1: Setup & Backend Connection (Day 1 - 3 hours)
- [ ] Create Vite + React project
- [ ] Setup Tailwind CSS v4
- [ ] Install dependencies
- [ ] Setup axios + API service
- [ ] Test backend connection
- [ ] Create basic layout (Header + 2 columns)

### Phase 2: Core Checkout Flow (Day 2 - 5 hours)
- [ ] Fetch & display items (ProductGrid, ProductCard)
- [ ] Implement cartStore (Zustand with persist)
- [ ] Create CartPanel component
- [ ] Add barber selection
- [ ] Implement checkout API call
- [ ] Add error handling & toast notifications

### Phase 3: Polish & Edge Cases (Day 3 - 4 hours)
- [ ] Low stock indicator (red text for stock < 5)
- [ ] Prevent quantity exceeding stock
- [ ] Loading states & spinner
- [ ] Form validation with react-hook-form + zod
- [ ] Manual testing all scenarios

### Phase 4: Offline Mode (Day 4 - 4 hours)
- [ ] Setup IndexedDB (idb or dexie)
- [ ] Implement useOfflineSync hook
- [ ] Offline banner component
- [ ] Auto-save every 5 seconds
- [ ] Recovery popup on crash
- [ ] Sync queue modal

### Phase 5: Bonus Features (Day 5 - 3 hours)
- [ ] Keyboard shortcuts (F1, F2, F3, ESC, Enter)
- [ ] Shortcuts helper toolbar
- [ ] History page (with void transaction)
- [ ] Reports page (commission)

---

## 🧪 Testing Checklist

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | Select barber | Barber ID saved | ⬜ |
| 2 | Click service item | Added to cart | ⬜ |
| 3 | Click product item | Added to cart | ⬜ |
| 4 | Increase quantity (+) | Quantity +1, not exceeding stock | ⬜ |
| 5 | Decrease quantity (-) | Quantity -1, item removed at 0 | ⬜ |
| 6 | Input discount | Total decreases | ⬜ |
| 7 | Pay without selecting barber | Error toast | ⬜ |
| 8 | Pay with empty cart | Error toast | ⬜ |
| 9 | Successful checkout | Success toast, cart cleared | ⬜ |
| 10 | Low stock (<5) | Red "Remaining X" text | ⬜ |
| 11 | Quantity exceeds stock | "+" button disabled / popup error | ⬜ |
| 12 | Offline mode | Red banner appears | ⬜ |
| 13 | Auto-save | Data saved every 5 seconds | ⬜ |
| 14 | Recovery popup | Appears after crash | ⬜ |
| 15 | Keyboard F2 | Direct checkout | ⬜ |

---

## 🔧 Environment Variables

```bash
# .env
VITE_API_URL=http://localhost:8000/api/v1

# .env.example (commit to git)
VITE_API_URL=
```

---

## 🛠️ Quick Setup Commands

```bash
# Create project
npm create vite@latest barberi-frontend -- --template react
cd barberi-frontend

# Install Tailwind v4
npm install tailwindcss @tailwindcss/vite

# Install all dependencies
npm install react-router-dom axios zustand react-hot-toast @tanstack/react-query idb @headlessui/react @heroicons/react lucide-react @tailwindcss/forms @tailwindcss/typography react-hotkeys-hook react-hook-form zod @hookform/resolvers date-fns clsx

# Run development server
npm run dev
```

### vite.config.js (Tailwind v4 setup)
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

### src/index.css
```css
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --font-sans: "Inter", sans-serif;
}
```

---

## 📝 Notes for Development

1. **Start with Phase 1** - Setup project first
2. **Backend assumption:** Running at `http://localhost:8000`
3. **Use Tailwind v4** - Vite plugin, not PostCSS
4. **Priority:** Core checkout flow first, offline mode later
5. **Manual testing** after each phase

---

## 🎯 Definition of Done

- [ ] All scenarios in testing checklist ✅
- [ ] No errors in browser console
- [ ] Cart persistence after page refresh
- [ ] Keyboard shortcuts working (bonus)
- [ ] Offline mode & recovery working (bonus)

---

**Last Updated:** `date`
**Status:** `🚧 In Development`