import React from 'react';
import { X } from 'lucide-react';
import { Stock } from '../types';

interface DashboardDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: (Stock | string)[]; // Can be a list of stocks or a list of strings
}

export const DashboardDetailsModal: React.FC<DashboardDetailsModalProps> = ({ isOpen, onClose, title, items }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title} ({items.length})</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          {items.length > 0 ? (
            typeof items[0] === 'string' ? (
              <ul className="list-disc list-inside space-y-2">
                {(items as string[]).map((item, index) => (
                  <li key={index} className="text-gray-700">{item}</li>
                ))}
              </ul>
            ) : (
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Category</th>
                    <th scope="col" className="px-6 py-3">Subcategory</th>
                    <th scope="col" className="px-6 py-3">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {(items as Stock[]).map(stock => (
                    <tr key={stock._id} className="bg-white border-b">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{stock.category}</td>
                      <td className="px-6 py-4">{stock.subcategory}</td>
                      <td className="px-6 py-4">{stock.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            <p className="text-center text-gray-500 py-8">No items to display.</p>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
