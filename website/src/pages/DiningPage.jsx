import { hotelPhotos } from '../data/photos';
import { menuCategories } from '../data/menuHighlights';
import { formatCurrency } from '../utils/formatCurrency';
export default function DiningPage() {
  return (
    <>
      <section className="page-hero">
        <h1>Dining</h1>
        <p>A culinary journey that delights every palate</p>
      </section>

      {/* Restaurant Intro */}
      <section className="section-padding">
        <div className="container-site">
          <div className="about-preview">
            <img src={hotelPhotos.restaurant[0]} alt="Restaurant" />
            <div>
              <div className="section-title" style={{ textAlign: 'left', marginBottom: 24 }}>
                <span className="label">Pure Vegetarian</span>
                <h2>BELL Restaurant</h2>
              </div>
              <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, marginBottom: 16 }}>
                BELL Restaurant is our pure vegetarian dining destination in the heart of Thiruchendur,
                celebrating the rich and diverse flavors of vegetarian cuisine. From authentic South Indian
                delicacies to North Indian classics, every dish is crafted with the freshest ingredients
                and served with warmth.
              </p>
              <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, marginBottom: 24 }}>
                Whether it's a hearty breakfast to start your day, a business lunch, or a relaxed dinner
                with family, our experienced chefs ensure every meal is a memorable experience.
              </p>
              <div style={{ display: 'flex', gap: 32 }}>
                <div>
                  <strong style={{ color: 'var(--color-dark)' }}>Breakfast</strong>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', margin: 0 }}>7:00 AM - 10:30 AM</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--color-dark)' }}>Lunch</strong>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', margin: 0 }}>12:30 PM - 3:00 PM</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--color-dark)' }}>Dinner</strong>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', margin: 0 }}>7:00 PM - 11:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Highlights */}
      <section className="section-padding bg-soft">
        <div className="container-site">
          <div className="section-title">
            <span className="label">Menu</span>
            <h2>Menu Highlights</h2>
            <p>A selection of our most loved dishes</p>
          </div>
          <div className="row g-4">
            {menuCategories.map((cat, i) => (
              <div key={i} className="col-lg-4 col-md-6">
                <div className="booking-card" style={{ height: '100%' }}>
                  <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: 4 }}>{cat.name}</h4>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginBottom: 20 }}>{cat.time}</p>
                  <div className="menu-category">
                    {cat.items.map((item, j) => (
                      <div key={j} className="menu-item">
                        <span className="menu-item-name">{item.name}</span>
                        <span className="menu-item-price">{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
