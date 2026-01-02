import React, { useRef, useState, useEffect } from "react";
import AuthorLayout from "./AuthorLayout";
import "./AuthorBadges.css";
import { FiDownload, FiPlusCircle, FiCheckCircle, FiInfo } from "react-icons/fi";
import { FaQrcode } from "react-icons/fa";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import axios from "axios";
import { Link } from "react-router-dom";

const AuthorBadges = () => {
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const token = localStorage.getItem("token");
    const badgeRef = useRef(null);

    const [attestations, setAttestations] = useState([]);
    const [eligibility, setEligibility] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedAttestation, setSelectedAttestation] = useState(null);

    const fetchData = async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // 1. Fetch list of generated attestations
            const resList = await axios.get("/api/attestations/me/list", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttestations(resList.data);
            if (resList.data.length > 0 && !selectedAttestation) {
                setSelectedAttestation(resList.data[0]);
            }

            // 2. Fetch eligibility for new ones
            const resElig = await axios.get("/api/attestations/me/eligibility", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEligibility(resElig.data);
        } catch (err) {
            console.error("Error fetching badges data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const handleGenerate = async (eventId, type) => {
        setGenerating(true);
        try {
            await axios.post("/api/attestations/me/generate",
                { evenementId: eventId, type: type },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Certification generated successfully!");
            await fetchData(); // Refresh both lists
        } catch (err) {
            console.error("Generation failed", err);
            alert(err.response?.data?.message || "Failed to generate certificate.");
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!badgeRef.current) return;

        try {
            const canvas = await html2canvas(badgeRef.current, { scale: 2 });
            const imgData = canvas.toDataURL("image/png");

            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`medeventa-badge-${selectedAttestation?.type || 'doc'}.pdf`);
        } catch (err) {
            console.error("PDF generation failed", err);
            alert("Failed to generate PDF. Please try again.");
        }
    };

    return (
        <AuthorLayout>
            <div className="ab-container">
                <div className="ab-header">
                    <h1>Badges & Certifications</h1>
                    <p>Manage and download your professional credentials.</p>
                </div>

                <div className="ab-layout">
                    <div className="ab-side-panel">
                        {/* 1. AVAILABLE TO GENERATE */}
                        {eligibility.length > 0 && (
                            <div className="ab-selection-card available-card" style={{ marginBottom: '1.5rem', border: '1px solid #0f9d8a', background: '#f0fdfa' }}>
                                <div className="ab-card-title" style={{ color: '#0f9d8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FiPlusCircle /> Available Now
                                </div>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.5rem 0 1rem' }}>
                                    New certifications are available for events you've completed.
                                </p>
                                <div className="ab-comm-list">
                                    {eligibility.map((elig, idx) => (
                                        <div key={`elig-${idx}`} className="ab-elig-item">
                                            <div className="ab-elig-info">
                                                <div className="ab-comm-title">{elig.event_title}</div>
                                                <div className="ab-comm-author" style={{ textTransform: 'capitalize' }}>Role: {elig.type}</div>
                                            </div>
                                            <button
                                                className="ab-gen-btn"
                                                onClick={() => handleGenerate(elig.evenement_id, elig.type)}
                                                disabled={generating}
                                            >
                                                {generating ? "..." : "Generate"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. MY CERTIFICATIONS (ALREADY GENERATED) */}
                        <div className="ab-selection-card">
                            <div className="ab-card-title">My Documents</div>

                            {loading ? (
                                <p>Loading...</p>
                            ) : attestations.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>
                                    <FiInfo size={24} style={{ marginBottom: '0.5rem' }} />
                                    <p className="ab-no-data">No generated documents yet.</p>
                                </div>
                            ) : (
                                <div className="ab-comm-list">
                                    {attestations.map((att) => (
                                        <div
                                            key={att.id}
                                            className={`ab-comm-item ${selectedAttestation?.id === att.id ? 'active' : ''}`}
                                            onClick={() => setSelectedAttestation(att)}
                                        >
                                            <div className="ab-comm-title">{att.event_title}</div>
                                            <div className="ab-comm-author" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ textTransform: 'capitalize' }}>{att.type}</span>
                                                <FiCheckCircle color="#0f9d8a" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="ab-info-card">
                            <div className="ab-info-title">Certification Policy</div>
                            <div className="ab-info-text">
                                Certifications for speakers and participants become available automatically after the event's closing date. Ensure your profile details are up to date!
                            </div>
                            <Link to="/profile/edit" className="ab-update-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
                                Update My Profile
                            </Link>
                        </div>
                    </div>

                    <div className="ab-badge-preview">
                        <div className="preview-sticky">
                            <div className="badge-frame" ref={badgeRef}>
                                <div className="badge-header">
                                    <div className="badge-logo">MEDEVENTA</div>
                                    <div className="badge-event-tag">{selectedAttestation?.event_title || "SCIENTIFIC EVENT"}</div>
                                </div>
                                <div className="badge-body">
                                    <img
                                        src={user?.photo || user?.photoUrl || "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg"}
                                        alt="Profile"
                                        className="badge-photo"
                                    />
                                    <div className="badge-name">{user ? `${user.nom} ${user.prenom}` : "Dr. Name"}</div>
                                    <div className="badge-role" style={{ textTransform: 'uppercase' }}>{selectedAttestation?.type || "PARTICIPANT"}</div>

                                    <div className="badge-inst">AFFILIATION</div>
                                    <div className="badge-inst-name">{user?.institution || "Medical Faculty / Hospital"}</div>

                                    <div className="badge-qr">
                                        <FaQrcode size={60} color="#1e293b" />
                                    </div>
                                    <div className="badge-id">VERIFICATION CODE: {selectedAttestation?.unique_code || "XXXX-XXXX-XXXX"}</div>
                                </div>
                                <div className="badge-footer">
                                    Generated on {selectedAttestation ? new Date(selectedAttestation.date_generation).toLocaleDateString() : new Date().toLocaleDateString()}
                                </div>
                            </div>

                            <div className="ab-download-actions">
                                <button className="ab-download-btn" onClick={handleDownloadPDF} disabled={!selectedAttestation}>
                                    <FiDownload /> Export to PDF
                                </button>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem', textAlign: 'center' }}>
                                    This document includes a secure QR code for verification.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                .ab-elig-item { 
                    display: flex; justify-content: space-between; align-items: center; 
                    padding: 0.75rem; background: white; border-radius: 8px; margin-bottom: 0.5rem;
                    border: 1px solid #e2e8f0;
                }
                .ab-elig-info { flex: 1; }
                .ab-gen-btn { 
                    background: #0f9d8a; color: white; border: none; padding: 4px 12px; 
                    border-radius: 4px; font-size: 0.8rem; font-weight: 600; cursor: pointer;
                    transition: opacity 0.2s;
                }
                .ab-gen-btn:hover { opacity: 0.9; }
                .ab-gen-btn:disabled { background: #94a3b8; cursor: not-allowed; }
                .badge-event-tag { font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
                .badge-footer { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px dashed #e2e8f0; font-size: 0.65rem; color: #94a3b8; text-align: center; }
                .preview-sticky { position: sticky; top: 2rem; }
            `}</style>
        </AuthorLayout>
    );
};

export default AuthorBadges;
