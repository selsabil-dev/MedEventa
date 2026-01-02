import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthorLayout from "./AuthorLayout";
import "./AuthorDashboard.css";
import {
    FiCheckCircle,
    FiClock,
    FiEye,
    FiFileText,
    FiPlus
} from "react-icons/fi";
import axios from "axios";

const AuthorDashboard = () => {
    const navigate = useNavigate();
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const token = localStorage.getItem("token");

    const [stats, setStats] = useState({
        accepted: 0,
        pending: 0,
        views: 0
    });
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                if (token) {
                    const [statsRes, subsRes] = await Promise.all([
                        axios.get("/api/author/stats", { headers: { Authorization: `Bearer ${token}` } }),
                        axios.get("/api/author/submissions", { headers: { Authorization: `Bearer ${token}` } })
                    ]);
                    setStats(statsRes.data);
                    setSubmissions(subsRes.data);
                }
            } catch (error) {
                console.error("Error loading author dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    const handleNewSubmission = () => {
        navigate("/author/new-submission");
    };

    const getStatusInfo = (status) => {
        switch (status?.toLowerCase()) {
            case "acceptee":
                return { label: "Accepted", class: "ad-status-accepted" };
            case "en_attente":
                return { label: "Pending", class: "ad-status-pending" };
            case "en_revision":
                return { label: "In Revision", class: "ad-status-pending" };
            case "refusee":
                return { label: "Rejected", class: "ad-status-rejected" };
            case "retire":
                return { label: "Withdrawn", class: "ad-status-rejected" };
            default:
                return { label: status || "Unknown", class: "" };
        }
    };

    return (
        <AuthorLayout>
            <div className="ad-inner">
                <header className="ad-header">
                    <div>
                        <h1>Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
                        <p>Manage your scientific communications and event participation.</p>
                    </div>
                    <button className="pd-btn" onClick={handleNewSubmission} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <FiPlus /> Submit New Abstract
                    </button>
                </header>

                <div className="ad-stats-summary">
                    <div className="ad-stat-card">
                        <div className="ad-stat-header">Accepted Papers</div>
                        <div className="ad-stat-value" style={{ color: "#0f9d8a" }}>
                            {loading ? "..." : stats.accepted}
                        </div>
                        <div className="ad-stat-icon"><FiCheckCircle /></div>
                    </div>

                    <div className="ad-stat-card">
                        <div className="ad-stat-header">Pending Review</div>
                        <div className="ad-stat-value" style={{ color: "#d97706" }}>
                            {loading ? "..." : stats.pending}
                        </div>
                        <div className="ad-stat-icon" style={{ color: "#d97706", background: "rgba(217, 119, 6, 0.1)" }}>
                            <FiClock />
                        </div>
                    </div>

                    <div className="ad-stat-card">
                        <div className="ad-stat-header">Total Views</div>
                        <div className="ad-stat-value" style={{ color: "#12324a" }}>
                            {loading ? "..." : (stats.views > 1000 ? (stats.views / 1000).toFixed(1) + "k" : stats.views)}
                        </div>
                        <div className="ad-stat-icon" style={{ color: "#12324a", background: "rgba(18, 50, 74, 0.1)" }}>
                            <FiEye />
                        </div>
                    </div>
                </div>

                <div className="ad-submissions-section">
                    <div className="ad-section-title">
                        <FiFileText /> My Submissions
                    </div>

                    {loading ? (
                        <p>Loading submissions...</p>
                    ) : submissions.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "2rem", color: "#6c8895" }}>
                            You haven't submitted any abstracts yet.
                        </div>
                    ) : (
                        <table className="ad-submissions-table">
                            <thead>
                                <tr>
                                    <th>Title & Type</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map((sub) => {
                                    const statusInfo = getStatusInfo(sub.status);
                                    return (
                                        <tr key={sub.id} className="ad-submission-row">
                                            <td>
                                                <div className="ad-sub-title">{sub.title}</div>
                                                <div className="ad-sub-authors" style={{ textTransform: 'capitalize' }}>Type: {sub.type}</div>
                                            </td>
                                            <td className="ad-sub-date">
                                                {sub.date ? new Date(sub.date).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td>
                                                <span className={`ad-status-badge ${statusInfo.class}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="ad-action-btn"
                                                    onClick={() => navigate(`/author/programme`)}
                                                >
                                                    View in Program
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AuthorLayout>
    );
};

export default AuthorDashboard;
