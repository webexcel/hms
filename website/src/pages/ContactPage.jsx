import { useState } from 'react';
import { hotelInfo } from '../data/hotelInfo';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Thank you! Your message has been sent. We will get back to you shortly.');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <>
      <section className="page-hero">
        <h1>Contact Us</h1>
        <p>We'd love to hear from you</p>
      </section>

      <section className="section-padding">
        <div className="container-site">
          <div className="row g-4 mb-5">
            {[
              { icon: 'bi-geo-alt', title: 'Address', text: hotelInfo.fullAddress },
              { icon: 'bi-telephone', title: 'Phone', text: `${hotelInfo.phone} / ${hotelInfo.mobile}` },
              { icon: 'bi-envelope', title: 'Email', text: hotelInfo.email },
              { icon: 'bi-clock', title: 'Front Desk', text: '24 Hours, 7 Days a Week' },
            ].map((item, i) => (
              <div key={i} className="col-md-6 col-lg-3">
                <div className="contact-info-card" style={{ height: '100%' }}>
                  <div className="icon-box"><i className={`bi ${item.icon}`}></i></div>
                  <div>
                    <h6 style={{ marginBottom: 4, fontFamily: 'var(--font-heading)' }}>{item.title}</h6>
                    <p style={{ margin: 0, color: 'var(--color-text-light)', fontSize: '0.9rem' }}>{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-4">
            <div className="col-lg-6">
              <h3 style={{ marginBottom: 24, fontFamily: 'var(--font-heading)' }}>Send us a Message</h3>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <input className="form-control" placeholder="Your Name" required value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <input className="form-control" type="email" placeholder="Your Email" required value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <input className="form-control" placeholder="Subject" value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <textarea className="form-control" rows={5} placeholder="Your Message" required value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <button type="submit" className="btn-primary-custom">
                      Send Message <i className="bi bi-send ms-1"></i>
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <div className="col-lg-6">
              <h3 style={{ marginBottom: 24, fontFamily: 'var(--font-heading)' }}>Find Us</h3>
              <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: 350, background: 'var(--color-bg-soft)' }}>
                <iframe
                  title="Hotel Location"
                  src={hotelInfo.mapEmbedUrl}
                  width="100%" height="100%" style={{ border: 0 }}
                  allowFullScreen loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
