import React from 'react';
import { Stock, CreateStockPayload } from '../types';
import { CreateStockModal } from './CreateStockModal';
import { AddRemoveQuantityModal } from './AddRemoveQuantityModal';

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stock: CreateStockPayload, action?: 'add' | 'delete', stockId?: string) => void;
  stock?: Stock;
  action?: 'add' | 'delete' | 'create';
  stockId?: string;
}

export const StockModal: React.FC<StockModalProps> = ({
  isOpen,
  onClose,
  onSave,
  stock,
  action = 'create',
  stockId
}) => {
  // Handle create stock action
  if (action === 'create') {
    return (
      <CreateStockModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={(stockData) => onSave(stockData, undefined, stockId)}
      />
    );
  }

  // Handle add/remove quantity actions
  if (action === 'add' || action === 'delete') {
    return (
      <AddRemoveQuantityModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={(sizes, quantity, actionType, date) => {
          const payload: CreateStockPayload = {
            singleSize: sizes, // Use singleSize instead of sizes to match StockTable expectations
            stockInQuantity: actionType === 'add' ? quantity : undefined,
            stockOutQuantity: actionType === 'delete' ? quantity : undefined,
            category: stock?.category || '',
            subcategory: stock?.subcategory || '',
            date: date // Pass the selected date
          };
          onSave(payload, actionType, stockId);
        }}
        stock={stock}
        action={action}
      />
    );
  }

  // If no valid action, return null
  return null;
};