import React from 'react';
import PageTemplate from '../components/templates/PageTemplate';
import {
  useInventory,
  InventoryStats,
  InventoryFilterBar,
  InventoryTable,
  LowStockAlerts,
  AddEditItemModal,
  AdjustStockModal
} from '../features/inventory';

const InventoryPage = () => {
  const {
    items,
    loading,
    search,
    categoryFilter,
    statusFilter,
    currentPage,
    totalPages,
    showAddModal,
    showAdjustModal,
    selectedItem,
    stats,
    lowStockAlerts,
    formData,
    adjustData,
    categories,
    setCurrentPage,
    handleAddItem,
    handleAdjustStock,
    handleDeleteItem,
    openEditModal,
    openAdjustModal,
    openAddModal,
    closeAddModal,
    closeAdjustModal,
    updateFormData,
    updateAdjustData,
    updateSearch,
    updateCategoryFilter,
    updateStatusFilter
  } = useInventory();

  if (loading && items.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <PageTemplate
      title="Inventory Management"
      description="Track and manage hotel supplies, amenities, and equipment"
      actions={<>
        <button className="btn btn-outline-secondary" onClick={() => { if (items.length > 0) openAdjustModal(items[0]); }}>
          <i className="bi bi-plus-slash-minus me-2"></i>Adjust Stock
        </button>
        <button className="btn btn-primary" onClick={openAddModal}>
          <i className="bi bi-plus-lg me-2"></i>Add Item
        </button>
      </>}
    >
      <InventoryStats stats={stats} />

      <div className="row g-4">
        <div className="col-xl-8">
          <InventoryFilterBar
            search={search}
            categoryFilter={categoryFilter}
            statusFilter={statusFilter}
            categories={categories}
            onSearchChange={updateSearch}
            onCategoryChange={updateCategoryFilter}
            onStatusChange={updateStatusFilter}
          />

          <InventoryTable
            items={items}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onEdit={openEditModal}
            onAdjust={openAdjustModal}
            onDelete={handleDeleteItem}
          />
        </div>

        <div className="col-xl-4">
          <LowStockAlerts alerts={lowStockAlerts} onAdjust={openAdjustModal} />
        </div>
      </div>

      <AddEditItemModal
        show={showAddModal}
        selectedItem={selectedItem}
        formData={formData}
        categories={categories}
        onClose={closeAddModal}
        onSubmit={handleAddItem}
        onFieldChange={updateFormData}
      />

      <AdjustStockModal
        show={showAdjustModal}
        selectedItem={selectedItem}
        adjustData={adjustData}
        onClose={closeAdjustModal}
        onSubmit={handleAdjustStock}
        onFieldChange={updateAdjustData}
      />
    </PageTemplate>
  );
};

export default InventoryPage;
