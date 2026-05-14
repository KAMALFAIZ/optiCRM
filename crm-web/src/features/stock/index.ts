export { default as ProductsListPage } from './ProductsListPage';
export { default as ProductFormModal } from './ProductFormModal';
export { default as InventoryListPage } from './InventoryListPage';
export { default as productsReducer } from './productsSlice';
export { default as inventoryReducer } from './inventorySlice';
export {
  fetchProducts,
  fetchProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchProductStats,
  fetchCategories,
  setFilters as setProductFilters,
  clearFilters as clearProductFilters,
  clearSelectedProduct,
  clearError as clearProductError,
} from './productsSlice';
export {
  fetchStockLevels,
  fetchMovements,
  fetchWarehouses,
  createAdjustment,
  setFilters as setInventoryFilters,
  clearFilters as clearInventoryFilters,
  clearError as clearInventoryError,
} from './inventorySlice';
