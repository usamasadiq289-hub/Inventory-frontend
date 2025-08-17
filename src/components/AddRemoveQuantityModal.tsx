import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { Stock } from '../types';

interface AddRemoveQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sizes: string[], quantity: number, operation: 'add' | 'delete', date?: string) => void;
  stock?: Stock;
  action?: 'add' | 'delete';
}

export const AddRemoveQuantityModal: React.FC<AddRemoveQuantityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  stock,
  action
}) => {
  // Form state
  const [category, setCategory] = useState(stock?.category || '');
  const [subcategory, setSubcategory] = useState(stock?.subcategory || '');
  const [operation, setOperation] = useState<'add' | 'delete'>(action || 'add');
  const [sizeMode, setSizeMode] = useState<'single' | 'multiple'>('single');
  const [singleSize, setSingleSize] = useState<string>('');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [interval, setInterval] = useState<string>('');
  const [stockInQuantity, setStockInQuantity] = useState<string>('1');
  const [sizePrefix, setSizePrefix] = useState<string>(stock?.sizePrefix || '');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (stock) {
      setCategory(stock.category || '');
      setSubcategory(stock.subcategory || '');
      setOperation(action || 'add');
      // Don't pre-fill sizes - let user select specific sizes
      setSingleSize('');
      setSizeMode(stock.sizeMode || 'single');
    }
  }, [stock, action]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stock) return;

    let sizesToProcess: string[] = [];

    // Get sizes based on the mode
    if (sizeMode === 'single') {
      if (!singleSize.trim()) {
        alert('Please enter the specific sizes you want to modify');
        return;
      }
      
      sizesToProcess = singleSize.split(',')
        .map(size => {
          const trimmedSize = size.trim();
          // If user provided a size prefix, format the size with it
          if (sizePrefix && !isNaN(Number(trimmedSize))) {
            return `${sizePrefix}${trimmedSize}`;
          }
          // Otherwise use the size as-is
          return trimmedSize;
        })
        .filter(size => size.length > 0);
      
      if (sizesToProcess.length === 0) {
        alert('Please enter valid sizes (comma-separated)');
        return;
      }

      // Remove duplicates
      sizesToProcess = [...new Set(sizesToProcess)];
    } else {
      // Multiple size mode
      if (!start || !end || !interval) {
        alert('Please fill in all size range fields');
        return;
      }

      const startNum = Number(start);
      const endNum = Number(end);
      const intervalNum = Number(interval);

      if (isNaN(startNum) || isNaN(endNum) || isNaN(intervalNum) || intervalNum <= 0 || endNum < startNum) {
        alert('Please enter valid range and interval values');
        return;
      }

      // Generate sizes for the range with the specified prefix
      for (let size = startNum; size <= endNum; size += intervalNum) {
        const sizeStr = sizePrefix ? `${sizePrefix}${size}` : size.toString();
        sizesToProcess.push(sizeStr);
      }
      // Include end value if it fits perfectly in the interval
      if ((endNum - startNum) % intervalNum === 0) {
        const endSizeStr = sizePrefix ? `${sizePrefix}${endNum}` : endNum.toString();
        if (!sizesToProcess.includes(endSizeStr)) {
          sizesToProcess.push(endSizeStr);
        }
      }

      if (sizesToProcess.length === 0) {
        alert('No valid sizes generated from the range');
        return;
      }
    }

    // Validate all sizes exist in stock
    const invalidSizes = sizesToProcess.filter(size => !stock.sizes.includes(size));
    if (invalidSizes.length > 0) {
      alert(`Error: The following sizes don't exist in stock: ${invalidSizes.join(', ')}\nAvailable sizes: ${stock.sizes.join(', ')}`);
      return;
    }

    const stockInQuantityNum = Number(stockInQuantity);
    if (stockInQuantityNum <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    onSave(sizesToProcess, stockInQuantityNum, operation, selectedDate);
    onClose();
  };

  if (!isOpen || !stock) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-6xl w-full bg-white rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-xl font-semibold">
                {operation === 'add' ? 'Add Stock Quantity' : 'Remove Stock Quantity'}
              </Dialog.Title>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-50"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory
                  </label>
                  <input
                    type="text"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 bg-gray-50"
                    disabled
                  />
                </div>
              </div>

              {/* Prefix and Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size Prefix for New Sizes (Optional)
                    <span className="text-gray-500 text-xs ml-1">(e.g., RU, TY, UX)</span>
                  </label>
                  <input
                    type="text"
                    value={sizePrefix}
                    onChange={(e) => setSizePrefix(e.target.value.toUpperCase())}
                    placeholder="Enter prefix like RU, TY, UX..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    maxLength={5}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If provided, sizes will be formatted as {sizePrefix || 'PREFIX'}40, {sizePrefix || 'PREFIX'}42, etc.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Stock Size Prefix
                  </label>
                  <div className="w-full p-3 bg-gray-50 border rounded-lg text-gray-600">
                    {stock.sizePrefix || 'No prefix set'}
                  </div>
                </div>
              </div>

              {/* Available Sizes */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Sizes in Stock
                </label>
                <div className="text-sm text-gray-600 break-words">
                  {stock.sizes.join(', ')}
                </div>
              </div>

              {/* Operation and Mode Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Quantity Operation
                  </label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value={operation}
                        checked={true}
                        onChange={() => {}} // No-op since it's determined by the action prop
                        className={`form-radio ${operation === 'add' ? 'text-green-600' : 'text-red-600'}`}
                        disabled
                      />
                      <span className="ml-2 capitalize">{operation} Quantity</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Operation type is determined by the action you selected
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Size Mode
                  </label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="single"
                        checked={sizeMode === 'single'}
                        onChange={() => setSizeMode('single')}
                        className="form-radio"
                      />
                      <span className="ml-2">Individual Sizes</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="multiple"
                        checked={sizeMode === 'multiple'}
                        onChange={() => setSizeMode('multiple')}
                        className="form-radio"
                      />
                      <span className="ml-2">Size Range</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Size Input Section */}
              {sizeMode === 'single' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sizes (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={singleSize}
                      onChange={(e) => setSingleSize(e.target.value)}
                      placeholder={`Enter specific sizes (e.g., ${stock.sizes.slice(0,2).join(', ')})`}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter only the specific sizes you want to modify, separated by commas</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity (per size)
                    </label>
                    <input
                      type="number"
                      value={stockInQuantity}
                      onChange={(e) => setStockInQuantity(e.target.value)}
                      min="1"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start
                    </label>
                    <input
                      type="number"
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End
                    </label>
                    <input
                      type="number"
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interval
                    </label>
                    <input
                      type="number"
                      value={interval}
                      onChange={(e) => setInterval(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity (per size)
                    </label>
                    <input
                      type="number"
                      value={stockInQuantity}
                      onChange={(e) => setStockInQuantity(e.target.value)}
                      min="1"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              )}

              {/* Date and Stock Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Select the date for this stock transaction
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Sizes in Stock
                  </label>
                  <input
                    type="number"
                    value={stock?.sizes?.length || 0}
                    className="w-full p-3 border rounded-lg bg-gray-50"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Creation Date
                  </label>
                  <input
                    type="date"
                    value={(() => {
                      try {
                        if (stock?.stockIn) {
                          const date = stock.stockIn instanceof Date 
                            ? stock.stockIn 
                            : new Date(stock.stockIn);
                          
                          if (!isNaN(date.getTime())) {
                            return date.toISOString().split('T')[0];
                          }
                        }
                        return '';
                      } catch (error) {
                        return '';
                      }
                    })()}
                    className="w-full p-3 border rounded-lg bg-gray-50"
                    disabled
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-3 text-sm font-medium text-white rounded-lg ${
                    operation === 'add' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {operation === 'add' ? 'Add Quantity' : 'Remove Quantity'}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
