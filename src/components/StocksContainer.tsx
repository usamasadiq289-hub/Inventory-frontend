import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as api from '../../api-service';
import { Stock } from '../types';
import { StockTable } from './StockTable';
import { StockModal } from './StockModal';

export const StocksContainer: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);

  const fetchStocks = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = await api.getStocks();
      // Ensure every stock has an id (map _id to id if necessary)
      data = data.map((stock: any) => ({
        ...stock,
        id: stock.id || stock._id // prefer id, fallback to _id
      }));
      setStocks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stocks');
    }
    setLoading(false);
  };

  useEffect(() => { fetchStocks(); }, []);

  const handleAdd = () => {
    console.log("Add Stock button clicked");
    setEditingStock(null);
    setModalOpen(true);
  };

  const handleEdit = (stock: Stock) => {
    console.log("Edit Stock button clicked", stock);
    setEditingStock(stock);
    setModalOpen(true);
  };

  const handleDelete = async (id: string | undefined) => {
    console.log("Delete Stock button clicked", id);
    if (!id) {
      alert('Cannot delete: stock id is missing.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this stock?')) return;
    try {
      await api.deleteStock(id);
      fetchStocks();
    } catch (err: any) {
      alert(err.message || 'Failed to delete stock');
    }
  };

  const handleSave = async (stockData: Omit<Stock, 'id' | 'lastUpdated'>) => {
    console.log("Save Stock", stockData, editingStock);
    try {
      if (editingStock && editingStock.id) {
        await api.updateStock(editingStock.id, stockData);
        toast.success('Stock updated successfully!', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        await api.createStock(stockData);
        toast.success('Stock created successfully!', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
      setModalOpen(false);
      await fetchStocks();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save stock', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  return (
    <div className="p-6">
      <ToastContainer />
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
        onSave={handleSave}
        stock={editingStock || undefined}
        action="create"
      />
    </div>
  );
};
