import React from 'react';
import { capitalize } from '../../../utils/formatters';

export default function GeneralTab({
  generalSettings, setGeneralSettings,
  appearance, setAppearance,
  saving, saveSettings,
  languages, timezones, dateFormats, currencies,
}) {
  return (
    <div className="tab-pane fade show active" id="general">
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0"><i className="bi bi-gear me-2"></i>General Settings</h5>
        </div>
        <div className="card-body">
          <form>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">System Language</label>
                <select
                  className="form-select"
                  value={generalSettings.system_language}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, system_language: e.target.value })}
                >
                  {languages.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Timezone</label>
                <select
                  className="form-select"
                  value={generalSettings.timezone}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                >
                  {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Date Format</label>
                <select
                  className="form-select"
                  value={generalSettings.date_format}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, date_format: e.target.value })}
                >
                  {dateFormats.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Currency</label>
                <select
                  className="form-select"
                  value={generalSettings.currency}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                >
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Check-in Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={generalSettings.check_in_time}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, check_in_time: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Check-out Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={generalSettings.check_out_time}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, check_out_time: e.target.value })}
                />
              </div>
            </div>
          </form>
        </div>
        <div className="card-footer">
          <button className="btn btn-primary" onClick={() => saveSettings('General', generalSettings, 'general')} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0"><i className="bi bi-palette me-2"></i>Appearance</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Theme</label>
              <div className="theme-options">
                {['light', 'dark', 'auto'].map(t => (
                  <label key={t} className={`theme-option${appearance.theme === t ? ' active' : ''}`}>
                    <input
                      type="radio"
                      name="theme"
                      checked={appearance.theme === t}
                      onChange={() => setAppearance({ ...appearance, theme: t })}
                    />
                    <span className={`theme-preview ${t}`}></span>
                    <span className="theme-name">{capitalize(t)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Sidebar Style</label>
              <select
                className="form-select"
                value={appearance.sidebar_style}
                onChange={(e) => setAppearance({ ...appearance, sidebar_style: e.target.value })}
              >
                <option>Expanded</option>
                <option>Collapsed</option>
                <option>Auto-hide</option>
              </select>
            </div>
            <div className="col-12">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="compactMode"
                  checked={appearance.compact_mode}
                  onChange={(e) => setAppearance({ ...appearance, compact_mode: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="compactMode">Enable compact mode (reduce spacing)</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
