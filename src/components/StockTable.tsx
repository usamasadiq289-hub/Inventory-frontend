import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Edit2, Trash2, Plus, Search, TrendingUp, TrendingDown, BookOpen } from 'lucide-react';
import { Stock, PRODUCT_CATEGORIES, CreateStockPayload } from '../types';
import { createStock, updateStock, addStockQuantity, deleteStockQuantity } from '../../api-service';
import { useNavigate } from 'react-router-dom';
import { StockModal } from './StockModal';
import EditStockModal from './EditStockModal';

interface StockTableProps {
  stocks: Stock[];
  onEdit: (stock: Stock) => void;
  onDelete: (id: string) => void;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
}

export const StockTable: React.FC<StockTableProps> = ({
  stocks,
  onEdit,
  onDelete,
  onUpdateQuantity
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<'quantity' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get unique categories from stocks (fallback to PRODUCT_CATEGORIES if empty)
  const categories = Object.keys(PRODUCT_CATEGORIES);
  const subcategories = Array.from(new Set(stocks.map(stock => stock.subcategory).filter(Boolean)));

  const navigate = useNavigate();
  // Modal state for add/delete quantity
  const [modalState, setModalState] = useState<{ open: boolean; mode: 'add' | 'delete' | 'create' | null; stock: Stock | null; isNew: boolean }>({ open: false, mode: null, stock: null, isNew: false });

  // State for edit sizes modal
  const [editSizesModalOpen, setEditSizesModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  // Handler for edit sizes modal
  const handleEditSizes = (stock: Stock) => {
    setSelectedStock(stock);
    setEditSizesModalOpen(true);
  };

  const handleEditSizesComplete = async (payload?: any) => {
    try {
      if (selectedStock?._id) {
        if (payload) {
          await updateStock(selectedStock._id, payload);
          toast.success('Stock sizes updated successfully!');
        }
        await onUpdateQuantity(selectedStock._id, 0); // Trigger a refresh
        setEditSizesModalOpen(false);
        setSelectedStock(null);
      }
    } catch (error) {
      toast.error('Failed to update stock sizes');
    }
  };

  // Handler for modal submit
  const handleModalSave = async (payload: CreateStockPayload, action?: 'add' | 'delete' | 'edit', stockId?: string) => {
    try {
      if (action === 'edit' && stockId) {
        await updateStock(stockId, { 
          category: payload.category, 
          subcategory: payload.subcategory 
        });
        toast.success('Stock updated successfully!');
      } else if ((action === 'add' || action === 'delete') && stockId) {
        let sizes: (number | string)[] = [];

        if (action === 'add' || action === 'delete') {
          // For both add and delete operations, use only the specified sizes
          if (payload.singleSize) {
            if (Array.isArray(payload.singleSize)) {
              sizes = payload.singleSize;
            } else {
              sizes = payload.singleSize.split(',').map(s => {
                const trimmed = s.trim();
                return isNaN(Number(trimmed)) ? trimmed : Number(trimmed);
              });
            }
          } else {
            // If no sizes specified, this is an error - don't default to all sizes
            throw new Error('No sizes specified for quantity operation. Please select specific sizes.');
          }
        } else if (payload.sizeMode === 'multiple' && typeof payload.start === 'number' && 
                  typeof payload.end === 'number' && typeof payload.interval === 'number') {
          for (let i = payload.start; i <= payload.end; i += payload.interval) {
            sizes.push(i);
          }
        }

        if (action === 'add') {
          const stockInQty = payload.stockInQuantity || 1;
          // Use payload.date for AddRemoveQuantityModal, fallback to payload.stockIn for CreateStockModal
          const dateParam = payload.date || payload.stockIn;
          await addStockQuantity(stockId, stockInQty, dateParam, sizes);
          toast.success('Successfully added quantity!');
        } else {
          // For delete action, always pass stockOutQuantity
          const stockOutQty = payload.stockOutQuantity || 1;
          // Use payload.date for AddRemoveQuantityModal, fallback to payload.stockIn for CreateStockModal
          const dateParam = payload.date || payload.stockIn;
          await deleteStockQuantity(stockId, stockOutQty, dateParam, sizes);
          toast.success('Successfully removed quantity!');
        }
      } else {
        // Handle singleSize properly for create operation
        let processedSingleSize: number[] | undefined;
        if (Array.isArray(payload.singleSize)) {
          processedSingleSize = payload.singleSize.map(s => typeof s === 'string' ? Number(s) : s);
        } else if (typeof payload.singleSize === 'string') {
          processedSingleSize = payload.singleSize.split(',').map(s => Number(s.trim()));
        } else {
          processedSingleSize = payload.singleSize;
        }

        await createStock({
          category: payload.category,
          subcategory: payload.subcategory,
          sizeMode: payload.sizeMode || 'single',
          stockIn: payload.stockIn || new Date().toISOString().split('T')[0],
          singleSize: processedSingleSize,
          start: payload.start,
          end: payload.end,
          interval: payload.interval,
          stockInQuantity: payload.stockInQuantity,
          sizePrefix: payload.sizePrefix
        });
        toast.success('Stock created successfully!');
      }
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
    setModalState({ open: false, mode: null, stock: null, isNew: false });
  };

  const filteredAndSortedStocks = stocks
    .filter(stock => {
      const matchesSearch =
        (typeof stock.category === 'string' && stock.category && stock.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (typeof stock.subcategory === 'string' && stock.subcategory.toLowerCase().includes(searchTerm.toLowerCase())) ||
        stock.quantity.toString().includes(searchTerm) ||
        (stock.stockIn instanceof Date
          ? stock.stockIn.toLocaleDateString()
          : new Date(stock.stockIn).toLocaleDateString()
        ).includes(searchTerm);
      const matchesCategory = !categoryFilter || stock.category === categoryFilter;
      const matchesSubcategory = !subcategoryFilter || stock.subcategory === subcategoryFilter;
      return matchesSearch && matchesCategory && matchesSubcategory;
    })
    .sort((a, b) => {
      let aValue: number | Date;
      let bValue: number | Date;
      
      if (sortBy === 'quantity') {
        aValue = a.quantity;
        bValue = b.quantity;
      } else {
        aValue = new Date(a.stockIn);
        bValue = new Date(b.stockIn);
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const getStockStatus = (quantity: number, statusThresholds?: { high: number; medium: number; low: number }) => {
    // If no custom thresholds are set, use default logic
    if (!statusThresholds || (statusThresholds.high === 0 && statusThresholds.medium === 0 && statusThresholds.low === 0)) {
      if (quantity < 200) {
        return { status: 'low', color: 'text-red-600 bg-red-100', icon: TrendingDown };
      }
      if (quantity >= 200 && quantity < 500) {
        return { status: 'medium', color: 'text-yellow-600 bg-yellow-100', icon: TrendingUp };
      }
      return { status: 'high', color: 'text-green-600 bg-green-100', icon: TrendingUp };
    }

    // Use custom thresholds
    const { high, medium, low } = statusThresholds;
    
    if (quantity >= high && high > 0) {
      return { status: 'high', color: 'text-green-600 bg-green-100', icon: TrendingUp };
    }
    if (quantity >= medium && medium > 0) {
      return { status: 'medium', color: 'text-yellow-600 bg-yellow-100', icon: TrendingUp };
    }
    if (quantity >= low && low > 0) {
      return { status: 'low', color: 'text-orange-600 bg-orange-100', icon: TrendingDown };
    }
    
    // Below all thresholds = critical
    return { status: 'critical', color: 'text-red-600 bg-red-100', icon: TrendingDown };
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Stock Management</h2>
          <button
            onClick={() => setModalState({ open: true, mode: 'create', stock: null, isNew: true })}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Stock</span>
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search stock..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={subcategoryFilter}
              onChange={e => setSubcategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Subcategories</option>
              {subcategories.map(subcat => (
                <option key={subcat} value={subcat}>{subcat}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'quantity' | 'date')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="quantity">Sort by Quantity</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <ToastContainer />
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategory</th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock In Date</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Add Quantity</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delete Quantity</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Register</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedStocks.map((stock) => {
              const { status, color, icon: StatusIcon } = getStockStatus(stock.quantity, stock.status);
              
              // Create display text for category/subcategory with prefix info
              const displayText = (() => {
                const parts = [];
                if (stock.category) parts.push(`Category: ${stock.category}`);
                if (stock.subcategory) parts.push(`Subcategory: ${stock.subcategory}`);
                if (stock.sizePrefix) parts.push(`Size Prefix: ${stock.sizePrefix}`);
                if (stock.sizeMode) parts.push(`${stock.sizeMode} size${stock.sizeMode === 'multiple' ? 's' : ''}`);
                return parts.join(' | ');
              })();

              return (
                <tr key={stock._id || `${stock.category}-${new Date(stock.stockIn).getTime()}-${stock.quantity}`}
                    className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {stock.category || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {stock.subcategory || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {stock.quantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stock.stockIn instanceof Date
                      ? stock.stockIn.toLocaleDateString()
                      : (new Date(stock.stockIn)).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stock.lastUpdated instanceof Date
                      ? stock.lastUpdated.toLocaleDateString()
                      : (new Date(stock.lastUpdated)).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${color} mb-1`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        <span className="capitalize">{status}</span>
                      </div>
                      {stock.status && (stock.status.high > 0 || stock.status.medium > 0 || stock.status.low > 0) && (
                        <div className="text-xs text-gray-500">
                          <div className="font-medium mb-1">{displayText}</div>
                          <div>Qty: {stock.quantity}+</div>
                          {stock.status.high > 0 && <div>High: ≥{stock.status.high}</div>}
                          {stock.status.medium > 0 && <div>Med: ≥{stock.status.medium}</div>}
                          {stock.status.low > 0 && <div>Low: ≥{stock.status.low}</div>}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      disabled={!stock._id}
                      onClick={() => setModalState({ open: true, mode: 'add', stock, isNew: false })}
                    >
                      Add Quantity
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      disabled={!stock._id}
                      onClick={() => setModalState({ open: true, mode: 'delete', stock, isNew: false })}
                    >
                      Delete Quantity
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {/* <button
                        onClick={() => { onEdit(stock); }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit Stock"
                        disabled={!stock._id}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button> */}
                      <button
                        onClick={() => handleEditSizes(stock)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Sizes"
                        disabled={!stock._id}
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit Sizes</span>
                      </button>
                      <button
                        onClick={() => {
                          if (stock._id) onDelete(String(stock._id));
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Stock"
                        disabled={!stock._id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        if (stock.category) {
                          const path = stock.subcategory
                            ? `/stock-history/${encodeURIComponent(stock.category)}/${encodeURIComponent(stock.subcategory)}`
                            : `/stock-history/${encodeURIComponent(stock.category)}`;
                          navigate(path);
                        }
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center"
                      title="View Register"
                      disabled={!stock.category}
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      View Register
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredAndSortedStocks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No stock records found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search terms</p>
          </div>
        )}
      </div>

            <EditStockModal
        isOpen={editSizesModalOpen}
        onClose={() => {
          setEditSizesModalOpen(false);
          setSelectedStock(null);
        }}
        onSubmit={handleEditSizesComplete}
        stock={selectedStock}
      />

      <StockModal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, mode: null, stock: null, isNew: false })}
        onSave={handleModalSave}
        action={modalState.mode as any}
        stockId={modalState.stock?._id}
        stock={modalState.stock || undefined}

      />
    </div>
  );
};