import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StockHistoryPage from './pages/StockHistoryPage';
import { Header } from './components/Header';

import { StocksContainer } from './components/StocksContainer';
import { Dashboard } from './components/Dashboard';


import { ProductModal } from './components/ProductModal';

import { TransactionModal } from './components/TransactionModal';
import { useInventory } from './hooks/useInventory.ts';
import { Product } from './types';

function App() {
  const {
    products,
    stocks,
    addProduct,
    updateProduct,
    addTransaction
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'stock' | 'register'>('dashboard');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  const handleProductSave = (productData: Omit<Product, 'id' | 'createdAt'>) => {
    if (editingProduct) {
      updateProduct(editingProduct._id!, productData);
    } else {
      addProduct(productData);
    }
    setEditingProduct(undefined);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'stock', label: 'Stock' }
  ];

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header />
        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="container mx-auto px-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-purple-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
        <Routes>
          <Route path="/stock-history/:category/:subcategory" element={<StockHistoryPage />} />
          <Route path="/stock-history/:category" element={<StockHistoryPage />} />
          <Route path="/" element={
            <div className="container mx-auto px-6 py-8">
              {activeTab === 'dashboard' && (
                <Dashboard products={products} stocks={stocks} />
              )}
              {activeTab === 'stock' && (
                <StocksContainer />
              )}
            </div>
          } />
        </Routes>
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(undefined);
          }}
          onSave={handleProductSave}
          product={editingProduct}
        />
        <TransactionModal
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          onSave={addTransaction}
          products={products}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;