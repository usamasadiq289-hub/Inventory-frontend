import React, { useState } from 'react';
import { FileText, Plus, Search, Filter, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { StockTransaction } from '../types';

interface StockRegisterProps {
  transactions: StockTransaction[];
  onAddTransaction: (transaction: Omit<StockTransaction, "id" | "date">) => void;
}

export const StockRegister: React.FC<StockRegisterProps> = ({
  transactions,
  onAddTransaction
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Omit<StockTransaction, "id" | "date">>({
    productId: '',
    productName: '',
    quantity: 0,
    previousQuantity: 0,
    newQuantity: 0,
    type: 'IN',
    reason: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || transaction.type === typeFilter;
    const matchesDate = !dateFilter || transaction.date.toISOString().split('T')[0] === dateFilter;
    return matchesSearch && matchesType && matchesDate;
  }).sort((a, b) => b.date.getTime() - a.date.getTime());

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'IN': return TrendingUp;
      case 'OUT': return TrendingDown;
      case 'ADJUSTMENT': return RotateCcw;
      default: return FileText;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'IN': return 'text-green-600 bg-green-100';
      case 'OUT': return 'text-red-600 bg-red-100';
      case 'ADJUSTMENT': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const totalIn = transactions
    .filter(t => t.type === 'IN')
    .reduce((sum, t) => sum + t.quantity, 0);

  const totalOut = transactions
    .filter(t => t.type === 'OUT')
    .reduce((sum, t) => sum + t.quantity, 0);

  const totalAdjustments = transactions
    .filter(t => t.type === 'ADJUSTMENT')
    .reduce((sum, t) => sum + Math.abs(t.quantity), 0);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Stock Register</h2>
              <p className="text-gray-600">Track all stock movements and transactions</p>
            </div>
          </div>
          {/* Add Transaction button now opens a modal/form, not directly calling onAddTransaction */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add Transaction</span>
          </button>
          {showAddModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-lg font-bold mb-4">Add Transaction</h2>
                {/* Minimal form for demonstration; expand as needed */}
                <input
                  className="mb-2 w-full border px-2 py-1 rounded"
                  placeholder="Product Name"
                  value={newTransaction.productName}
                  onChange={e => setNewTransaction({ ...newTransaction, productName: e.target.value })}
                />
                <input
                  className="mb-2 w-full border px-2 py-1 rounded"
                  placeholder="Quantity"
                  type="number"
                  value={newTransaction.quantity}
                  onChange={e => setNewTransaction({ ...newTransaction, quantity: Number(e.target.value) })}
                />
                <select
                  className="mb-2 w-full border px-2 py-1 rounded"
                  value={newTransaction.type}
                  onChange={e => setNewTransaction({ ...newTransaction, type: e.target.value as any })}
                >
                  <option value="IN">IN</option>
                  <option value="OUT">OUT</option>
                  <option value="ADJUSTMENT">ADJUSTMENT</option>
                </select>
                <input
                  className="mb-2 w-full border px-2 py-1 rounded"
                  placeholder="Reason"
                  value={newTransaction.reason}
                  onChange={e => setNewTransaction({ ...newTransaction, reason: e.target.value })}
                />
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                    onClick={() => setShowAddModal(false)}
                  >Cancel</button>
                  <button
                    className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
                    onClick={() => {
                      onAddTransaction(newTransaction);
                      setShowAddModal(false);
                      setNewTransaction({ productId: '', productName: '', quantity: 0, previousQuantity: 0, newQuantity: 0, type: 'IN', reason: '' });
                    }}
                  >Add</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Stock In</p>
                <p className="text-2xl font-bold text-green-700">{totalIn.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Total Stock Out</p>
                <p className="text-2xl font-bold text-red-700">{totalOut.toLocaleString()}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Adjustments</p>
                <p className="text-2xl font-bold text-blue-700">{totalAdjustments.toLocaleString()}</p>
              </div>
              <RotateCcw className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">All Types</option>
              <option value="IN">Stock In</option>
              <option value="OUT">Stock Out</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous Qty</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Qty</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.map((transaction, index) => {
              const Icon = getTransactionIcon(transaction.type);
              const colorClass = getTransactionColor(transaction.type);
              
              return (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${colorClass}`}>
                      <Icon className="h-3 w-3 mr-1" />
                      {transaction.type === 'IN' ? 'Stock In' : transaction.type === 'OUT' ? 'Stock Out' : 'Adjustment'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {transaction.type === 'OUT' ? '-' : '+'}{Math.abs(transaction.quantity).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.previousQuantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.newQuantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.date.toLocaleDateString()} {transaction.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.reference || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No transactions found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};