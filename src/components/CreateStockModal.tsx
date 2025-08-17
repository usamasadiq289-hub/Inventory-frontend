import React, { useState, useEffect } from 'react';
import { X, Archive } from 'lucide-react';
import { PRODUCT_CATEGORIES, CreateStockPayload } from '../types';

interface CreateStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stock: CreateStockPayload) => void;
}

export const CreateStockModal: React.FC<CreateStockModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    categoryType: 'dropdown', // 'dropdown' or 'manual'
    manualCategory: '',
    category: '',
    subcategory: '',
    stockIn: new Date().toISOString().split('T')[0],
    sizeMode: 'single' as 'single' | 'multiple',
    singleSize: '',
    start: '',
    end: '',
    interval: '',
    stockInQuantity: 1,
    sizePrefix: '', // Add size prefix field
    statusHigh: 0,
    statusMedium: 0,
    statusLow: 0
  });
  const [calculatedQuantity, setCalculatedQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        categoryType: 'dropdown',
        manualCategory: '',
        category: '',
        subcategory: '',
        stockIn: new Date().toISOString().split('T')[0],
        sizeMode: 'single',
        singleSize: '',
        start: '',
        end: '',
        interval: '',
        stockInQuantity: 1,
        sizePrefix: '', // Reset size prefix
        statusHigh: 0,
        statusMedium: 0,
        statusLow: 0
      });
      setCalculatedQuantity(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.sizeMode === 'multiple') {
      const s = Number(formData.start), e = Number(formData.end), i = Number(formData.interval);
      if (!isNaN(s) && !isNaN(e) && !isNaN(i) && i > 0 && e >= s) {
        const quantity = Math.floor((e - s) / i) + 1;
        setCalculatedQuantity(quantity);
      } else {
        setCalculatedQuantity(0);
      }
    } else if (formData.sizeMode === 'single') {
      const sizes = formData.singleSize.split(',').map(s => s.trim()).filter(s => s && !isNaN(Number(s)));
      setCalculatedQuantity(sizes.length > 0 ? sizes.length : 0);
    }
  }, [formData.sizeMode, formData.start, formData.end, formData.interval, formData.singleSize]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('CreateStockModal - Form Data:', formData); // Debug log
    
    const finalCategory = formData.categoryType === 'manual' 
      ? formData.manualCategory.trim() 
      : formData.category;
      
    if (!finalCategory) {
      alert('Please select or enter a category.');
      return;
    }

    let payload: CreateStockPayload;

    if (formData.sizeMode === 'single') {
      const sizes = formData.singleSize.split(',').map(s => s.trim()).filter(s => s && !isNaN(Number(s)));
      if (sizes.length === 0) {
        alert('Enter at least one valid size.');
        return;
      }
      
      console.log('Creating single size payload with sizePrefix:', formData.sizePrefix); // Debug log
      console.log('Final payload being passed to onSave:', { 
        category: finalCategory,
        subcategory: formData.subcategory.trim(),
        stockIn: formData.stockIn, 
        sizeMode: 'single', 
        singleSize: sizes,
        stockInQuantity: formData.stockInQuantity,
        sizePrefix: formData.sizePrefix.trim()
      }); // Debug log
      
      payload = { 
        category: finalCategory,
        subcategory: formData.subcategory.trim(),
        stockIn: formData.stockIn, 
        sizeMode: 'single', 
        singleSize: sizes, // Keep as strings, don't convert to numbers
        stockInQuantity: formData.stockInQuantity,
        sizePrefix: formData.sizePrefix.trim(),
        status: {
          high: formData.statusHigh,
          medium: formData.statusMedium,
          low: formData.statusLow
        }
      };
    } else {
      const s = Number(formData.start), e = Number(formData.end), i = Number(formData.interval);
      if (isNaN(s) || isNaN(e) || isNaN(i) || i <= 0 || e < s) {
        alert('Enter valid start, end, and interval for multiple sizes.');
        return;
      }
      payload = { 
        category: finalCategory,
        subcategory: formData.subcategory.trim(),
        stockIn: formData.stockIn, 
        sizeMode: 'multiple', 
        start: s, 
        end: e, 
        interval: i,
        stockInQuantity: formData.stockInQuantity,
        sizePrefix: formData.sizePrefix.trim(),
        status: {
          high: formData.statusHigh,
          medium: formData.statusMedium,
          low: formData.statusLow
        }
      };
    }
    
    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Archive className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Add New Stock
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Category & Subcategory */}
              <div className="space-y-4">
                <div className="flex items-center space-x-6 mb-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="categoryType"
                      value="dropdown"
                      checked={formData.categoryType === 'dropdown'}
                      onChange={() => setFormData(f => ({ ...f, categoryType: 'dropdown' }))}
                      className="mr-2"
                    />
                    Select from categories
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="categoryType"
                      value="manual"
                      checked={formData.categoryType === 'manual'}
                      onChange={() => setFormData(f => ({ ...f, categoryType: 'manual' }))}
                      className="mr-2"
                    />
                    Enter custom category
                  </label>
                </div>

                {formData.categoryType === 'dropdown' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(f => ({ ...f, category: e.target.value, subcategory: '' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      >
                        <option value="">Select a category</option>
                        {Object.keys(PRODUCT_CATEGORIES).map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                      <input
                        type="text"
                        value={formData.subcategory}
                        onChange={(e) => setFormData(f => ({ ...f, subcategory: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter subcategory (Optional)"
                        disabled={!formData.category}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                      <input
                        type="text"
                        value={formData.manualCategory}
                        onChange={(e) => setFormData(f => ({ ...f, manualCategory: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter category name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                      <input
                        type="text"
                        value={formData.subcategory}
                        onChange={(e) => setFormData(f => ({ ...f, subcategory: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter subcategory (Optional)"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Size Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Size Mode <span className="text-red-500">*</span></label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sizeMode"
                      value="single"
                      checked={formData.sizeMode === 'single'}
                      onChange={() => setFormData(f => ({ ...f, sizeMode: 'single' }))}
                      className="mr-2"
                      required
                    />
                    Single Size
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sizeMode"
                      value="multiple"
                      checked={formData.sizeMode === 'multiple'}
                      onChange={() => setFormData(f => ({ ...f, sizeMode: 'multiple' }))}
                      className="mr-2"
                      required
                    />
                    Multiple Sizes
                  </label>
                </div>
              </div>

              {/* Size Prefix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size Prefix (Optional)
                  <span className="text-gray-500 text-xs ml-1">(e.g., RU, YH, UT)</span>
                </label>
                <input
                  type="text"
                  value={formData.sizePrefix}
                  onChange={(e) => setFormData(f => ({ ...f, sizePrefix: e.target.value.toUpperCase() }))}
                  placeholder="Enter prefix like RU, YH, UT..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  maxLength={5}
                />
                <p className="text-xs text-gray-500 mt-1">
                  If provided, sizes will be formatted as {formData.sizePrefix || 'PREFIX'}1, {formData.sizePrefix || 'PREFIX'}2, etc.
                </p>
              </div>

              {/* Size Configuration */}
              {formData.sizeMode === 'single' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Size <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.singleSize}
                    onChange={e => setFormData(f => ({ ...f, singleSize: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., 41, 42, 45"
                    required
                  />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      value={formData.start} 
                      onChange={e => setFormData(f => ({ ...f, start: e.target.value }))} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" 
                      placeholder="Start" 
                      min="1" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      value={formData.end} 
                      onChange={e => setFormData(f => ({ ...f, end: e.target.value }))} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" 
                      placeholder="End" 
                      min="1" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Interval <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      value={formData.interval} 
                      onChange={e => setFormData(f => ({ ...f, interval: e.target.value }))} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" 
                      placeholder="Interval" 
                      min="1" 
                      required 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Stock Information */}
              <div className="grid grid-cols-2 gap-4">
                {/* Total Sizes Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Sizes</label>
                  <input
                    type="number"
                    value={calculatedQuantity}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-100"
                  />
                </div>

                {/* Stock In Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock In Quantity (per size) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={formData.stockInQuantity}
                    onChange={(e) => setFormData(f => ({ ...f, stockInQuantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                    min="1"
                    placeholder="Enter quantity to add for each size"
                  />
                </div>
              </div>

              {/* Stock In Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock In Date</label>
                <input
                  type="date"
                  value={formData.stockIn}
                  onChange={(e) => setFormData(f => ({ ...f, stockIn: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {/* Status Thresholds Section */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Stock Status Thresholds</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Set quantity thresholds to automatically track stock status levels. Leave as 0 to disable.
                </p>
                
                <div className="grid grid-cols-3 gap-4">
                  {/* High Status */}
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      High Status (Above)
                    </label>
                    <input
                      type="number"
                      value={formData.statusHigh}
                      onChange={(e) => setFormData(f => ({ ...f, statusHigh: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      min="0"
                      placeholder="e.g. 500"
                    />
                    <p className="text-xs text-green-600 mt-1">Stock above this = High</p>
                  </div>

                  {/* Medium Status */}
                  <div>
                    <label className="block text-sm font-medium text-yellow-700 mb-2">
                      Medium Status (Above)
                    </label>
                    <input
                      type="number"
                      value={formData.statusMedium}
                      onChange={(e) => setFormData(f => ({ ...f, statusMedium: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      min="0"
                      placeholder="e.g. 300"
                    />
                    <p className="text-xs text-yellow-600 mt-1">Stock above this = Medium</p>
                  </div>

                  {/* Low Status */}
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-2">
                      Low Status (Above)
                    </label>
                    <input
                      type="number"
                      value={formData.statusLow}
                      onChange={(e) => setFormData(f => ({ ...f, statusLow: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      min="0"
                      placeholder="e.g. 100"
                    />
                    <p className="text-xs text-orange-600 mt-1">Stock above this = Low</p>
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <strong>Example:</strong> High=500, Medium=300, Low=100:<br/>
                    • ≥500 = <span className="text-green-600 font-medium">High</span> • ≥300 = <span className="text-yellow-600 font-medium">Medium</span> • ≥100 = <span className="text-orange-600 font-medium">Low</span> • &lt;100 = <span className="text-red-600 font-medium">Critical</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Create Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
