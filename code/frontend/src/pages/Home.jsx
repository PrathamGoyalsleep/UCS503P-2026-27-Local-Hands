import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">Trusted Local Services</span>

          <h1>
            Find the right
            <span> professional </span>
            for the job.
          </h1>

          <p>
            ServeConnect helps you discover trusted service workers in your
            area. Search by service and location, explore profiles, and connect
            directly.
          </p>

          <div className="hero-actions">
            <Link to="/search" className="btn btn-primary">
              Find a Worker
              <span>→</span>
            </Link>

            <Link to="/worker/register" className="btn btn-secondary">
              Join as a Worker
            </Link>
          </div>
        </div>

        <div className="hero-card">
          <div className="hero-card-header">
            <span className="status-dot"></span>
            Available professionals
          </div>

          <div className="service-preview">
            <div className="service-icon">⚡</div>

            <div>
              <h3>Electrician</h3>
              <p>Patiala</p>
            </div>

            <span className="rating">★ 4.8</span>
          </div>

          <div className="service-preview">
            <div className="service-icon">🔧</div>

            <div>
              <h3>Plumber</h3>
              <p>Patiala</p>
            </div>

            <span className="rating">★ 4.7</span>
          </div>

          <div className="service-preview">
            <div className="service-icon">🪚</div>

            <div>
              <h3>Carpenter</h3>
              <p>Patiala</p>
            </div>

            <span className="rating">★ 4.6</span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section">
        <div className="section-heading">
          <span className="section-label">SERVICES</span>

          <h2>Find professionals for everyday needs</h2>

          <p>
            Browse local service providers based on the work you need and their
            location.
          </p>
        </div>

        <div className="service-grid">
          <div className="service-card">
            <div className="service-card-icon">⚡</div>
            <h3>Electrician</h3>
            <p>Electrical installation, repairs and maintenance.</p>
          </div>

          <div className="service-card">
            <div className="service-card-icon">🔧</div>
            <h3>Plumber</h3>
            <p>Plumbing repairs, installation and maintenance.</p>
          </div>

          <div className="service-card">
            <div className="service-card-icon">🪚</div>
            <h3>Carpenter</h3>
            <p>Furniture, woodwork and carpentry services.</p>
          </div>

          <div className="service-card">
            <div className="service-card-icon">🎨</div>
            <h3>Painter</h3>
            <p>Professional painting and finishing services.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-section">
        <div className="section-heading">
          <span className="section-label">HOW IT WORKS</span>
          <h2>Simple. Local. Direct.</h2>
        </div>

        <div className="steps">
          <div className="step">
            <div className="step-number">01</div>
            <h3>Search</h3>
            <p>Choose a service and enter your location.</p>
          </div>

          <div className="step">
            <div className="step-number">02</div>
            <h3>Compare</h3>
            <p>Explore worker profiles and available information.</p>
          </div>

          <div className="step">
            <div className="step-number">03</div>
            <h3>Connect</h3>
            <p>Open a worker profile and connect directly.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
