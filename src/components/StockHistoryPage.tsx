import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStockHistory } from '../../api-service';

import { StockHistoryEntry } from '../types';

const StockHistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    // Fetch history for this stock (by category/subcategory)
    getStockHistory({}).then((allHistory) => {
      // Filter by stock id if needed, or by category/subcategory if passed as query param
      const filtered = allHistory.filter((entry: any) => entry._id === id || entry.id === id);
      setHistory(filtered.length ? filtered : allHistory);
      setLoading(false);
    }).catch(e => {
      setError(e.message || 'Failed to fetch history');
      setLoading(false);
    });
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Link to="/" className="text-green-600 hover:underline">← Back to Stocks</Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">Stock Register / History</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
         <table className="w-full bg-white rounded-xl shadow border mt-4">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Subcategory</th>
              <th className="px-4 py-3 text-left">Size</th>
              <th className="px-4 py-3 text-left">Stock In</th>
              <th className="px-4 py-3 text-left">Stock Out</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2">{entry.category}</td>
                <td className="px-4 py-2">{entry.subcategory}</td>
                <td className="px-4 py-2">{entry.size !== undefined ? entry.size : '-'}</td>
                <td className="px-4 py-2 text-green-700">{entry.stockin || '-'}</td>
                <td className="px-4 py-2 text-red-700">{entry.stockout || '-'}</td>
                <td className="px-4 py-2">{new Date(entry.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StockHistoryPage;
