import { useState, useEffect } from 'react';
import { Product, Stock } from '../types';

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) throw new Error('Failed to add product');
      
      const newProduct = await response.json();
      setProducts(prev => [...prev, newProduct]);
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const updateProduct = async (id: string, productData: Omit<Product, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) throw new Error('Failed to update product');
      
      const updatedProduct = await response.json();
      setProducts(prev => prev.map(p => p._id === id ? updatedProduct : p));
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const addTransaction = async (transactionData: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });
      
      if (!response.ok) throw new Error('Failed to add transaction');
      
      // Optionally update local state if needed
      const transaction = await response.json();
      return transaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  // Fetch products and stocks when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsResponse = await fetch('http://localhost:5000/api/products');
        if (!productsResponse.ok) throw new Error('Failed to fetch products');
        const productsData = await productsResponse.json();
        setProducts(productsData);

        // Fetch stocks
        const stocksResponse = await fetch('http://localhost:5000/api/stocks');
        if (!stocksResponse.ok) throw new Error('Failed to fetch stocks');
        const stocksData = await stocksResponse.json();
        setStocks(stocksData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return {
    products,
    stocks,
    addProduct,
    updateProduct,
    addTransaction
  };
}
