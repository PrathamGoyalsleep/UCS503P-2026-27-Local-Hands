import { Link } from "react-router-dom";

function Search() {
  return (
    <div className="page search-page">
      <section className="search-header">
        <div>
          <span className="section-label">SERVECONNECT DIRECTORY</span>
          <h1>Find a trusted service worker</h1>
          <p>Search for professionals by service category and location.</p>
        </div>
      </section>

      <section className="search-box">
        <div className="search-field">
          <label>Service category</label>

          <select defaultValue="">
            <option value="" disabled>
              Select a service
            </option>
            <option>Electrician</option>
            <option>Plumber</option>
            <option>Carpenter</option>
            <option>Painter</option>
          </select>
        </div>

        <div className="search-field">
          <label>Location</label>

          <input type="text" placeholder="Enter your city or area" />
        </div>

        <button type="button" className="btn btn-primary search-button">
          Search
        </button>
      </section>

      <section className="results-section">
        <div className="results-heading">
          <div>
            <h2>Available workers</h2>
            <p>Explore trusted professionals in your area.</p>
          </div>

          <span className="result-count">3 workers</span>
        </div>

        <div className="worker-grid">
          <div className="worker-card">
            <div className="worker-card-top">
              <div className="worker-avatar">RK</div>

              <span className="verified-badge">✓ Verified</span>
            </div>

            <h3>Raj Kumar</h3>
            <p className="worker-category">Electrician</p>

            <div className="worker-details">
              <span>📍 Patiala</span>
              <span>8 years experience</span>
            </div>

            <div className="worker-bottom">
              <span className="worker-rating">★ 4.5</span>
              <span>₹300/hour</span>
            </div>

            <Link to="/worker/1" className="profile-button">
              View Profile →
            </Link>
          </div>

          <div className="worker-card">
            <div className="worker-card-top">
              <div className="worker-avatar">AS</div>

              <span className="verified-badge">✓ Verified</span>
            </div>

            <h3>Amar Singh</h3>
            <p className="worker-category">Plumber</p>

            <div className="worker-details">
              <span>📍 Patiala</span>
              <span>6 years experience</span>
            </div>

            <div className="worker-bottom">
              <span className="worker-rating">★ 4.7</span>
              <span>₹350/hour</span>
            </div>

            <Link to="/worker/2" className="profile-button">
              View Profile →
            </Link>
          </div>

          <div className="worker-card">
            <div className="worker-card-top">
              <div className="worker-avatar">MS</div>

              <span className="verified-badge">✓ Verified</span>
            </div>

            <h3>Manpreet Singh</h3>
            <p className="worker-category">Carpenter</p>

            <div className="worker-details">
              <span>📍 Patiala</span>
              <span>10 years experience</span>
            </div>

            <div className="worker-bottom">
              <span className="worker-rating">★ 4.6</span>
              <span>₹400/hour</span>
            </div>

            <Link to="/worker/3" className="profile-button">
              View Profile →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Search;
