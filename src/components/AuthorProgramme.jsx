import React, { useState, useEffect } from "react";
import AuthorLayout from "./AuthorLayout";
import "./AuthorProgramme.css";
import { FiCoffee, FiEdit2, FiEye, FiX, FiUser } from "react-icons/fi";
import axios from "axios";

const AuthorProgramme = () => {
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const token = localStorage.getItem("token");

    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState("");
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals state
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedPresentation, setSelectedPresentation] = useState(null);
    const [editForm, setEditForm] = useState({ title: "", abstract: "" });

    // Fetch Events and then Program
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Events
                const eventsRes = await axios.get("/api/events", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const fetchedEvents = eventsRes.data || [];
                setEvents(fetchedEvents);

                if (fetchedEvents.length > 0) {
                    const firstEvent = fetchedEvents[0];
                    setSelectedEventId(firstEvent.id);
                    await fetchProgram(firstEvent.id);
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [token]);

    const fetchProgram = async (eventId) => {
        try {
            // THE PROGRAMME HERE SHOULD BE THE AUTHOR'S PROGRAMME ONLY HIS
            const res = await axios.get("/api/my-interventions", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data) {
                // Filter by the selected event
                const myItems = res.data.filter(item =>
                    item.evenement_id?.toString() === eventId.toString() ||
                    item.session_evenement_id?.toString() === eventId.toString()
                );

                // Map results to schedule format
                const mappedSchedule = myItems.map(item => {
                    const isSpeaker = item.role === 'speaker' || item.comm_id !== null;
                    const presentations = isSpeaker ? [{
                        id: item.comm_id,
                        title: item.comm_titre || item.titre,
                        authors: "You (Presenter)",
                        affiliation: "",
                        isMyPresentation: true,
                        abstractText: item.comm_resume || item.resume || "",
                        type: item.comm_type || item.type
                    }] : [];

                    return {
                        id: item.session_id || item.id,
                        time: item.session_horaire || item.horaire || "TBA",
                        title: item.session_titre || item.titre || "Unnamed Session",
                        room: item.session_salle || item.salle || "TBA",
                        type: "session",
                        role: item.role || (item.comm_id ? 'speaker' : 'chair'),
                        presentations
                    };
                });

                // Sort by time
                mappedSchedule.sort((a, b) => {
                    if (a.time === "TBA") return 1;
                    if (b.time === "TBA") return -1;
                    return a.time.localeCompare(b.time);
                });

                setSchedule(mappedSchedule);
            }
        } catch (err) {
            console.error("Failed to fetch personal program", err);
            setSchedule([]);
        }
    };

    const handleEventChange = (e) => {
        const id = e.target.value;
        setSelectedEventId(id);
        fetchProgram(id);
    };

    const handleView = (pres) => {
        setSelectedPresentation(pres);
        setViewModalOpen(true);
    };

    const handleEdit = (pres) => {
        setSelectedPresentation(pres);
        setEditForm({
            title: pres.title,
            abstract: pres.abstractText || ""
        });
        setEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            // Call real backend API to update
            await axios.put(`/api/events/submissions/${selectedPresentation.id}`,
                { titre: editForm.title, resume: editForm.abstract },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state for immediate feedback
            setSchedule(prev => prev.map(item => {
                if (item.presentations) {
                    return {
                        ...item,
                        presentations: item.presentations.map(p => {
                            if (p.id === selectedPresentation.id) {
                                return { ...p, title: editForm.title, abstractText: editForm.abstract };
                            }
                            return p;
                        })
                    };
                }
                return item;
            }));

            alert("Abstract updated successfully!");
            setEditModalOpen(false);
        } catch (err) {
            console.error("Update failed", err);
            alert(err.response?.data?.message || "Failed to update abstract.");
        }
    };

    const closeModal = () => {
        setViewModalOpen(false);
        setEditModalOpen(false);
        setSelectedPresentation(null);
    };

    return (
        <AuthorLayout>
            <div className="ap-container">
                <div className="ap-header">
                    <div className="ap-header-top">
                        <div>
                            <h1>My Scientific Programme</h1>
                            <p>Your personalized schedule of interventions and presentations.</p>
                        </div>
                        {events.length > 0 && (
                            <div className="ap-event-selector">
                                <label>Select Event: </label>
                                <select
                                    value={selectedEventId}
                                    onChange={handleEventChange}
                                    className="ap-select"
                                >
                                    {events.map(ev => (
                                        <option key={ev.id} value={ev.id}>
                                            {ev.titre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <p>Loading your schedule...</p>
                ) : schedule.length === 0 ? (
                    <div className="ap-no-data" style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
                        <p>You have no scheduled interventions for this event.</p>
                    </div>
                ) : (
                    <div className="ap-timeline">
                        {schedule.map((item) => (
                            <div key={item.id} className="ap-timeline-item">
                                <div className="ap-time-marker"></div>
                                <span className="ap-time-label">
                                    {item.time.includes('T') ? new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : item.time}
                                </span>

                                <div className="ap-session-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h3 className="ap-session-title">{item.title}</h3>
                                        {item.role === 'chair' && (
                                            <span style={{ fontSize: '0.7rem', background: '#12324a', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                                CHAIR / MODERATOR
                                            </span>
                                        )}
                                    </div>
                                    <div className="ap-session-meta">{item.room}</div>

                                    {item.presentations && item.presentations.length > 0 ? (
                                        item.presentations.map(pres => (
                                            <div key={pres.id} className="ap-abstract-box">
                                                <div>
                                                    <div className="ap-abstract-title">{pres.title}</div>
                                                    <div className="ap-authors">
                                                        <FiUser /> {pres.authors}
                                                    </div>
                                                    <div style={{ fontSize: "0.75rem", color: "#0f9d8a", fontWeight: "bold", marginTop: "0.25rem" }}>
                                                        YOUR PRESENTATION
                                                    </div>
                                                </div>
                                                <div className="ap-actions">
                                                    <button className="ap-view-btn" onClick={() => handleView(pres)}>
                                                        <FiEye /> View
                                                    </button>
                                                    <button className="ap-edit-btn" onClick={() => handleEdit(pres)} style={{ marginLeft: "8px" }}>
                                                        <FiEdit2 /> Edit
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        item.role === 'chair' && (
                                            <div style={{ marginTop: '1rem', fontStyle: 'italic', fontSize: '0.85rem', color: '#64748b' }}>
                                                You are presiding over this session.
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* VIEW MODAL */}
                {viewModalOpen && selectedPresentation && (
                    <div className="modal-overlay">
                        <div className="modal-content review-modal">
                            <button className="modal-close" onClick={closeModal}><FiX /></button>
                            <h2>{selectedPresentation.title}</h2>
                            <p className="modal-meta" style={{ color: '#64748b', marginBottom: '1rem' }}>
                                {selectedPresentation.authors}
                            </p>
                            <div className="modal-body">
                                <h4>Abstract</h4>
                                <p>{selectedPresentation.abstractText || "No abstract details available."}</p>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={closeModal}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* EDIT MODAL */}
                {editModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content review-modal">
                            <button className="modal-close" onClick={closeModal}><FiX /></button>
                            <h2>Edit Abstract</h2>
                            <form onSubmit={handleEditSubmit}>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Title</label>
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        className="form-input"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Abstract</label>
                                    <textarea
                                        rows={6}
                                        value={editForm.abstract}
                                        onChange={(e) => setEditForm({ ...editForm, abstract: e.target.value })}
                                        className="form-input"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-secondary" onClick={closeModal} style={{ marginRight: '1rem' }}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ background: '#0f9d8a', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}>Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                .ap-header-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
                .ap-event-selector { display: flex; align-items: center; gap: 0.5rem; background: #f8fafc; padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; }
                .ap-event-selector label { font-weight: 600; color: #64748b; font-size: 0.9rem; }
                .ap-select { padding: 0.4rem 0.8rem; border-radius: 6px; border: 1px solid #cbd5e1; background: white; color: #1e293b; font-size: 0.9rem; outline: none; transition: border-color 0.2s; }
                .ap-select:focus { border-color: #0f9d8a; }
                .ap-actions { display: flex; align-items: center; }
                .ap-view-btn { display: flex; align-items: center; gap: 4px; border: 1px solid #12324a; background: white; color: #12324a; padding: 4px 12px; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
                .ap-view-btn:hover { background: #12324a; color: white; }
                .ap-edit-btn { display: flex; align-items: center; gap: 4px; border: 1px solid #0f9d8a; background: white; color: #0f9d8a; padding: 4px 12px; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
                .ap-edit-btn:hover { background: #0f9d8a; color: white; }
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
                .modal-content { background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 600px; position: relative; max-height: 90vh; overflow-y: auto; }
                .modal-close { position: absolute; top: 1rem; right: 1rem; border: none; background: none; font-size: 1.5rem; cursor: pointer; }
                .ap-timeline-item { position: relative; padding-left: 2rem; border-left: 2px solid #e2e8f0; margin-bottom: 2rem; }
                .ap-time-marker { position: absolute; left: -9px; top: 0; width: 16px; height: 16px; border-radius: 50%; background: #0f9d8a; border: 3px solid white; }
                .ap-time-label { display: block; font-size: 0.8rem; font-weight: 600; color: #64748b; margin-bottom: 0.5rem; }
                .ap-session-card { background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                .ap-session-title { color: #12324a; font-size: 1.25rem; margin-bottom: 0.25rem; }
                .ap-session-meta { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; display: flex; gap: 1rem; }
                .ap-abstract-box { background: #f8fafc; padding: 1rem; border-radius: 8px; border-left: 4px solid #0f9d8a; display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; }
                .ap-abstract-title { font-weight: 600; color: #1e293b; margin-bottom: 0.25rem; }
                .ap-authors { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #64748b; }
            `}</style>
        </AuthorLayout>
    );
};

export default AuthorProgramme;
