import React, { useState, useEffect } from 'react';
import { X, FileText, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { StockTransaction, Product } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<StockTransaction, 'id' | 'date'>) => void;
  products: Product[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  products
}) => {
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT',
    quantity: 0,
    previousQuantity: 0,
    newQuantity: 0,
    reason: '',
    reference: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        productId: '',
        productName: '',
        type: 'IN',
        quantity: 0,
        previousQuantity: 0,
        newQuantity: 0,
        reason: '',
        reference: ''
      });
    }
  }, [isOpen]);

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    // No productId on Stock, so can't match stock to product directly
    // If you want to associate stock with product, you need to design a mapping
    // For now, just set currentQuantity to 0
    const currentQuantity = 0;
    setFormData({
      ...formData,
      productId,
      productName: product?.subcategory || product?.category || '',
      previousQuantity: currentQuantity,
      newQuantity: currentQuantity
    });
  };

  const handleQuantityChange = (quantity: number) => {
    const { type, previousQuantity } = formData;
    let newQuantity = previousQuantity;
    
    if (type === 'IN') {
      newQuantity = previousQuantity + quantity;
    } else if (type === 'OUT') {
      newQuantity = previousQuantity - quantity;
    } else if (type === 'ADJUSTMENT') {
      newQuantity = quantity; // For adjustments, quantity is the new total
    }
    
    setFormData({
      ...formData,
      quantity: type === 'ADJUSTMENT' ? newQuantity - previousQuantity : quantity,
      newQuantity
    });
  };

  const handleTypeChange = (type: 'IN' | 'OUT' | 'ADJUSTMENT') => {
    setFormData({
      ...formData,
      type,
      quantity: 0,
      newQuantity: formData.previousQuantity
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IN': return TrendingUp;
      case 'OUT': return TrendingDown;
      case 'ADJUSTMENT': return RotateCcw;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'IN': return 'bg-green-100 text-green-600';
      case 'OUT': return 'bg-red-100 text-red-600';
      case 'ADJUSTMENT': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const TypeIcon = getTypeIcon(formData.type);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getTypeColor(formData.type)}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Add Stock Transaction
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['IN', 'OUT', 'ADJUSTMENT'] as const).map((type) => {
                const Icon = getTypeIcon(type);
                const isSelected = formData.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeChange(type)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mx-auto mb-1 ${
                      isSelected ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <span className={`text-xs font-medium ${
                      isSelected ? 'text-purple-600' : 'text-gray-600'
                    }`}>
                      {type === 'IN' ? 'Stock In' : type === 'OUT' ? 'Stock Out' : 'Adjustment'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product
            </label>
            <select
              value={formData.productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring focus:ring-purple-200 focus:ring-opacity-50"
            >
              <option value="">Select a product</option>
              {(products || []).map((product) => (
                <option key={product._id} value={product._id}>
                  {product.subcategory || product.category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.type === 'ADJUSTMENT' ? 'New Total Quantity' : 'Quantity'}
            </label>
            <input
              type="number"
              value={formData.type === 'ADJUSTMENT' ? formData.newQuantity : Math.abs(formData.quantity)}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder={formData.type === 'ADJUSTMENT' ? 'Enter new total quantity' : 'Enter quantity'}
              min="0"
              required
            />
            {formData.productId && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Quantity:</span>
                  <span className="font-medium">{formData.previousQuantity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">New Quantity:</span>
                  <span className="font-medium">{formData.newQuantity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Change:</span>
                  <span className={`font-medium ${
                    formData.quantity > 0 ? 'text-green-600' : formData.quantity < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {formData.quantity > 0 ? '+' : ''}{formData.quantity.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Enter reason for transaction"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference (Optional)
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Invoice number, order ID, etc."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};