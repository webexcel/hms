import { useState } from 'react';
import { galleryImages } from '../data/photos';

const categories = ['all', 'exterior', 'rooms', 'dining', 'facilities'];

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [lightboxIdx, setLightboxIdx] = useState(null);

  const filtered = activeCategory === 'all'
    ? galleryImages
    : galleryImages.filter(img => img.category === activeCategory);

  return (
    <>
      <section className="page-hero">
        <h1>Gallery</h1>
        <p>Explore our hotel through images</p>
      </section>

      <section className="section-padding">
        <div className="container-site">
          {/* Filter Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 40, flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 20,
                  border: '1.5px solid',
                  borderColor: activeCategory === cat ? 'var(--color-primary)' : 'var(--color-border)',
                  background: activeCategory === cat ? 'var(--color-primary)' : '#fff',
                  color: activeCategory === cat ? '#fff' : 'var(--color-text)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'var(--transition)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="gallery-grid">
            {filtered.map((img, i) => (
              <div key={i} className="gallery-item" onClick={() => setLightboxIdx(i)}>
                <img src={img.src} alt={img.caption} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div className="lightbox-overlay" onClick={() => setLightboxIdx(null)}>
          <button className="lightbox-close" onClick={() => setLightboxIdx(null)}>
            <i className="bi bi-x-lg"></i>
          </button>
          <img src={filtered[lightboxIdx]?.src} alt={filtered[lightboxIdx]?.caption} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
