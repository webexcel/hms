import React from 'react';
import {
  useRestaurant,
  RestaurantStats,
  TabSwitcher,
  NewOrderForm,
  OrdersList,
  MenuForm,
  MenuTable,
  WalkInBills,
} from '../features/restaurant';

const RestaurantPage = () => {
  const {
    loading,
    stats,
    activeTab,
    setActiveTab,
    activeFilter,
    setActiveFilter,
    menuFilter,
    setMenuFilter,
    orderForm,
    menuForm,
    setMenuForm,
    editingMenuId,
    rooms,
    menuItems,
    filteredOrders,
    filteredMenuItems,
    menuByCategory,
    handleRoomChange,
    handleAddItem,
    handleRemoveItem,
    handleItemChange,
    handleAddMenuItemToCart,
    handleDecrementItem,
    getItemPrice,
    calculateSubtotal,
    calculateGST,
    calculateTotal,
    isFormValid,
    handlePlaceOrder,
    handlePostToRoom,
    handleSaveMenuItem,
    handleEditMenuItem,
    handleCancelEdit,
    handleDeleteMenuItem,
    handleToggleAvailability,
    handleUpdateOrderStatus,
    fetchData,
  } = useRestaurant();

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
      <RestaurantStats stats={stats} />
      <TabSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'orders' && (
        <>
          <div className="row g-4 mb-4">
            <NewOrderForm
              orderForm={orderForm}
              rooms={rooms}
              menuByCategory={menuByCategory}
              menuItems={menuItems}
              getItemPrice={getItemPrice}
              calculateSubtotal={calculateSubtotal}
              calculateGST={calculateGST}
              calculateTotal={calculateTotal}
              isFormValid={isFormValid}
              handleRoomChange={handleRoomChange}
              handleAddItem={handleAddItem}
              handleRemoveItem={handleRemoveItem}
              handleItemChange={handleItemChange}
              handleAddMenuItemToCart={handleAddMenuItemToCart}
              handleDecrementItem={handleDecrementItem}
              handlePlaceOrder={handlePlaceOrder}
            />
          </div>
          <div className="row g-4">
            <OrdersList
              filteredOrders={filteredOrders}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              handleUpdateOrderStatus={handleUpdateOrderStatus}
              handlePostToRoom={handlePostToRoom}
            />
          </div>
        </>
      )}

      {activeTab === 'bills' && (
        <div className="row g-4">
          <WalkInBills filteredOrders={filteredOrders} menuByCategory={menuByCategory} fetchOrders={fetchData} />
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="row g-4">
          <MenuForm
            menuForm={menuForm}
            setMenuForm={setMenuForm}
            editingMenuId={editingMenuId}
            handleSaveMenuItem={handleSaveMenuItem}
            handleCancelEdit={handleCancelEdit}
          />
          <MenuTable
            menuItems={menuItems}
            filteredMenuItems={filteredMenuItems}
            menuFilter={menuFilter}
            setMenuFilter={setMenuFilter}
            handleEditMenuItem={handleEditMenuItem}
            handleDeleteMenuItem={handleDeleteMenuItem}
            handleToggleAvailability={handleToggleAvailability}
          />
        </div>
      )}
    </>
  );
};

export default RestaurantPage;
