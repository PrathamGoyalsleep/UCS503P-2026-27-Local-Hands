import { useState } from "react";

function AdminDashboard() {
  const [workers, setWorkers] = useState([
    {
      id: 1,
      name: "Rahul Sharma",
      category: "Electrician",
      experience: 5,
      charges: 300,
      location: "Patiala",
      status: "pending",
    },
    {
      id: 2,
      name: "Aman Kumar",
      category: "Plumber",
      experience: 3,
      charges: 250,
      location: "Ludhiana",
      status: "pending",
    },
    {
      id: 3,
      name: "Harpreet Singh",
      category: "Carpenter",
      experience: 7,
      charges: 400,
      location: "Chandigarh",
      status: "pending",
    },
  ]);

  function handleApprove(id) {
    setWorkers((previous) =>
      previous.map((worker) =>
        worker.id === id ? { ...worker, status: "approved" } : worker,
      ),
    );
  }

  function handleReject(id) {
    setWorkers((previous) =>
      previous.map((worker) =>
        worker.id === id ? { ...worker, status: "rejected" } : worker,
      ),
    );
  }

  return (
    <div className="page admin-page">
      <div className="admin-header">
        <div>
          <span className="section-label">ADMIN PANEL</span>
          <h1>Worker Applications</h1>
          <p>Review and manage service worker registration requests.</p>
        </div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <span>Total Applications</span>
          <strong>{workers.length}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Pending</span>
          <strong>
            {workers.filter((worker) => worker.status === "pending").length}
          </strong>
        </div>

        <div className="admin-stat-card">
          <span>Approved</span>
          <strong>
            {workers.filter((worker) => worker.status === "approved").length}
          </strong>
        </div>

        <div className="admin-stat-card">
          <span>Rejected</span>
          <strong>
            {workers.filter((worker) => worker.status === "rejected").length}
          </strong>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2>Worker applications</h2>
            <p>Review applications submitted by service workers.</p>
          </div>
        </div>

        <div className="worker-table-wrapper">
          <table className="worker-table">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Category</th>
                <th>Experience</th>
                <th>Charges</th>
                <th>Location</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {workers.map((worker) => (
                <tr key={worker.id}>
                  <td>
                    <strong>{worker.name}</strong>
                  </td>

                  <td>{worker.category}</td>

                  <td>{worker.experience} years</td>

                  <td>₹{worker.charges}/hr</td>

                  <td>{worker.location}</td>

                  <td>
                    <span className={`status-badge ${worker.status}`}>
                      {worker.status}
                    </span>
                  </td>

                  <td>
                    {worker.status === "pending" ? (
                      <div className="admin-actions">
                        <button
                          className="approve-btn"
                          onClick={() => handleApprove(worker.id)}
                        >
                          Approve
                        </button>

                        <button
                          className="reject-btn"
                          onClick={() => handleReject(worker.id)}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="action-completed">Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
