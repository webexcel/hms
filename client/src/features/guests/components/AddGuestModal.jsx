import React from 'react';

const AddGuestModal = ({ formData, handleInputChange, handleSubmit, submitting, onClose }) => (
  <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog modal-lg">
      <div className="modal-content">
        <div className="modal-header modal-header-custom">
          <h5 className="modal-title"><i className="bi bi-person-plus me-2"></i>Add New Guest</h5>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>
        <div className="modal-body modal-body-custom">
          <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div className="form-section border rounded mb-3">
              <div className="form-section-title">
                <i className="bi bi-person"></i> Personal Information
              </div>
              <div className="row g-3">
                <div className="col-md-2">
                  <label className="form-label-custom">Title</label>
                  <select
                    className="form-select form-select-custom"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                  >
                    <option>Mr.</option>
                    <option>Mrs.</option>
                    <option>Ms.</option>
                    <option>Dr.</option>
                  </select>
                </div>
                <div className="col-md-5">
                  <label className="form-label-custom">First Name *</label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="Enter first name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-5">
                  <label className="form-label-custom">Last Name</label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="Enter last name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label-custom">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-control form-control-custom"
                    placeholder="Enter phone number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label-custom">Email Address</label>
                  <input
                    type="email"
                    className="form-control form-control-custom"
                    placeholder="Enter email address"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label-custom">Date of Birth</label>
                  <input
                    type="date"
                    className="form-control form-control-custom"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label-custom">Nationality</label>
                  <select
                    className="form-select form-select-custom"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                  >
                    <option value="">Select nationality</option>
                    <option value="IN">India</option>
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="form-section border rounded mb-3">
              <div className="form-section-title">
                <i className="bi bi-geo-alt"></i> Address
              </div>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label-custom">Street Address</label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="Enter street address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label-custom">City</label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="Enter city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label-custom">State/Province</label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="Enter state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label-custom">Postal Code</label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="Enter postal code"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* ID Verification */}
            <div className="form-section border rounded mb-3">
              <div className="form-section-title">
                <i className="bi bi-card-text"></i> ID Verification
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label-custom">ID Type *</label>
                  <select
                    className="form-select form-select-custom"
                    name="id_proof_type"
                    value={formData.id_proof_type}
                    onChange={handleInputChange}
                  >
                    <option value="">Select ID type</option>
                    <option value="passport">Passport</option>
                    <option value="aadhar">Aadhar Card</option>
                    <option value="driving_license">Driving License</option>
                    <option value="voter_id">Voter ID</option>
                    <option value="pan">PAN Card</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label-custom">ID Number *</label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="Enter ID number"
                    name="id_proof_number"
                    value={formData.id_proof_number}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label-custom">Upload ID (Front)</label>
                  <input type="file" className="form-control form-control-custom" accept="image/*,.pdf" />
                </div>
                <div className="col-md-6">
                  <label className="form-label-custom">Upload ID (Back)</label>
                  <input type="file" className="form-control form-control-custom" accept="image/*,.pdf" />
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="form-section border rounded">
              <div className="form-section-title">
                <i className="bi bi-info-circle"></i> Additional Information
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label-custom">Company Name</label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="Enter company name (if corporate)"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label-custom">GST Number</label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="Enter GST number (for invoicing)"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <div className="form-check mt-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="vipGuest"
                      name="vip_status"
                      checked={formData.vip_status}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="vipGuest">
                      <i className="bi bi-star text-warning me-1"></i> Mark as VIP Guest
                    </label>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-check mt-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="marketingConsent"
                      name="marketing_consent"
                      checked={formData.marketing_consent}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="marketingConsent">
                      Receive promotional emails and offers
                    </label>
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label-custom">Notes / Preferences</label>
                  <textarea
                    className="form-control form-control-custom"
                    rows="3"
                    placeholder="Any special preferences, allergies, or notes about this guest..."
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="modal-footer modal-footer-custom">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ background: 'var(--secondary-color)', borderColor: 'var(--secondary-color)' }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-1"></i> Save Guest
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default AddGuestModal;
