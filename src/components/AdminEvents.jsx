import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiCalendar, FiMapPin, FiLayers, FiCheckCircle, FiClock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./AdminEvents.css";

import { hasPermission } from "../utils/permissions";

const AdminEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    // Get current user for permission checks
    const rawUser = localStorage.getItem("user");
    const currentUser = rawUser ? JSON.parse(rawUser) : null;

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch("/api/events", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log("AdminEvents: Fetched events count:", data.length);
                    console.log("AdminEvents: Data sample:", data.slice(0, 2));
                    setEvents(data);
                }
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const filteredEvents = events.filter(event =>
        (event.titre || event.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.thematique?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="admin-events-container">
                <header className="admin-page-header">
                    <div className="header-text">
                        <h1>Manage Events</h1>
                        <p>Create and update your medical conferences and events.</p>
                    </div>
                    {hasPermission(currentUser, 'create_event') && (
                        <button className="btn-primary" onClick={() => navigate("/admin/events/new")}>
                            <FiPlus /> Create New Event
                        </button>
                    )}
                </header>

                <div className="search-bar-container">
                    <div className="search-input-wrapper">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search events by title or theme..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">Loading events...</div>
                ) : (
                    <div className="admin-events-list">
                        {filteredEvents.length > 0 ? (
                            filteredEvents.map(event => (
                                <div key={event._id || event.id} className="admin-event-card">
                                    <div className="event-card-content">
                                        <h3>{event.titre || event.title}</h3>
                                        <div className="event-meta">
                                            <span><FiCalendar /> {new Date(event.date_debut).toLocaleDateString()}</span>
                                            <span><FiMapPin /> {event.lieu}</span>
                                        </div>
                                        <p className="event-theme">{event.thematique}</p>
                                    </div>
                                    <div className="event-card-actions">
                                        <div className="action-group">
                                            {hasPermission(currentUser, 'manage_program') && (
                                                <button
                                                    className="btn-icon"
                                                    title="Sessions"
                                                    onClick={() => navigate("/admin/sessions", { state: { eventId: event.id || event._id } })}
                                                >
                                                    <FiClock />
                                                </button>
                                            )}
                                            {hasPermission(currentUser, 'view_workshops') && (
                                                <button
                                                    className="btn-icon"
                                                    title="Workshops"
                                                    onClick={() => navigate("/admin/workshops", { state: { eventId: event.id || event._id } })}
                                                >
                                                    <FiLayers />
                                                </button>
                                            )}
                                            {hasPermission(currentUser, 'manage_evaluations') && (
                                                <button
                                                    className="btn-icon"
                                                    title="Evaluations"
                                                    onClick={() => navigate("/admin/evaluations", { state: { eventId: event.id || event._id } })}
                                                >
                                                    <FiCheckCircle />
                                                </button>
                                            )}
                                        </div>
                                        {(hasPermission(currentUser, 'edit_event') || hasPermission(currentUser, 'delete_event')) && (
                                            <>
                                                <div className="action-divider"></div>
                                                {hasPermission(currentUser, 'edit_event') && (
                                                    <button className="btn-icon" title="Edit"><FiEdit2 /></button>
                                                )}
                                                {hasPermission(currentUser, 'delete_event') && (
                                                    <button className="btn-icon delete" title="Delete"><FiTrash2 /></button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">No events found.</div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminEvents;
