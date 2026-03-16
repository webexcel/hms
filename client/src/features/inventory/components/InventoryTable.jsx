import React from 'react';
import { formatCurrency } from '../../../utils/formatters';
import { capitalize } from '../../../utils/formatters';
import { getStockStatus, getCategoryIcon, getCategoryClass } from '../utils';

const InventoryTable = ({ items, currentPage, totalPages, onPageChange, onEdit, onAdjust, onDelete }) => {
  return (
    <div className="inventory-table-card">
      <div className="table-responsive">
        <table className="table inventory-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>SKU</th>
              <th>In Stock</th>
              <th>Min Level</th>
              <th>Unit Cost</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">
                  No inventory items found
                </td>
              </tr>
            ) : (
              items.map(item => {
                const status = getStockStatus(item);
                const catClass = getCategoryClass(item.category);
                const catIcon = getCategoryIcon(item.category);
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="item-info">
                        <div className={`item-icon ${catClass}`}>
                          <i className={`bi ${catIcon}`}></i>
                        </div>
                        <div className="item-details">
                          <span className="item-name">{item.name}</span>
                          {item.supplier && (
                            <span className="item-supplier">Supplier: {item.supplier}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span className={`category-badge ${catClass}`}>{capitalize(item.category)}</span></td>
                    <td>{item.sku}</td>
                    <td><strong>{item.current_stock}</strong></td>
                    <td>{item.min_stock_level}</td>
                    <td>{formatCurrency(item.unit_cost)}</td>
                    <td><span className={`stock-status ${status.className}`}>{status.label}</span></td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          title="Edit"
                          onClick={() => onEdit(item)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          title="Adjust Stock"
                          onClick={() => onAdjust(item)}
                        >
                          <i className="bi bi-plus-slash-minus"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Delete"
                          onClick={() => onDelete(item.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="table-pagination">
          <div className="pagination-info">
            Showing page {currentPage} of {totalPages}
          </div>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => onPageChange(currentPage - 1)}>
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => onPageChange(page)}>
                      {page}
                    </button>
                  </li>
                );
              })}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => onPageChange(currentPage + 1)}>
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;
