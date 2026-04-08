import { hotelInfo } from '../data/hotelInfo';
import { hotelPhotos } from '../data/photos';

export default function AboutPage() {
  const stats = [
    { num: hotelInfo.totalRooms, label: 'Luxury Rooms' },
    { num: `${new Date().getFullYear() - hotelInfo.yearEstablished}+`, label: 'Years of Excellence' },
    { num: '50+', label: 'Dedicated Staff' },
    { num: '4.8', label: 'Guest Rating' },
  ];

  return (
    <>
      <section className="page-hero">
        <h1>About Us</h1>
        <p>Discover the story behind Udhayam International</p>
      </section>

      <section className="section-padding">
        <div className="container-site">
          <div className="about-preview">
            <img src={hotelPhotos.exterior[0]} alt="Hotel Exterior" />
            <div>
              <div className="section-title" style={{ textAlign: 'left', marginBottom: 24 }}>
                <span className="label">Our Story</span>
                <h2>A Tradition of Excellence Since {hotelInfo.yearEstablished}</h2>
              </div>
              <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, marginBottom: 16 }}>
                {hotelInfo.description}
              </p>
              <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8 }}>
                Founded with a vision to provide world-class hospitality with a distinctly Tamil touch,
                Udhayam International has become the preferred choice for pilgrims visiting the sacred
                Thiruchendur Murugan Temple, families on beach holidays, and business travellers in the
                Thoothukudi district. Our commitment to personalized service, attention to detail, and
                creating memorable experiences sets us apart.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-soft" style={{ padding: '24px 0' }}>
        <div className="container-site">
          <div className="about-stats">
            {stats.map((s, i) => (
              <div key={i} className="about-stat">
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section className="section-padding">
        <div className="container-site">
          <div className="section-title">
            <span className="label">Facilities</span>
            <h2>World-Class Amenities</h2>
            <p>Every aspect of your stay has been thoughtfully considered</p>
          </div>
          <div className="row g-4">
            {[
              { img: hotelPhotos.spa[0], title: 'Spa & Steam Bath', desc: 'Relax and rejuvenate with our Turkish steam bath and spa treatments. A perfect way to unwind after a day of temple visits and beach walks.' },
              { img: hotelPhotos.restaurant[0], title: 'BELL Restaurant', desc: 'Our pure vegetarian restaurant serves authentic South Indian cuisine along with North Indian and continental favourites, prepared fresh daily.' },
              { img: hotelPhotos.conference[0], title: 'Banquet & Events', desc: 'Spacious banquet hall and garden area ideal for weddings, family functions, meetings, and celebrations.' },
              { img: hotelPhotos.exterior[0], title: 'Prime Location', desc: 'Just a 10-minute walk from the sacred Thiruchendur Murugan Temple and minutes from the beautiful beach. Perfect for pilgrims and holidaymakers.' },
            ].map((f, i) => (
              <div key={i} className="col-md-6">
                <div className="room-card">
                  <img src={f.img} alt={f.title} className="room-card-img" />
                  <div className="room-card-body">
                    <h3 className="room-card-type">{f.title}</h3>
                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', lineHeight: 1.7 }}>{f.desc}</p>
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
