
export type ItemCategory = 'Alimentos' | 'Bebidas' | 'Eletrónicos' | 'Vestuário' | 'Limpeza' | 'Construção' | 'Outros';

export interface User {
  id: string;
  name: string;
  phone: string;
  password?: string;
  businessName?: string;
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  category: ItemCategory;
  price: number;
  stock: number;
  minStock: number;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  quantity: number;
  type: 'entrada' | 'saída';
  date: string;
  totalValue: number;
}

export interface BusinessStats {
  totalInventoryValue: number;
  lowStockCount: number;
  salesToday: number;
  profitToday: number;
}
