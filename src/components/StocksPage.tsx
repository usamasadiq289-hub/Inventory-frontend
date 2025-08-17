import React, { useState, useEffect } from 'react';
import * as api from '../../api-service';
import { Stock } from '../types';
import { StockTable } from './StockTable';
import { StockModal } from './StockModal';

export const StocksPage: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);

  const fetchStocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStocks();
      setStocks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stocks');
    }
    setLoading(false);
  };

  useEffect(() => { fetchStocks(); }, []);

  const handleAdd = () => {
    setEditingStock(null);
    setModalOpen(true);
  };

  const handleEdit = (stock: Stock) => {
    setEditingStock(stock);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this stock?')) return;
    try {
      await api.deleteStock(id);
      fetchStocks();
    } catch (err: any) {
      alert(err.message || 'Failed to delete stock');
    }
  };

  const handleSave = async (stockData: any) => {
    console.log('StocksPage - handleSave received:', stockData); // Debug log
    
    let payload: any = {
      category: stockData.category,
      subcategory: stockData.subcategory,
      stockIn: typeof stockData.stockIn === 'string' ? stockData.stockIn : stockData.stockIn.toISOString(),
      sizeMode: stockData.sizeMode,
      stockInQuantity: stockData.stockInQuantity,
      sizePrefix: stockData.sizePrefix
    };
    if (stockData.sizeMode === 'single') {
      payload.singleSize = stockData.singleSize;
    } else if (stockData.sizeMode === 'multiple') {
      payload.start = stockData.start;
      payload.end = stockData.end;
      payload.interval = stockData.interval;
    }
    
    console.log('StocksPage - final payload:', payload); // Debug log
    
    try {
      if (editingStock && editingStock._id) {
        await api.updateStock(editingStock._id, payload);
      } else {
        try {
          await api.createStock(payload);
        } catch (error: any) {
          // If the error is a string, it's likely our custom error
          if (typeof error === 'string') {
            throw new Error(error);
          }
          // If it's an object with a message, use that
          if (error?.message) {
            throw new Error(error.message);
          }
          // If it's an axios error with response data
          if (error?.response?.data?.error) {
            throw new Error(error.response.data.error);
          }
          // Default fallback
          throw new Error('Failed to save stock. Please try again.');
        }
      }
      setModalOpen(false);
      fetchStocks();
    } catch (err: any) {
      // Show the error message to the user
      alert(err.message || 'An unexpected error occurred');
    }
  };

  return (
    <div className="p-6">
      {loading && <div className="text-gray-500">Loading stocks...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <StockTable
        stocks={stocks}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
      />
      <StockModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(data) => { handleSave(data); }}
        stock={editingStock ? { ...editingStock, stockIn: typeof editingStock.stockIn === 'string' ? editingStock.stockIn : editingStock.stockIn.toISOString() } : undefined}
        action="create"
      />
    </div>
  );
};
