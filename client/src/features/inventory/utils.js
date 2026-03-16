export const getStockStatus = (item) => {
  if (item.current_stock === 0) return { className: 'out', label: 'Out of Stock' };
  if (item.current_stock <= item.min_stock_level) return { className: 'low', label: 'Low Stock' };
  return { className: 'instock', label: 'In Stock' };
};

export const getCategoryIcon = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('linen')) return 'bi-basket3';
  if (cat.includes('toilet')) return 'bi-droplet';
  if (cat.includes('food') || cat.includes('beverage') || cat.includes('minibar')) return 'bi-cup-straw';
  if (cat.includes('cleaning')) return 'bi-spray';
  if (cat.includes('amenit')) return 'bi-gift';
  if (cat.includes('office')) return 'bi-paperclip';
  if (cat.includes('maintenance') || cat.includes('equipment')) return 'bi-tools';
  return 'bi-box-seam';
};

export const getCategoryClass = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('linen')) return 'linens';
  if (cat.includes('toilet')) return 'toiletries';
  if (cat.includes('food') || cat.includes('beverage') || cat.includes('minibar')) return 'minibar';
  if (cat.includes('cleaning')) return 'cleaning';
  if (cat.includes('amenit')) return 'amenities';
  if (cat.includes('office')) return 'office';
  if (cat.includes('maintenance') || cat.includes('equipment')) return 'equipment';
  return 'other';
};
