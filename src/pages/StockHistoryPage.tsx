import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStockHistory, getStocks } from '../../api-service';

interface StockHistoryEntry {
  category: string;
  subcategory: string;
  stockin?: number;
  stockout?: number;
  size?: number | string; // Support both number and string sizes
  date: string;
}

const StockHistoryPage: React.FC = () => {
  const { category, subcategory } = useParams<{ category?: string; subcategory?: string }>();
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [initialQuantity, setInitialQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Fetch initial quantity only once when component mounts
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);
  
  useEffect(() => {
    const fetchInitialQuantity = async () => {
      if (!category || !subcategory || hasFetchedInitial) return;
      
      try {
        // First try to get the stock by category and subcategory
        const stocks = await getStocks();
        const stock = stocks.find((s: { category: string; subcategory: string }) => 
          s.category === category && s.subcategory === subcategory
        );
        
        if (stock && typeof stock.initialQuantity === 'number') {
          console.log('Setting initial quantity from backend:', stock.initialQuantity);
          setInitialQuantity(stock.initialQuantity);
        } else {
          // If no initialQuantity from backend, calculate from history but only once
          console.log('No initial quantity from backend, calculating from history');
          const historyData = await getStockHistory({ category, subcategory });
          calculateInitialFromHistory(historyData);
        }
        setHasFetchedInitial(true);
      } catch (e) {
        console.error('Error fetching initial quantity:', e);
        // Don't try to recalculate if we fail
        setHasFetchedInitial(true);
      }
    };
    
    fetchInitialQuantity();
  }, [category, subcategory, hasFetchedInitial]);
  
  // Separate effect for fetching history data
  useEffect(() => {
    const fetchHistory = async () => {
      if (!category) {
        setError('Category is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching history with params:', { category, subcategory });
        const historyData = await getStockHistory({ 
          category: category,
          ...(subcategory ? { subcategory } : {})  // Only include subcategory if it exists
        });
        
        console.log('Received history data:', historyData);
        console.log('Sample history entry:', historyData[0]); // Log first entry to see structure
        if (Array.isArray(historyData)) {
          setHistory(historyData);
        } else {
          console.error('Invalid history data received:', historyData);
          setError('Invalid data received from server');
        }
      } catch (e) {
        console.error('Error fetching history:', e);
        setError(e instanceof Error ? e.message : 'Failed to fetch history data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [category, subcategory]);
  
  // Fallback function to calculate initial quantity from history if needed (only used once)
  const calculateInitialFromHistory = React.useCallback((historyData: StockHistoryEntry[]) => {
    const initialSizes: Record<string | number, number> = {};
    historyData.forEach(entry => {
      if (entry.stockin) {
        const size = entry.size ?? 0;
        if (!(size in initialSizes)) {
          const first = historyData
            .filter(e => e.size === size && e.stockin)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
          if (first) {
            initialSizes[size] = first.stockin!;
          }
        }
      }
    });
    const calculatedInitial = Object.values(initialSizes).reduce((a, b) => a + b, 0);
    console.log('Calculated initial quantity from history:', calculatedInitial);
    setInitialQuantity(calculatedInitial);
  }, []);

  // Helper to format date to yyyy-mm-dd
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Calculate stats for the selected date
  const calculateStats = (entries: StockHistoryEntry[]) => {
    const stats = entries.reduce((acc, entry) => {
      const entryDate = new Date(entry.date);
      const selectedDateObj = new Date(selectedDate + 'T23:59:59.999Z');

      // Update total stock if entry is before or on selected date
      if (entryDate <= selectedDateObj) {
        if (entry.stockin) acc.totalStock += entry.stockin;
        if (entry.stockout) acc.totalStock -= entry.stockout;
      }

      // Update today's stats if entry is on selected date
      if (formatDate(entry.date) === selectedDate) {
        if (entry.stockin) acc.todayStockIn += entry.stockin;
        if (entry.stockout) acc.todayStockOut += entry.stockout;
      }

      return acc;
    }, {
      totalStock: 0,
      todayStockIn: 0,
      todayStockOut: 0
    });

    return stats;
  };

  // Get individual history entries without grouping and calculate running stock
  const getIndividualHistory = (entries: StockHistoryEntry[]) => {
    // First filter by search term if present
    const filteredEntries = searchTerm 
      ? entries.filter(entry => entry.size?.toString().includes(searchTerm.trim()))
      : entries;

    // Calculate running stock for each transaction chronologically
    const entriesWithRunningStock: (StockHistoryEntry & { remainingStock: number })[] = [];
    
    // Group entries by size to calculate running stock per size
    const entriesBySize = new Map<string | number, StockHistoryEntry[]>();
    
    filteredEntries.forEach(entry => {
      const size = entry.size ?? 'unknown';
      if (!entriesBySize.has(size)) {
        entriesBySize.set(size, []);
      }
      entriesBySize.get(size)!.push(entry);
    });

    // For each size, calculate running stock chronologically
    entriesBySize.forEach((sizeEntries) => {
      // Sort chronologically (oldest first) for calculation
      const chronologicalEntries = sizeEntries.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      let runningStock = 0;
      
      chronologicalEntries.forEach(entry => {
        // Update running stock with this transaction
        if (entry.stockin) runningStock += entry.stockin;
        if (entry.stockout) runningStock -= entry.stockout;
        
        // Add the running stock at this point in time
        entriesWithRunningStock.push({
          ...entry,
          remainingStock: Math.max(0, runningStock)
        });
      });
    });

    // Sort the final entries for display (most recent first)
    return entriesWithRunningStock.sort((a, b) => {
      // First sort by date (most recent first)
      const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateComparison !== 0) return dateComparison;
      
      // If dates are same, sort by size
      const aSize = a.size;
      const bSize = b.size;
      
      // Helper function to convert size to number for comparison
      const getSizeAsNumber = (size: string | number | undefined): number => {
        if (typeof size === 'number') return size;
        if (typeof size === 'string') {
          // Extract number from string (e.g., "RU1" -> 1, "10" -> 10)
          const match = size.match(/(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        }
        return 0;
      };
      
      // Convert both sizes to numbers for proper sorting
      const aSizeNum = getSizeAsNumber(aSize);
      const bSizeNum = getSizeAsNumber(bSize);
      
      // Sort numerically
      return aSizeNum - bSizeNum;
    });
  };

  // Calculate stats using full history
  const stats = calculateStats(history);
  const filteredHistory = history;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Link to="/" className="text-green-600 hover:underline">← Back to Stocks</Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">Stock Register / History</h1>
      
      {/* Summary Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 bg-gray-50 rounded-lg p-4 shadow text-center">
          <div className="text-xs text-gray-500 mb-1">Initial Quantity</div>
          <div className="text-lg font-semibold">{initialQuantity}</div>
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg p-4 shadow text-center">
          <div className="text-xs text-gray-500 mb-1">Total Stock</div>
          <div className="text-lg font-semibold">{stats.totalStock}</div>
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg p-4 shadow text-center">
          <div className="text-xs text-gray-500 mb-1">Today Stock In</div>
          <div className="text-lg font-semibold">{stats.todayStockIn}</div>
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg p-4 shadow text-center">
          <div className="text-xs text-gray-500 mb-1">Today Stock Out</div>
          <div className="text-lg font-semibold">{stats.todayStockOut}</div>
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg p-4 shadow text-center">
          <div className="text-xs text-gray-500 mb-1">Select Date</div>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border px-2 py-1 rounded w-full text-center"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by size..."
            className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
      {/* <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 bg-gray-50 rounded-lg p-4 shadow text-center">
          <div className="text-xs text-gray-500 mb-1">Initial Quantity</div>
          <div className="text-lg font-semibold">{initialQuantity}</div>
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg p-4 shadow text-center">
          <div className="text-xs text-gray-500 mb-1">Total Stock</div>
          <div className="text-lg font-semibold">{stats.totalStock}</div>
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg p-4 shadow text-center">
          <div className="text-xs text-gray-500 mb-1">Today Stock In</div>
          <div className="text-lg font-semibold">{stats.todayStockIn}</div>
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg p-4 shadow text-center">
          <div className="text-xs text-gray-500 mb-1">Today Stock Out</div>
          <div className="text-lg font-semibold">{stats.todayStockOut}</div>
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg p-4 shadow text-center">
          <div className="text-xs text-gray-500 mb-1">Select Date</div>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border px-2 py-1 rounded w-full text-center"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div> */}
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <>
          {searchTerm && filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No results found for "{searchTerm}"
            </div>
          ) : (
            <>
              {Array.from(new Set(filteredHistory.map(h => h.category))).map((cat) => (
                <div key={cat} className="mb-12">
                  <h2 className="text-xl font-bold text-green-800 mb-2">Category: {cat}</h2>
                  {Array.from(new Set(filteredHistory.filter(h => h.category === cat).map(h => h.subcategory))).map(subcat => (
                    <div key={subcat || 'no-subcategory'} className="mb-6 ml-4">
                      <h3 className="font-semibold text-blue-700 mb-1">Subcategory: {subcat || 'N/A'}</h3>
                      <table className="w-full bg-white rounded shadow border mb-2">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left">Size</th>
                            <th className="px-4 py-3 text-left">Stock In</th>
                            <th className="px-4 py-3 text-left">Stock Out</th>
                            <th className="px-4 py-3 text-left">Remaining Stock</th>
                            <th className="px-4 py-3 text-left">Transaction Type</th>
                            <th className="px-4 py-3 text-left">Date & Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getIndividualHistory(
                            history.filter(h => h.category === cat && h.subcategory === subcat)
                          ).map((entry, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-4 py-2">{entry.size !== undefined ? entry.size : '-'}</td>
                              <td className="px-4 py-2 text-green-700">{entry.stockin || '-'}</td>
                              <td className="px-4 py-2 text-red-700">{entry.stockout || '-'}</td>
                              <td className="px-4 py-2 text-blue-700 font-medium">{entry.remainingStock !== undefined ? entry.remainingStock : '-'}</td>
                              <td className="px-4 py-2">
                                {entry.stockin ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                    Stock In
                                  </span>
                                ) : entry.stockout ? (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                    Stock Out
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                                    Unknown
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm">{entry.date ? (() => {
                                const date = new Date(entry.date);
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                const hours = String(date.getHours()).padStart(2, '0');
                                const minutes = String(date.getMinutes()).padStart(2, '0');
                                const seconds = String(date.getSeconds()).padStart(2, '0');
                                return (
                                  <div className="flex flex-col">
                                    <span className="font-medium">{day}/{month}/{year}</span>
                                    <span className="text-gray-500 text-xs">{hours}:{minutes}:{seconds}</span>
                                  </div>
                                );
                              })() : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default StockHistoryPage;
