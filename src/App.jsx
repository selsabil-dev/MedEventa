// src/App.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Routes, Route, useNavigate } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";
import "./App.css";

import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import StepOne from "./components/StepOne";
import StepTwo from "./components/StepTwo";
import StepThree from "./components/StepThree";
import StepFour from "./components/StepFour";
import Sidebar from "./components/Sidebar";
import SuccessModal from "./components/SuccessModal";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import Profile from "./components/Profile";
import EditProfile from "./components/EditProfile";
import ContactPage from "./components/ContactPage";

// participant pages
import ParticipantDashboard from "./components/ParticipantDashboard";
import ParticipantOverview from "./components/ParticipantOverview";
import ParticipantRegistrations from "./components/ParticipantRegistrations";
import ParticipantCertificates from "./components/ParticipantCertificates";
import ParticipantProgramme from "./components/ParticipantProgramme";
import ParticipantSurveys from "./components/ParticipantSurveys";
import ActivityFeed from "./components/ActivityFeed";

// events
import EventsPage from "./components/EventsPage";
import EventDetailsPage from "./components/EventDetailsPage";

// sessions
import SessionLivePage from "./components/SessionLivePage";

// messages
import Messages from "./components/Messages";

// Author pages
import AuthorDashboard from "./components/AuthorDashboard";
import NewSubmission from "./components/NewSubmission";
import AuthorProgramme from "./components/AuthorProgramme";
import AuthorBadges from "./components/AuthorBadges";
import WorkshopManagerDashboard from "./components/WorkshopManagerDashboard"; // NEW
import CommitteeDashboard from "./components/CommitteeDashboard";
import GuestDashboard from "./components/GuestDashboard"; // NEW
import ProtectedRoute from "./components/ProtectedRoute";

// Admin pages
import AdminDashboard from "./components/AdminDashboard";
import AdminEvents from "./components/AdminEvents";
import AdminSessions from "./components/AdminSessions";
import AdminEvaluations from "./components/AdminEvaluations";
import AdminSubmissions from "./components/AdminSubmissions";
import AdminProgramme from "./components/AdminProgramme";
import AdminParticipants from "./components/AdminParticipants";
import AdminWorkshops from "./components/AdminWorkshops";
import AdminQA from "./components/AdminQA";
import AdminMessages from "./components/AdminMessages";
import AdminCertificates from "./components/AdminCertificates";
import AdminEventForm from "./components/AdminEventForm";

// Super Admin pages
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import SuperAdminUsers from "./components/SuperAdminUsers";
import SuperAdminEvents from "./components/SuperAdminEvents";
import SuperAdminSettings from "./components/SuperAdminSettings";

function SignupFlow() {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const formRef = useRef(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    photo: null,
    email: "",
    password: "",
    confirmPassword: "",
    googleAuth: false,
    photoURL: "",
    code: "",
    role: "",
    domaine: "",
    institution: "",
    acceptTerms: false,
  });

  const updateFormData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleNext = async () => {
    if (!formRef.current) return;
    if (!formRef.current.reportValidity()) return;

    setErrorMsg("");

    if (step === 2) {
      // Check password matching
      if (!formData.googleAuth) {
        if (formData.password !== formData.confirmPassword) {
          setErrorMsg("Passwords do not match.");
          return;
        }
        // Basic pattern check to match backend
        const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
        if (!passRegex.test(formData.password)) {
          setErrorMsg(
            "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number."
          );
          return;
        }
      }

      // Moving from Account info -> Email confirmation
      try {
        // Send verification code
        const trimmedEmail = formData.email ? formData.email.trim() : "";
        await axios.post("/api/auth/send-code", { email: trimmedEmail });
        nextStep();
      } catch (error) {
        console.error("Failed to send code", error);

        let msg = "Could not send verification email.";
        if (error.response) {
          msg = `Server Error (${error.response.status}): ${error.response.data?.message || "Internal Server Error"
            }`;
        } else if (error.request) {
          msg =
            "Network Error: Unable to reach the server. Is the backend running on port 5000?";
        } else {
          msg = `Error: ${error.message}`;
        }

        setErrorMsg(msg);
        return;
      }
    } else if (step === 3) {
      // Moving from Email confirmation -> Professional info
      try {
        const trimmedEmail = formData.email ? formData.email.trim() : "";
        const trimmedCode = formData.code ? formData.code.trim() : "";
        await axios.post("/api/auth/verify-code", {
          email: trimmedEmail,
          code: trimmedCode,
        });
        nextStep();
      } catch (error) {
        console.error("Invalid code", error);
        const msg =
          error.response?.data?.message ||
          "Invalid verification code. Please try again.";
        setErrorMsg(msg);
        return;
      }
    } else {
      nextStep();
    }
  };

  const handleFinish = async (e) => {
    e.preventDefault();
    if (!formRef.current) return;
    if (!formRef.current.reportValidity()) return;

    let photoUrl = formData.photoURL;

    if (!photoUrl && formData.photo) {
      photoUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(formData.photo);
      });
    }

    try {
      // 1. Prepare data as JSON
      const registerData = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        mot_de_passe: formData.password,
        role: (formData.role || "PARTICIPANT").toUpperCase(),
        domaine_recherche: formData.domaine,
        institution: formData.institution,
        photo: photoUrl,
      };

      // 2. Send to backend as JSON
      const response = await axios.post("/api/auth/register", registerData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 201 || response.status === 200) {
        // 3. Auto-login since backend register doesn't return token
        try {
          const loginRes = await axios.post("/api/auth/login", {
            email: formData.email,
            mot_de_passe: formData.password,
          });

          if (loginRes.data.token && loginRes.data.user) {
            localStorage.setItem("token", loginRes.data.token);
            localStorage.setItem("user", JSON.stringify(loginRes.data.user));
          }
        } catch (loginErr) {
          console.error("Auto-login failed:", loginErr);
          // We still show success for signup even if auto-login fails
        }

        setShowSuccess(true);
      }
    } catch (error) {
      console.error("Signup error:", error);
      let errorMsg = "Signup failed. Please try again.";

      if (error.response?.data?.errors) {
        // Handle express-validator errors
        errorMsg = error.response.data.errors.map((err) => err.msg).join("\n");
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }

      alert(errorMsg);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccess(false);
    // Reload to ensure Navbar and all components see the new localStorage user/token
    window.location.href = "/";
  };

  const renderStep = () => {
    if (step === 1) {
      return <StepOne formData={formData} updateFormData={updateFormData} />;
    }
    if (step === 2) {
      return <StepTwo formData={formData} updateFormData={updateFormData} />;
    }
    if (step === 3) {
      return <StepThree formData={formData} updateFormData={updateFormData} />;
    }
    return <StepFour formData={formData} updateFormData={updateFormData} />;
  };

  return (
    <>
      <div className="signup-wrapper">
        <div className="app-container">
          <Sidebar currentStep={step} />

          <div className="content-area">
            <form ref={formRef} className="step-content" noValidate>
              {errorMsg && (
                <div className="signup-error-message">
                  <FaExclamationTriangle /> {errorMsg}
                </div>
              )}
              {renderStep()}
            </form>

            <div className="navigation-buttons">
              <button
                type="button"
                className="btn-previous"
                onClick={prevStep}
                disabled={step === 1}
              >
                Previous
              </button>

              <button
                type="button"
                className="btn-next"
                onClick={step < 4 ? handleNext : handleFinish}
              >
                {step < 4 ? "Next" : "Finish signup"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSuccess && <SuccessModal onClose={handleSuccessConfirm} />}
    </>
  );
}

function App() {
  const navigate = useNavigate();

  // admin‑created events (dynamic)
  const [adminEvents] = useState([]);

  // shared participant registrations
  const [registrations, setRegistrations] = useState([]);
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;
  const token = localStorage.getItem("token");

  // Fetch dashboard registrations on mount
  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!user?.id || !token) return;
      try {
        const response = await axios.get("/api/inscriptions/my-registrations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRegistrations(response.data.registrations || []);
      } catch (err) {
        console.error("Error fetching registrations:", err);
      }
    };

    fetchRegistrations();
  }, [user?.id, token]);

  // Listen for registration updates (real-time from EventDetailsPage)
  useEffect(() => {
    const handleRegistrationUpdate = (event) => {
      const newRegistration = event.detail;

      // Check if registration already exists (avoid duplicates)
      setRegistrations((prev) => {
        const exists = prev.some(
          (reg) =>
            (reg.id === newRegistration.id && reg.type === newRegistration.type) ||
            (reg.title === newRegistration.title &&
              reg.type === newRegistration.type &&
              reg.date === newRegistration.date)
        );

        if (!exists) {
          return [...prev, newRegistration];
        }
        return prev;
      });
    };

    window.addEventListener("registration-updated", handleRegistrationUpdate);

    return () => {
      window.removeEventListener(
        "registration-updated",
        handleRegistrationUpdate
      );
    };
  }, []);

  const addRegistration = (registration) => {
    setRegistrations((prev) => {
      // similar duplicate check
      const exists = prev.some((reg) => reg.id === registration.id && reg.type === registration.type);
      if (!exists) return [...prev, registration];
      return prev;
    });
  };

  return (
    <Routes>
      {/* Public pages */}
      <Route
        path="/"
        element={
          <HomePage
            onGoLogin={() => navigate("/login")}
            onGoSignup={() => navigate("/signup")}
            onGoProfile={() => navigate("/profile")}
            onGoContact={() => navigate("/contact")}
            onGoParticipantDashboard={() => navigate("/participant/dashboard")}
          />
        }
      />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot" element={<ForgotPasswordPage />} />
      <Route path="/reset" element={<ResetPasswordPage />} />

      {/* Profile */}
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/edit" element={<EditProfile />} />

      {/* Contact */}
      <Route path="/contact" element={<ContactPage />} />

      {/* Participant pages */}
      <Route
        path="/participant/dashboard"
        element={
          <ParticipantDashboard
            registrations={registrations}
            onGoRegistrations={() => navigate("/participant/registrations")}
            onGoCertificates={() => navigate("/participant/certificates")}
            onGoProgramme={() => navigate("/participant/programme")}
            onGoSurveys={() => navigate("/participant/surveys")}
            onGoOverview={() => navigate("/participant/overview")}
            onGoActivity={() => navigate("/participant/activity")}
            onGoHome={() => navigate("/")}
            onAddRegistration={addRegistration}
          />
        }
      />

      <Route
        path="/participant/registrations"
        element={<ParticipantRegistrations registrations={registrations} />}
      />

      <Route
        path="/participant/certificates"
        element={<ParticipantCertificates registrations={registrations} />}
      />

      <Route
        path="/participant/programme"
        element={<ParticipantProgramme registrations={registrations} />}
      />

      <Route
        path="/participant/surveys"
        element={<ParticipantSurveys registrations={registrations} />}
      />

      <Route path="/participant/overview" element={<ParticipantOverview />} />

      {/* Activity feed */}
      <Route path="/participant/activity" element={<ActivityFeed />} />

      {/* Signup */}
      <Route path="/signup" element={<SignupFlow />} />

      {/* Events list + details, with admin events */}
      <Route
        path="/events"
        element={<EventsPage extraEvents={adminEvents} />}
      />
      <Route path="/events/:id" element={<EventDetailsPage />} />

      {/* Sessions */}
      <Route path="/sessions/:sessionId/live" element={<SessionLivePage />} />

      {/* Messages */}
      <Route path="/messages" element={<Messages />} />

      {/* Author Space */}
      {/* Author Space - Protected */}
      <Route
        path="/author/dashboard"
        element={
          <ProtectedRoute allowedRoles={["COMMUNICANT", "SUPER_ADMIN"]}>
            <AuthorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/author/new-submission"
        element={
          <ProtectedRoute allowedRoles={["COMMUNICANT", "SUPER_ADMIN"]}>
            <NewSubmission />
          </ProtectedRoute>
        }
      />
      <Route
        path="/author/programme"
        element={
          <ProtectedRoute allowedRoles={["COMMUNICANT", "SUPER_ADMIN"]}>
            <AuthorProgramme />
          </ProtectedRoute>
        }
      />
      <Route
        path="/author/badges"
        element={
          <ProtectedRoute allowedRoles={["COMMUNICANT", "SUPER_ADMIN"]}>
            <AuthorBadges />
          </ProtectedRoute>
        }
      />

      {/* Workshop Manager Space */}
      <Route
        path="/workshop-manager/dashboard"
        element={
          <ProtectedRoute allowedRoles={["RESP_WORKSHOP", "SUPER_ADMIN"]}>
            <WorkshopManagerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Committee Space */}
      <Route
        path="/committee/dashboard"
        element={
          <ProtectedRoute allowedRoles={["MEMBRE_COMITE", "SUPER_ADMIN"]}>
            <CommitteeDashboard />
          </ProtectedRoute>
        }
      />

      {/* Guest Space */}
      <Route
        path="/guest/dashboard"
        element={
          <ProtectedRoute allowedRoles={["INVITE", "SUPER_ADMIN"]}>
            <GuestDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin / Organizer Space */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["ORGANISATEUR", "SUPER_ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events"
        element={
          <ProtectedRoute allowedRoles={["ORGANISATEUR", "SUPER_ADMIN"]}>
            <AdminEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sessions"
        element={
          <ProtectedRoute allowedRoles={["ORGANISATEUR", "SUPER_ADMIN"]}>
            <AdminSessions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/evaluations"
        element={
          <ProtectedRoute allowedRoles={["ORGANISATEUR", "SUPER_ADMIN"]}>
            <AdminEvaluations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/submissions"
        element={
          <ProtectedRoute allowedRoles={["ORGANISATEUR", "SUPER_ADMIN"]}>
            <AdminSubmissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/programme"
        element={
          <ProtectedRoute allowedRoles={["ORGANISATEUR", "SUPER_ADMIN"]}>
            <AdminProgramme />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/participants"
        element={
          <ProtectedRoute allowedRoles={["ORGANISATEUR", "SUPER_ADMIN"]}>
            <AdminParticipants />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/workshops"
        element={
          <ProtectedRoute allowedRoles={["ORGANISATEUR", "SUPER_ADMIN"]}>
            <AdminWorkshops />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/qa-surveys"
        element={
          <ProtectedRoute allowedRoles={["ORGANISATEUR", "SUPER_ADMIN"]}>
            <AdminQA />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/messages"
        element={
          <ProtectedRoute allowedRoles={["ORGANISATEUR", "SUPER_ADMIN"]}>
            <AdminMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/certificates"
        element={
          <ProtectedRoute allowedRoles={["ORGANISATEUR", "SUPER_ADMIN"]}>
            <AdminCertificates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events/new"
        element={
          <ProtectedRoute allowedRoles={["ORGANISATEUR", "SUPER_ADMIN"]}>
            <AdminEventForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events/edit/:id"
        element={
          <ProtectedRoute allowedRoles={["ORGANISATEUR", "SUPER_ADMIN"]}>
            <AdminEventForm />
          </ProtectedRoute>
        }
      />

      {/* Super Admin Routes */}
      <Route
        path="/superadmin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/users"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/events"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdminEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/settings"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdminSettings />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
