import React, { useState } from 'react';
import { Archive, AlertTriangle, Package, Layers } from 'lucide-react';
import { Stock, Product } from '../types';
import { DashboardDetailsModal } from './DashboardDetailsModal'; // Import the new modal

// Define more detailed types for the stats
interface ItemGroup<T> {
  count: number;
  items: T[];
}

interface DashboardStats {
  totalStock: number;
  lowStockItems: ItemGroup<Stock>;
  mediumStockItems: ItemGroup<Stock>;
  highStockItems: ItemGroup<Stock>;
  categories: ItemGroup<string>;
  subcategories: ItemGroup<string>;
}

interface DashboardProps {
  products: Product[];
  stocks: Stock[];
}

export const Dashboard: React.FC<DashboardProps> = ({ stocks }) => {
  const [modalContent, setModalContent] = useState<{ title: string; items: (Stock | string)[] } | null>(null);

  // Calculate dashboard stats from props
  const calculateStats = (): DashboardStats => {
    const categories = Array.from(new Set(stocks.map(s => s.category)));
    const subcategories = Array.from(new Set(stocks.map(s => s.subcategory)));
    
    const lowStockItems = stocks.filter(s => s.quantity < 200);
    const mediumStockItems = stocks.filter(s => s.quantity >= 200 && s.quantity < 500);
    const highStockItems = stocks.filter(s => s.quantity >= 500);
    
    const totalStock = stocks.reduce((sum, stock) => sum + stock.quantity, 0);

    return {
      totalStock,
      categories: { count: categories.length, items: categories },
      subcategories: { count: subcategories.length, items: subcategories },
      lowStockItems: { count: lowStockItems.length, items: lowStockItems },
      mediumStockItems: { count: mediumStockItems.length, items: mediumStockItems },
      highStockItems: { count: highStockItems.length, items: highStockItems }
    };
  };

  const stats = calculateStats();

  const handleCardClick = (title: string, items: (Stock | string)[]) => {
    if (items.length > 0) {
      setModalContent({ title, items });
    }
  };

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Stock',
      value: stats.totalStock.toLocaleString(),
      icon: Archive,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      onClick: () => {},
    },
    {
      title: 'Categories',
      value: stats.categories.count,
      icon: Package,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      items: stats.categories.items,
      onClick: () => handleCardClick('All Categories', stats.categories.items),
    },
    {
      title: 'Subcategories',
      value: stats.subcategories.count,
      icon: Layers,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      items: stats.subcategories.items,
      onClick: () => handleCardClick('All Subcategories', stats.subcategories.items),
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems.count,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      items: stats.lowStockItems.items,
      onClick: () => handleCardClick('Low Stock Items (< 200)', stats.lowStockItems.items),
    },
    {
      title: 'Medium Stock Items',
      value: stats.mediumStockItems.count,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      items: stats.mediumStockItems.items,
      onClick: () => handleCardClick('Medium Stock Items (200-499)', stats.mediumStockItems.items),
    },
    {
      title: 'High Stock Items',
      value: stats.highStockItems.count,
      icon: AlertTriangle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      items: stats.highStockItems.items,
      onClick: () => handleCardClick('High Stock Items (>= 500)', stats.highStockItems.items),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow ${stat.items && stat.items.length > 0 ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={() => {
              if (stat.items && stat.items.length > 0 && stat.onClick) {
                stat.onClick();
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
            </div>
            <div className="mt-4">
              <div className={`h-2 rounded-full ${stat.color} opacity-20`}>
                <div className={`h-2 rounded-full ${stat.color} w-3/4`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <DashboardDetailsModal 
        isOpen={!!modalContent}
        onClose={() => setModalContent(null)}
        title={modalContent?.title || ''}
        items={modalContent?.items || []}
      />
    </>
  );
};