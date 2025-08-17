import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import { updateStock } from '../../api-service';

interface EditStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: any;
  onSubmit?: (payload?: any) => Promise<void>;  // Optional callback for parent component update
}

const EditStockModal: React.FC<EditStockModalProps> = ({
  isOpen,
  onClose,
  stock,
  onSubmit
}) => {
  // Form state
  const [category, setCategory] = useState(stock?.category || '');
  const [subcategory, setSubcategory] = useState(stock?.subcategory || '');
  const [operation, setOperation] = useState<'add' | 'delete'>('add');
  const [sizeMode, setSizeMode] = useState<'single' | 'multiple'>('single');
  const [singleSize, setSingleSize] = useState<string>('');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [interval, setInterval] = useState<string>('');
  const [stockInQuantity, setStockInQuantity] = useState<string>('1');
  const [sizePrefix, setSizePrefix] = useState<string>(stock?.sizePrefix || '');
  const [newSizePrefix, setNewSizePrefix] = useState<string>('');
  const [stockInDate, setStockInDate] = useState<string>('');

  useEffect(() => {
    if (stock) {
      setCategory(stock.category || '');
      setSubcategory(stock.subcategory || '');
      setSizePrefix(stock.sizePrefix || '');
      setNewSizePrefix(''); // Reset new prefix when stock changes
      
      // Set the stock in date
      try {
        if (stock.stockIn) {
          const date = stock.stockIn instanceof Date 
            ? stock.stockIn 
            : new Date(stock.stockIn);
          
          if (!isNaN(date.getTime())) {
            setStockInDate(date.toISOString().split('T')[0]);
          } else {
            setStockInDate('');
          }
        } else {
          setStockInDate('');
        }
      } catch (error) {
        setStockInDate('');
      }
    }
  }, [stock]);

      const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let sizesToProcess: string[] = [];

      // Get sizes based on the mode
      if (sizeMode === 'single') {
        if (!singleSize.trim()) {
          toast.error('Please enter the specific sizes you want to modify');
          return;
        }
        
        sizesToProcess = singleSize.split(',')
          .map(size => {
            const trimmedSize = size.trim();
            // If user provided a new size prefix, format the size with it
            if (newSizePrefix && !isNaN(Number(trimmedSize))) {
              return `${newSizePrefix}${trimmedSize}`;
            }
            // Otherwise use the size as-is
            return trimmedSize;
          })
          .filter(size => size.length > 0);
        
        if (sizesToProcess.length === 0) {
          toast.error('Please enter valid sizes (comma-separated)');
          return;
        }

        // Remove duplicates
        sizesToProcess = [...new Set(sizesToProcess)];
      } else {
        // Multiple size mode
        if (!start || !end || !interval) {
          toast.error('Please fill in all size range fields');
          return;
        }

        const startNum = Number(start);
        const endNum = Number(end);
        const intervalNum = Number(interval);

        if (isNaN(startNum) || isNaN(endNum) || isNaN(intervalNum) || intervalNum <= 0 || endNum < startNum) {
          toast.error('Please enter valid range and interval values');
          return;
        }

        // Generate sizes for the range with the specified prefix
        for (let size = startNum; size <= endNum; size += intervalNum) {
          const sizeStr = newSizePrefix ? `${newSizePrefix}${size}` : size.toString();
          sizesToProcess.push(sizeStr);
        }
        // Include end value if it fits perfectly in the interval
        if ((endNum - startNum) % intervalNum === 0) {
          const endSizeStr = newSizePrefix ? `${newSizePrefix}${endNum}` : endNum.toString();
          if (!sizesToProcess.includes(endSizeStr)) {
            sizesToProcess.push(endSizeStr);
          }
        }

        if (sizesToProcess.length === 0) {
          toast.error('No valid sizes generated from the range');
          return;
        }

        console.log('Sizes to process:', sizesToProcess); // Debug log
      }

      if (!stock?._id) {
        toast.error('Stock ID is required');
        return;
      }

      const stockInQuantityNum = Number(stockInQuantity);
      if (operation === 'add' && stockInQuantityNum <= 0) {
        toast.error('Stock in quantity must be greater than 0');
        return;
      }

      // Prepare the payload for string sizes
      const payload = {
        operation,
        sizeMode,
        sizes: sizesToProcess, // Use string array directly
        category: category.trim(),
        subcategory: subcategory.trim(),
        date: stockInDate || stock?.stockIn, // Use 'date' field for backend compatibility
        ...(operation === 'add' && { stockInQuantity: stockInQuantityNum }),
        ...(newSizePrefix && { sizePrefix: newSizePrefix })
      };

      console.log('Sending payload:', payload); // Debug log

      // Use updateStock for both add and delete operations
      await updateStock(stock._id, payload);
      
      if (onSubmit) {
        await onSubmit(payload);  // Notify parent component to refresh data
        toast.success(`Successfully ${operation === 'add' ? 'added' : 'deleted'} sizes!`);
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update stock');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-xl font-semibold">
                Edit Stock
              </Dialog.Title>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Size Prefix Information */}
              {sizePrefix && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">Current Size Prefix: {sizePrefix}</h3>
                  <p className="text-xs text-blue-600 mb-2">Available sizes:</p>
                  <div className="flex flex-wrap gap-1">
                    {stock?.sizes && stock.sizes.length > 0 ? (
                      stock.sizes.map((size: any, index: number) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {size}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">No sizes available</span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                  placeholder="Enter category"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory
                </label>
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                  placeholder="Enter subcategory"
                />
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size Operation
                </label>
                <div className="flex gap-4 mb-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="add"
                      checked={operation === 'add'}
                      onChange={() => setOperation('add')}
                      className="form-radio text-green-600"
                    />
                    <span className="ml-2">Add Sizes</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="delete"
                      checked={operation === 'delete'}
                      onChange={() => setOperation('delete')}
                      className="form-radio text-red-600"
                    />
                    <span className="ml-2">Delete Sizes</span>
                  </label>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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

                {sizeMode === 'single' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Size Prefix (optional)
                      </label>
                      <input
                        type="text"
                        value={newSizePrefix}
                        onChange={(e) => setNewSizePrefix(e.target.value.toUpperCase())}
                        placeholder="e.g., RU, TY, UX"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter a prefix to add to sizes (e.g., if you enter "RU" and size "40", it becomes "RU40")
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sizes (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={singleSize}
                        onChange={(e) => setSingleSize(e.target.value)}
                        placeholder="e.g., 2, 4, 6, 8"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    {operation === 'add' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stock In Quantity (per size)
                        </label>
                        <input
                          type="number"
                          value={stockInQuantity}
                          onChange={(e) => setStockInQuantity(e.target.value)}
                          min="1"
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Size Prefix (optional)
                      </label>
                      <input
                        type="text"
                        value={newSizePrefix}
                        onChange={(e) => setNewSizePrefix(e.target.value.toUpperCase())}
                        placeholder="e.g., RU, TY, UX"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter a prefix to add to generated sizes (e.g., "RU" + range 38-42 = "RU38, RU40, RU42")
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start
                        </label>
                        <input
                          type="number"
                          value={start}
                          onChange={(e) => setStart(e.target.value)}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End
                        </label>
                        <input
                          type="number"
                          value={end}
                          onChange={(e) => setEnd(e.target.value)}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Interval
                        </label>
                        <input
                          type="number"
                          value={interval}
                          onChange={(e) => setInterval(e.target.value)}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    {operation === 'add' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stock In Quantity (per size)
                        </label>
                        <input
                          type="number"
                          value={stockInQuantity}
                          onChange={(e) => setStockInQuantity(e.target.value)}
                          min="1"
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Sizes
                  </label>
                  <input
                    type="number"
                    value={operation === 'add' ? stock?.sizes?.length || 0 : 0}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 bg-gray-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock In Date
                  </label>
                  <input
                    type="date"
                    value={stockInDate}
                    onChange={(e) => setStockInDate(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg"
                >
                  {operation === 'add' ? 'Add Sizes' : 'Delete Sizes'}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditStockModal;
