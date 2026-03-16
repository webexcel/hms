import React from 'react';
import {
  useGuests,
  GuestStatsRow,
  GuestActionBar,
  GuestListView,
  GuestGridView,
  AddGuestModal,
  GuestProfileModal,
} from '../features/guests';

const GuestsPage = () => {
  const {
    guests,
    stats,
    loading,
    searchTerm,
    filterType,
    viewMode,
    currentPage,
    totalPages,
    showModal,
    showProfileModal,
    selectedGuest,
    submitting,
    activeDropdown,
    formData,
    setSearchTerm,
    setViewMode,
    setCurrentPage,
    setShowModal,
    setShowProfileModal,
    handleInputChange,
    handleSubmit,
    handleRowClick,
    handleFilter,
    toggleDropdown,
    fetchGuestProfile,
    getPageNumbers,
    navigate,
  } = useGuests();

  return (
    <>
      <GuestStatsRow stats={stats} />

      <GuestActionBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleFilter={handleFilter}
        setShowModal={setShowModal}
      />

      {viewMode === 'list' && (
        <GuestListView
          guests={guests}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          getPageNumbers={getPageNumbers}
          handleRowClick={handleRowClick}
          fetchGuestProfile={fetchGuestProfile}
          activeDropdown={activeDropdown}
          toggleDropdown={toggleDropdown}
          navigate={navigate}
        />
      )}

      {viewMode === 'grid' && (
        <GuestGridView
          guests={guests}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          getPageNumbers={getPageNumbers}
          fetchGuestProfile={fetchGuestProfile}
        />
      )}

      {showModal && (
        <AddGuestModal
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          submitting={submitting}
          onClose={() => setShowModal(false)}
        />
      )}

      {showProfileModal && selectedGuest && (
        <GuestProfileModal
          guest={selectedGuest}
          onClose={() => setShowProfileModal(false)}
          navigate={navigate}
        />
      )}
    </>
  );
};

export default GuestsPage;
