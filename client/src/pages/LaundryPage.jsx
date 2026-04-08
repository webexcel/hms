import {
  useLaundry,
  LaundryStats,
  NewLaundryOrderForm,
  LaundryOrdersList,
} from '../features/laundry';

const LaundryPage = () => {
  const {
    loading,
    stats,
    rooms,
    activeFilter,
    setActiveFilter,
    orderForm,
    filteredOrders,
    handleRoomChange,
    handleFormChange,
    handleAddItem,
    handleRemoveItem,
    handleItemChange,
    calculateSubtotal,
    calculateTax,
    calculateTotal,
    isFormValid,
    handleCreateOrder,
    handleUpdateStatus,
    handlePostToRoom,
  } = useLaundry();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <LaundryStats stats={stats} />
      <div className="row g-4">
        <NewLaundryOrderForm
          orderForm={orderForm}
          rooms={rooms}
          handleRoomChange={handleRoomChange}
          handleFormChange={handleFormChange}
          handleAddItem={handleAddItem}
          handleRemoveItem={handleRemoveItem}
          handleItemChange={handleItemChange}
          calculateSubtotal={calculateSubtotal}
          calculateTax={calculateTax}
          calculateTotal={calculateTotal}
          isFormValid={isFormValid}
          handleCreateOrder={handleCreateOrder}
        />
        <LaundryOrdersList
          filteredOrders={filteredOrders}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          handleUpdateStatus={handleUpdateStatus}
          handlePostToRoom={handlePostToRoom}
        />
      </div>
    </>
  );
};

export default LaundryPage;
