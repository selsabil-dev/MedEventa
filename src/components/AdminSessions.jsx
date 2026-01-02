import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { FiPlus, FiCalendar, FiClock, FiMapPin, FiUser, FiEdit, FiTrash2 } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import "./AdminSessions.css";

const AdminSessions = () => {
    const location = useLocation(); // Add this line
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState("");
    const [sessions, setSessions] = useState([]);
    const [communicants, setCommunicants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        titre: "",
        horaire: "",
        salle: "",
        president_id: ""
    });

    useEffect(() => {
        fetchEvents();
        fetchCommunicants();
    }, []);

    useEffect(() => {
        if (selectedEventId) {
            fetchSessions();
        } else {
            setSessions([]);
        }
    }, [selectedEventId]);

    const fetchCommunicants = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/api/users/role/COMMUNICANT", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCommunicants(data);
            }
        } catch (error) {
            console.error("Error fetching communicants:", error);
        }
    };

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/api/events", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Handle both array and object responses
                const eventList = Array.isArray(data) ? data : (data.events || []);
                setEvents(eventList);

                // Prioritize state from navigation, then first event
                if (location.state?.eventId) {
                    // Find if the passed ID exists in the events list (robustness)
                    const exists = eventList.find(e => e.id == location.state.eventId || e._id == location.state.eventId);
                    if (exists) {
                        setSelectedEventId(exists.id || exists._id);
                        return;
                    }
                }

                if (eventList.length > 0 && !selectedEventId) {
                    setSelectedEventId(eventList[0].id || eventList[0]._id);
                }
            } else {
                console.error("Failed to fetch events:", response.status);
                setEvents([]);
            }
        } catch (error) {
            console.error("Error fetching events:", error);
            setEvents([]);
        }
    };

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            // Using getProgramController to list sessions (GET /events/:eventId/program)
            const response = await fetch(`/api/events/${selectedEventId}/program`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSessions(data.sessions || []);
            } else {
                setSessions([]);
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            // POST /events/:eventId/sessions/create
            const response = await fetch(`/api/events/${selectedEventId}/sessions/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert("Session created successfully!");
                setShowModal(false);
                setFormData({ titre: "", horaire: "", salle: "", president_id: "" });
                fetchSessions();
                // Notify Event Details page to refresh sessions
                window.dispatchEvent(new CustomEvent('session-created', {
                    detail: { eventId: selectedEventId }
                }));
            } else {
                const err = await response.json();
                alert(`Error: ${err.message}`);
            }
        } catch (error) {
            console.error("Error creating session:", error);
            alert("Failed to create session");
        }
    };

    return (
        <AdminLayout>
            <div className="admin-sessions-container">
                <header className="admin-header">
                    <div>
                        <h1>Manage Sessions</h1>
                        <p>Organize specific sessions within your events.</p>
                    </div>
                    <div>
                        <button className="create-btn" onClick={() => setShowModal(true)} disabled={!selectedEventId}>
                            <FiPlus /> New Session
                        </button>
                    </div>
                </header>

                {events.length === 0 ? (
                    <div className="empty-state" style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '12px',
                        margin: '2rem 0'
                    }}>
                        <FiCalendar size={64} style={{ color: '#cbd5e0', marginBottom: '1rem' }} />
                        <h2 style={{ color: '#2d3748', marginBottom: '0.5rem' }}>No Events Yet</h2>
                        <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
                            Create an event first to manage sessions.
                        </p>
                        <button
                            onClick={() => window.location.href = '/admin/events'}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#0f9d8a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: '600'
                            }}
                        >
                            Create Event
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="event-selector" style={{ marginBottom: "2rem" }}>
                            <label style={{ fontWeight: 600, marginRight: "1rem" }}>Select Event:</label>
                            <select
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                                style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                            >
                                {events.length === 0 && <option value="">No events found</option>}
                                {events.map(event => (
                                    <option key={event.id} value={event.id}>{event.titre || event.name}</option>
                                ))}
                            </select>
                        </div>

                        {loading ? (
                            <p>Loading sessions...</p>
                        ) : sessions.length > 0 ? (
                            <div className="sessions-grid">
                                {sessions.map(session => (
                                    <div key={session.id} className="session-card">
                                        <div className="session-header">
                                            <h3>{session.titre}</h3>
                                        </div>
                                        <div className="session-details">
                                            <p><FiClock /> {new Date(session.horaire).toLocaleString()}</p>
                                            <p><FiMapPin /> {session.salle}</p>
                                            <p><FiUser /> President: {session.president_nom} {session.president_prenom || 'N/A'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No sessions found for this event. Create one to get started.</p>
                            </div>
                        )}
                    </>
                )}

                {/* Create Session Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>Create New Session</h2>
                            <form onSubmit={handleCreateSession}>
                                <div className="form-group">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.titre}
                                        onChange={e => setFormData({ ...formData, titre: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={formData.horaire}
                                        onChange={e => setFormData({ ...formData, horaire: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Room / Location</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.salle}
                                        onChange={e => setFormData({ ...formData, salle: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>President / Chair</label>
                                    <select
                                        required
                                        value={formData.president_id}
                                        onChange={e => setFormData({ ...formData, president_id: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                    >
                                        <option value="">Select a speaker...</option>
                                        {communicants.map(c => (
                                            <option key={c.id} value={c.id}>{c.nom} {c.prenom} ({c.institution || 'N/A'})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="primary-btn">Create Session</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminSessions;
