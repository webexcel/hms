import React from 'react';

export default function HotelInfoTab({
  hotelInfo, setHotelInfo,
  saving, saveSettings,
}) {
  return (
    <div className="tab-pane fade show active" id="hotel-info">
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0"><i className="bi bi-building me-2"></i>Hotel Information</h5>
        </div>
        <div className="card-body">
          <form>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Hotel Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={hotelInfo.hotel_name}
                  onChange={(e) => setHotelInfo({ ...hotelInfo, hotel_name: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Hotel Type</label>
                <select
                  className="form-select"
                  value={hotelInfo.hotel_type}
                  onChange={(e) => setHotelInfo({ ...hotelInfo, hotel_type: e.target.value })}
                >
                  <option>Budget</option>
                  <option>Business</option>
                  <option>Luxury</option>
                  <option>Resort</option>
                  <option>Boutique</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Star Rating</label>
                <select
                  className="form-select"
                  value={hotelInfo.star_rating}
                  onChange={(e) => setHotelInfo({ ...hotelInfo, star_rating: e.target.value })}
                >
                  <option value="1">1 Star</option>
                  <option value="2">2 Star</option>
                  <option value="3">3 Star</option>
                  <option value="4">4 Star</option>
                  <option value="5">5 Star</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Total Rooms</label>
                <input
                  type="number"
                  className="form-control"
                  value={hotelInfo.total_rooms}
                  onChange={(e) => setHotelInfo({ ...hotelInfo, total_rooms: e.target.value })}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Address</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={hotelInfo.hotel_address}
                  onChange={(e) => setHotelInfo({ ...hotelInfo, hotel_address: e.target.value })}
                ></textarea>
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  value={hotelInfo.hotel_phone}
                  onChange={(e) => setHotelInfo({ ...hotelInfo, hotel_phone: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={hotelInfo.hotel_email}
                  onChange={(e) => setHotelInfo({ ...hotelInfo, hotel_email: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Website</label>
                <input
                  type="url"
                  className="form-control"
                  value={hotelInfo.hotel_website}
                  onChange={(e) => setHotelInfo({ ...hotelInfo, hotel_website: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">GST Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={hotelInfo.hotel_gstin}
                  onChange={(e) => setHotelInfo({ ...hotelInfo, hotel_gstin: e.target.value })}
                  placeholder="e.g., 33ABGPA3200K1ZD"
                />
              </div>
              <div className="col-12">
                <label className="form-label">Hotel Logo</label>
                <div className="logo-upload">
                  <div className="current-logo">
                    <i className="bi bi-building"></i>
                  </div>
                  <div className="upload-info">
                    <button type="button" className="btn btn-outline-primary btn-sm">Upload New Logo</button>
                    <small className="text-muted d-block mt-1">PNG, JPG up to 2MB. Recommended: 200x200px</small>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="card-footer">
          <button className="btn btn-primary" onClick={() => saveSettings('Hotel info', hotelInfo, 'general')} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
