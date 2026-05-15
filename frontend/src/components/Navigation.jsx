import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShoppingBag, History, BarChart3 } from 'lucide-react';

export default function Navigation() {
  const navItems = [
    { to: '/pos', label: 'POS', icon: ShoppingBag },
    { to: '/history', label: 'Riwayat', icon: History },
    { to: '/reports', label: 'Laporan', icon: BarChart3 },
  ];

  return (
    <div className="flex items-center gap-6">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex items-center gap-2 text-sm transition ${
              isActive
                ? 'text-accent font-semibold'
                : 'text-gray-300 hover:text-white'
            }`
          }
        >
          <item.icon size={16} />
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}
