import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { FiBookOpen, FiPlus, FiUsers, FiClock, FiMapPin, FiX, FiSave, FiEdit, FiTrash2 } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import "./AdminWorkshops.css";

import { hasPermission } from "../utils/permissions";

const AdminWorkshops = () => {
    const [workshops, setWorkshops] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [communicants, setCommunicants] = useState([]);
    const [workshopForm, setWorkshopForm] = useState({
        titre: "",
        description: "",
        salle: "",
        date: "",
        nb_places: 30,
        responsable_id: ""
    });

    // Get current user for permission checks
    const rawUser = localStorage.getItem("user");
    const currentUser = rawUser ? JSON.parse(rawUser) : null;

    useEffect(() => {
        fetchEvents();
        fetchCommunicants();
    }, []);

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

    useEffect(() => {
        if (selectedEventId) {
            fetchWorkshops();
        }
    }, [selectedEventId]);

    const location = useLocation();

    const fetchEvents = async () => {
        try {
            const response = await fetch("/api/events");
            if (response.ok) {
                const data = await response.json();
                setEvents(data);

                if (location.state?.eventId) {
                    const exists = data.find(e => e.id == location.state.eventId || e._id == location.state.eventId);
                    if (exists) {
                        setSelectedEventId(exists.id || exists._id);
                        return;
                    }
                }

                if (data.length > 0 && !selectedEventId) {
                    setSelectedEventId(data[0].id || data[0]._id);
                }
            }
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    };

    const fetchWorkshops = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/events/${selectedEventId}/workshops`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setWorkshops(data || []);
            }
        } catch (error) {
            console.error("Error fetching workshops:", error);
        }
    };

    const [editingWorkshopId, setEditingWorkshopId] = useState(null);

    const handleOpenEdit = (workshop) => {
        setWorkshopForm({
            titre: workshop.titre,
            description: workshop.description || "",
            salle: workshop.salle,
            date: workshop.date ? new Date(workshop.date).toISOString().slice(0, 16) : "",
            nb_places: workshop.nb_places,
            responsable_id: workshop.responsable_id
        });
        setEditingWorkshopId(workshop.id);
        setShowModal(true);
    };

    const handleDeleteWorkshop = async (workshopId) => {
        if (!window.confirm("Are you sure you want to delete this workshop?")) return;
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/events/workshops/${workshopId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                alert("Workshop deleted successfully");
                fetchWorkshops();
            } else {
                const err = await response.json();
                alert(`Error: ${err.message}`);
            }
        } catch (error) {
            console.error("Error deleting workshop:", error);
        }
    };

    const handleSaveWorkshop = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const url = editingWorkshopId
                ? `/api/events/workshops/${editingWorkshopId}`
                : `/api/events/${selectedEventId}/workshops`;

            const method = editingWorkshopId ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(workshopForm)
            });

            if (response.ok) {
                alert(`Workshop ${editingWorkshopId ? "updated" : "created"} successfully!`);
                setShowModal(false);
                setEditingWorkshopId(null);
                setWorkshopForm({
                    titre: "",
                    description: "",
                    salle: "",
                    date: "",
                    nb_places: 30,
                    responsable_id: ""
                });
                fetchWorkshops();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message || "Failed to save workshop"}`);
            }
        } catch (error) {
            console.error("Error saving workshop:", error);
            alert("Failed to save workshop");
        }
    };

    return (
        <AdminLayout>
            <div className="admin-workshops-container">
                <header className="admin-page-header">
                    <div className="header-text">
                        <h1>Workshops & Parallel Events</h1>
                        <p>Manage hands-on sessions and limited-seat workshops.</p>
                    </div>
                    {hasPermission(currentUser, 'create_workshop') && (
                        <button className="btn-primary" onClick={() => {
                            setEditingWorkshopId(null);
                            setWorkshopForm({
                                titre: "", description: "", salle: "", date: "", nb_places: 30, responsable_id: ""
                            });
                            setShowModal(true);
                        }}>
                            <FiPlus /> New Workshop
                        </button>
                    )}
                </header>

                <div className="event-selector" style={{ marginBottom: "2rem" }}>
                    <label style={{ fontWeight: 600, marginRight: "1rem" }}>Select Event:</label>
                    <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    >
                        {events.map(event => (
                            <option key={event.id} value={event.id}>{event.titre || event.name}</option>
                        ))}
                    </select>
                </div>

                <div className="admin-workshops-grid">
                    {workshops.map(ws => (
                        <div key={ws.id} className="workshop-card">
                            <div className="workshop-badge">{ws.thematique || "Workshop"}</div>
                            <h3>{ws.titre}</h3>
                            <p className="instructor">By {ws.responsable_prenom} {ws.responsable_nom}</p>

                            <div className="ws-meta">
                                <span><FiClock /> {new Date(ws.date).toLocaleString()}</span>
                                <span><FiMapPin /> {ws.salle}</span>
                            </div>

                            <div className="ws-capacity-info">
                                <div className="capacity-bar-wrapper">
                                    <div className="capacity-label">
                                        <span>Registration progress</span>
                                        <span>{ws.registeredCount || 0}/{ws.nb_places} seats</span>
                                    </div>
                                    <div className="capacity-bar">
                                        <div
                                            className="capacity-fill"
                                            style={{
                                                width: `${((ws.registeredCount || 0) / ws.nb_places) * 100}%`,
                                                backgroundColor: (ws.registeredCount || 0) >= ws.nb_places ? '#ff4757' : '#0f9d8a'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="workshop-actions">
                                {hasPermission(currentUser, 'manage_workshop_inscriptions') && (
                                    <button className="btn-ws-view"><FiUsers /> Participants</button>
                                )}
                                {hasPermission(currentUser, 'edit_workshop') && (
                                    <button className="btn-ws-edit" onClick={() => handleOpenEdit(ws)}><FiEdit /> Edit</button>
                                )}
                                {hasPermission(currentUser, 'delete_workshop') && (
                                    <button className="btn-ws-delete" onClick={() => handleDeleteWorkshop(ws.id)}><FiTrash2 /> Delete</button>
                                )}
                            </div>
                        </div>
                    ))}
                    {workshops.length === 0 && (
                        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "#6c8895" }}>
                            No workshops created yet for this event.
                        </div>
                    )}
                </div>
            </div>

            {/* Workshop Creation Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingWorkshopId ? "Edit Workshop" : "Create New Workshop"}</h2>
                            <button onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleSaveWorkshop}>
                            <div className="form-group">
                                <label>Workshop Title</label>
                                <input
                                    type="text"
                                    value={workshopForm.titre}
                                    onChange={(e) => setWorkshopForm({ ...workshopForm, titre: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={workshopForm.description}
                                    onChange={(e) => setWorkshopForm({ ...workshopForm, description: e.target.value })}
                                    rows="3"
                                />
                            </div>
                            <div className="form-group">
                                <label>Room</label>
                                <input
                                    type="text"
                                    value={workshopForm.salle}
                                    onChange={(e) => setWorkshopForm({ ...workshopForm, salle: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={workshopForm.date}
                                    onChange={(e) => setWorkshopForm({ ...workshopForm, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Capacity (Number of Seats)</label>
                                <input
                                    type="number"
                                    value={workshopForm.nb_places}
                                    onChange={(e) => setWorkshopForm({ ...workshopForm, nb_places: parseInt(e.target.value) })}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Responsible Trainer</label>
                                <select
                                    required
                                    value={workshopForm.responsable_id}
                                    onChange={(e) => setWorkshopForm({ ...workshopForm, responsable_id: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0'
                                    }}
                                >
                                    <option value="">Select a trainer...</option>
                                    {communicants.map(c => (
                                        <option key={c.id} value={c.id}>{c.nom} {c.prenom} ({c.institution || 'N/A'})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-save"><FiSave /> {editingWorkshopId ? "Update" : "Create"} Workshop</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminWorkshops;
