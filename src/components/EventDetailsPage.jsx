// src/components/EventDetailsPage.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import NavBar from "./NavBar";
import {
  FaCalendarAlt,
  FaUsers,
  FaChalkboardTeacher,
  FaUserTie,
  FaMapMarkerAlt,
  FaDownload,
  FaRegCreditCard,
  FaUserCircle,
  FaInfoCircle,
  FaUserFriends,
  FaUserGraduate,
  FaClipboard,
  FaMicrophone,
  FaBuilding,
  FaGlobe,
  FaPhone,
  FaEnvelope,
  FaStar,
  FaArrowLeft,
  FaHome,
  FaPaperPlane,
  FaFilePdf,
  FaUpload,
  FaCheck,
  FaTimes,
  FaPen,
  FaBook,
  FaClock,
  FaLayerGroup,
  FaSpinner,
  FaFilter,
  FaQuestionCircle,
  FaThumbsUp,
  FaThumbsDown,
  FaTrash,
} from "react-icons/fa";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import axios from "axios";
import { hasPermission } from "../utils/permissions";
import "./EventDetailsPage.css";
// Import section components
import EventInfoSection from "./EventDetailsPage/EventInfoSection";
import EventCommitteeSection from "./EventDetailsPage/EventCommitteeSection";
import EventGuestsSection from "./EventDetailsPage/EventGuestsSection";
import EventSummarySection from "./EventDetailsPage/EventSummarySection";
import EventProgramSection from "./EventDetailsPage/EventProgramSection";
import EventCallSection from "./EventDetailsPage/EventCallSection";
import EventQASection from "./EventDetailsPage/EventQASection";
import EventFeedbackSection from "./EventDetailsPage/EventFeedbackSection"; // Add this import

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const event = location.state?.event;

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [activeSection, setActiveSection] = useState("info");
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Workshop and Session Registration States
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [workshopError, setWorkshopError] = useState("");
  const [eventRegistrationError, setEventRegistrationError] = useState("");
  const [submissionError, setSubmissionError] = useState("");

  // Event Registration Modal
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("onsite");
  const [inscriptionData, setInscriptionData] = useState(null);
  const [badgeReady, setBadgeReady] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Program Filter State
  const [programFilter, setProgramFilter] = useState("all"); // "all", "conferences", "workshops", "sessions"

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organisation, setOrganisation] = useState("");

  // Payment form states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [paymentFormError, setPaymentFormError] = useState("");

  // Workshop/Session Registration Form
  const [workshopSessionForm, setWorkshopSessionForm] = useState({
    notes: "",
    dietaryRequirements: "",
    specialNeeds: "",
  });

  // Submission form state
  const [submissionForm, setSubmissionForm] = useState({
    title: "",
    abstract: "",
    authors: "",
    keywords: "",
    correspondingAuthor: "",
    email: "",
    phone: "",
    institution: "",
    presentationType: "oral",
    file: null,
    fileName: "",
    termsAccepted: false,
  });

  // Q&A States
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [questionSort, setQuestionSort] = useState("popular"); // "popular" or "recent"
  const [questionLikes, setQuestionLikes] = useState({}); // Track which questions user has liked
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionError, setQuestionError] = useState("");
  const [questionSuccess, setQuestionSuccess] = useState(false);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null); // For delete confirmation
  const [eventDetails, setEventDetails] = useState(null); // Full event details from API

  // Feedback States
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const badgeRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);

  // Get current user from API
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data && response.data.user) {
          // Normalize to frontend expected fields (name instead of nom/prenom)
          const user = response.data.user;
          user.name = `${user.prenom} ${user.nom}`;
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Error fetching user profile from /api/auth/me:", error);
        // Fallback to localStorage if /api/auth/me fails (prevent breaking the page)
        try {
          const raw = localStorage.getItem("user");
          if (raw) setCurrentUser(JSON.parse(raw));
        } catch (e) {
          console.error("LocalStorage fallback failed:", e);
        }
      }
    };
    fetchUser();
  }, []);

  // Fetch event details from API
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!id) return;
      try {
        const response = await axios.get(`/api/events/${id}`);
        if (response.data) {
          setEventDetails(response.data);
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
        // Ensure eventDetails is not null to prevent crashes
        if (!eventDetails) {
          setEventDetails({ id: id, titre: "Event Details", description: "" });
        }
      }
    };
    fetchEventDetails();
  }, [id]);

  // Fetch program data (sessions and communications)
  const [backendSessions, setBackendSessions] = useState([]);
  useEffect(() => {
    const fetchProgram = async () => {
      console.log('fetchProgram calling with id:', id);
      if (!id) return;
      try {
        const response = await axios.get(`/api/events/${id}/program`);
        console.log('Sessions API Response:', response.data);
        if (response.data && response.data.sessions) {
          console.log(`Found ${response.data.sessions.length} sessions`);
          setBackendSessions(response.data.sessions);
        } else {
          console.log('No sessions property in API response or empty');
          setBackendSessions([]);
        }
      } catch (err) {
        console.error("Error fetching program:", err);
        if (err.response) {
          console.log('Error status:', err.response.status);
          console.log('Error data:', err.response.data);
        }
        setBackendSessions([]);
      }
    };
    fetchProgram();

    // Listen for session creation events
    const handleSessionCreated = (event) => {
      if (event.detail.eventId === id) {
        fetchProgram();
      }
    };

    window.addEventListener('session-created', handleSessionCreated);
    return () => window.removeEventListener('session-created', handleSessionCreated);
  }, [id]);

  // Fetch workshops from backend
  const [backendWorkshops, setBackendWorkshops] = useState([]);
  useEffect(() => {
    const fetchWorkshops = async () => {
      if (!id) return;
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`/api/events/${id}/workshops`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Workshops API Response:', response.data);
        if (response.data && Array.isArray(response.data)) {
          const mappedWorkshops = response.data.map(w => {
            const wDate = w.date ? new Date(w.date) : null;
            const wDay = wDate ? wDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }) : 'TBA';

            return {
              id: w.id,
              _id: w.id ? w.id.toString() : Math.random().toString(),
              title: w.titre,
              trainer: w.responsable_nom ? `${w.responsable_prenom} ${w.responsable_nom}` : 'Workshop Leader',
              time: wDate ? wDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }) : 'TBA',
              room: w.salle || 'TBA',
              day: wDay,
              capacity: w.nb_places || 30,
              registeredCount: w.registered_count || 0,
              level: w.level || 'Intermediate',
              description: w.description || 'Workshop session',
              price: w.price || 0,
              ouvert: w.ouvert !== undefined ? w.ouvert : true
            };
          });
          console.log('Mapped Workshops:', mappedWorkshops);
          setBackendWorkshops(mappedWorkshops);
        } else {
          setBackendWorkshops([]);
        }
      } catch (err) {
        console.error('Error fetching workshops:', err);
        setBackendWorkshops([]);
      }
    };
    fetchWorkshops();

    // Listen for workshop creation events
    const handleWorkshopCreated = (event) => {
      if (event.detail.eventId === id) {
        fetchWorkshops();
      }
    };

    window.addEventListener('workshop-created', handleWorkshopCreated);
    return () => window.removeEventListener('workshop-created', handleWorkshopCreated);
  }, [id]);

  // Auto-fill form with user data if available
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setOrganisation(currentUser.organisation || "");
      setCardHolderName(currentUser.name || "");
    }
  }, [currentUser]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch questions from backend
  const fetchQuestions = React.useCallback(async () => {
    if (!id) return;
    try {
      setLoadingQuestions(true);
      const response = await axios.get(`/api/events/${id}/questions`);
      if (response.data && response.data.questions) {
        setQuestions(response.data.questions);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoadingQuestions(false);
    }
  }, [id]);

  // Fetch questions when Q&A section is active
  useEffect(() => {
    if (activeSection === "qa" && id) {
      fetchQuestions();
    }
  }, [activeSection, id, fetchQuestions]);



  // Submit a question
  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    setQuestionError("");
    setQuestionSuccess(false);

    if (!currentUser) {
      setQuestionError("Please log in to ask a question");
      return;
    }

    if (!questionText.trim()) {
      setQuestionError("Please enter your question");
      return;
    }

    if (questionText.length > 500) {
      setQuestionError("Question must be 500 characters or less");
      return;
    }

    try {
      setSubmittingQuestion(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `/api/events/${id}/questions/submit`,
        { contenu: questionText.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        setQuestionText("");
        setQuestionSuccess(true);
        setTimeout(() => setQuestionSuccess(false), 3000);
        await fetchQuestions(); // Refresh questions
      }
    } catch (error) {
      console.error("Error submitting question:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        "Failed to submit question. Please try again.";
      setQuestionError(errorMsg);
    } finally {
      setSubmittingQuestion(false);
    }
  };

  // Like a question
  const handleLikeQuestion = async (questionId) => {
    if (!currentUser) {
      setQuestionError("Please log in to like questions");
      setTimeout(() => setQuestionError(""), 3000);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `/api/questions/${questionId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        // Update local state
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? {
                ...q,
                likes: response.data.totals?.likes || (q.likes || 0) + 1,
              }
              : q
          )
        );
        setQuestionLikes((prev) => ({
          ...prev,
          [questionId]: !prev[questionId],
        }));
      }
    } catch (error) {
      console.error("Error liking question:", error);
      // Silently fail for likes to not interrupt UX
    }
  };

  // Delete a question (only by author)
  const confirmDeleteQuestion = (questionId) => {
    setQuestionToDelete(questionId);
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/questions/${questionToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setQuestionToDelete(null);
      await fetchQuestions(); // Refresh questions
    } catch (error) {
      console.error("Error deleting question:", error);
      setQuestionError("Failed to delete question. Please try again.");
      setTimeout(() => setQuestionError(""), 3000);
      setQuestionToDelete(null);
    }
  };

  // Submit feedback
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setFeedbackError("");

    if (!currentUser) {
      setFeedbackError("Please log in to submit feedback");
      return;
    }

    if (feedbackRating === 0) {
      setFeedbackError("Please select a rating");
      return;
    }

    if (!feedbackComment.trim()) {
      setFeedbackError("Please enter your feedback comment");
      return;
    }

    try {
      setLoadingFeedback(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `/api/events/${id}/feedback`,
        {
          rating: feedbackRating,
          comment: feedbackComment.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        setFeedbackSubmitted(true);
        // Reset form
        setFeedbackRating(0);
        setFeedbackComment("");
        setTimeout(() => setFeedbackSubmitted(false), 5000);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        "Failed to submit feedback. Please try again.";
      setFeedbackError(errorMsg);
    } finally {
      setLoadingFeedback(false);
    }
  };

  // Sort questions based on sort type
  const sortedQuestions = useMemo(() => {
    const sorted = [...questions];
    if (questionSort === "popular") {
      return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else {
      // Recent - sort by id (assuming higher id = more recent)
      return sorted.sort((a, b) => b.id - a.id);
    }
  }, [questions, questionSort]);

  const { startDate, endDate } = event || {};

  // Demo data for missing sections
  const eventInfo = event?.info || {
    title: event?.name,
    description: event?.description,
    dates: `${startDate} - ${endDate}`,
    location: event?.location || "Paris Convention Center",
    address: "1 Avenue de la Convention, 75015 Paris, France",
    website: "www.medeventa-conference.com",
    contactEmail: "contact@medeventa.com",
    contactPhone: "+33 1 23 45 67 89",
    capacity: "500 participants",
    language: "French & English",
    accreditation: "CME credits available",
  };

  // Call for Communications data
  const callForPapers = {
    title: "Call for Communications",
    deadline: eventDetails?.event?.date_limite_communication
      ? new Date(eventDetails.event.date_limite_communication).toLocaleDateString()
      : "Coming Soon",
    notificationDate: "TBA",
    guidelines: [
      "Abstracts must be submitted in English or French",
      "Maximum 300 words for abstract",
      "Include 3-5 keywords",
      "Specify presentation preference (Oral, Poster, Workshop)",
      "All submissions will undergo peer review",
      "Accepted abstracts will be published in the conference proceedings",
    ],
    topics: [
      "Scientific Research",
      "Innovation in Healthcare",
      "Medical Education",
    ],
    contact: {
      name: "Scientific Committee",
      email: eventDetails?.event?.contact || "contact@medeventa.com",
      phone: "TBA",
    },
  };

  const committeeMembers = eventDetails?.comite || [];

  const guests = eventDetails?.invites || [];

  const summaryContent = event?.summary || {
    abstract: eventDetails?.event?.description || `The MEDEVENTA congress brings together healthcare professionals, researchers, and innovators.`,
    objectives: [
      "Share the latest scientific and clinical advances",
      "Facilitate exchanges between healthcare professionals",
      "Present technological innovations in medicine",
    ],
    targetAudience: [
      "Doctors of all specialties",
      "Surgeons",
      "Medical science researchers",
    ],
  };

  // Generate days array from event start and end dates
  const days = useMemo(() => {
    const eventDateDebut = eventDetails?.event?.date_debut || eventDetails?.date_debut;
    const eventDateFin = eventDetails?.event?.date_fin || eventDetails?.date_fin;

    if (!eventDateDebut || !eventDateFin) {
      return ['Day 1'];
    }

    const start = new Date(eventDateDebut);
    const end = new Date(eventDateFin);
    const daysList = [];

    const currentDate = new Date(start);
    while (currentDate <= end) {
      daysList.push(currentDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return daysList.length > 0 ? daysList : ['Day 1'];
  }, [eventDetails]);
  const activeDay = days[activeDayIndex] || days[0];

  // Enhanced program data with registration functionality
  // Old mock data for conferences removed in favor of dynamic generation below

  // Use backend workshops if available, otherwise fall back to demo data
  const workshops =
    backendWorkshops.length > 0
      ? backendWorkshops
      : event?.workshops || [
        {
          id: 1,
          _id: "workshop1",
          title: "Design as a Competitive Edge in Medical Devices",
          trainer: "Elena Rodriguez",
          time: "11:30 AM - 01:00 PM",
          room: "Studio B",
          day: "Feb 15, 2026",
          capacity: 30,
          registeredCount: 15,
          level: "Intermediate",
          description:
            "Hands-on workshop focusing on user-centered design in medical device development.",
        },
        {
          id: 2,
          _id: "workshop2",
          title: "Hands-on Surgical Robotics",
          trainer: "Dr. Kenji Tanaka",
          time: "02:00 PM - 05:00 PM",
          room: "Lab 3",
          day: "Feb 16, 2026",
          capacity: 15,
          registeredCount: 8,
          level: "Advanced",
          description:
            "Practical session with state-of-the-art surgical robotics equipment.",
        },
        {
          id: 3,
          _id: "workshop3",
          title: "Medical Data Visualization Techniques",
          trainer: "Dr. Sarah Johnson",
          time: "09:00 AM - 12:00 PM",
          room: "Studio A",
          day: "Feb 15, 2026",
          capacity: 25,
          registeredCount: 20,
          level: "Beginner",
          description:
            "Learn how to effectively visualize complex medical data for clinical decision making.",
        },
      ];

  const sessions = backendSessions.map(s => ({
    id: s.id,
    _id: s.id.toString(),
    title: s.titre,
    chair: s.president_nom ? `${s.president_prenom} ${s.president_nom}` : (s.president_id || "Scientific Chair"),
    time: s.horaire ? new Date(s.horaire).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }) : "TBA",
    room: s.salle || "TBA",
    day: s.horaire && (eventDetails?.event?.date_debut || eventDetails?.date_debut)
      ? new Date(s.horaire).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      : days[0] || 'Day 1',
    type: "plenary",
    capacity: 50,
    registeredCount: 0,
    description: `Scientific session on ${s.titre}`,
    communications: s.communications || []
  }));
  console.log('Final Mapped Sessions:', sessions);

  const speakers = event?.speakers || [
    {
      id: 1,
      name: "Dr. Aris Thorne",
      role: "Principal Researcher",
      organisation: "Quantum Dynamics",
      bio: "Pioneer in quantum computing and distributed architecture systems for healthcare.",
      country: "USA",
    },
    {
      id: 2,
      name: "Elena Rodriguez",
      role: "Head of UX",
      organisation: "Creative Studio",
      bio: "Focuses on human‑centric AI design and ethical interfaces for medical applications.",
      country: "Spain",
    },
    {
      id: 3,
      name: "Marcus Chen",
      role: "VP Engineering",
      organisation: "CloudScale",
      bio: "Architecting the backbone of global serverless infrastructures for healthcare systems.",
      country: "Singapore",
    },
    {
      id: 4,
      name: "Prof. Michael Johnson",
      role: "Department Head",
      organisation: "Harvard Medical School",
      bio: "Leading researcher in personalized medicine and genomic data analysis.",
      country: "USA",
    },
  ];

  const paymentStatus =
    inscriptionData?.paymentStatus ||
    (paymentMethod === "onsite" ? "a_payer" : "a_payer");

  const badgeCode = `MEDE-${paymentStatus === "a_payer" ? "NP" : "OK"}-${(inscriptionData?.fullName || currentUser?.name || "G")[0] || "G"
    }`.toUpperCase();

  // Handle submission form changes
  const handleSubmissionChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      const file = files[0];
      setSubmissionForm((prev) => ({
        ...prev,
        file: file,
        fileName: file ? file.name : "",
      }));
    } else if (type === "checkbox") {
      setSubmissionForm((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setSubmissionForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle submission form submission
  const handleSubmitSubmission = async (e) => {
    e.preventDefault();

    // Check if user has permission to submit or is the event organizer
    const organizerId =
      eventDetails?.event?.id_organisateur || eventDetails?.id_organisateur;
    const isOrganizer = currentUser && organizerId && currentUser.id === organizerId;
    const canSubmit = hasPermission(currentUser, 'submit_communication') || isOrganizer;

    if (!canSubmit) {
      setSubmissionError("You don't have permission to submit to this event.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      // Map form fields to backend expected field names
      formData.append("titre", submissionForm.title);
      formData.append("resume", submissionForm.abstract);
      formData.append("type", submissionForm.presentationType);
      // Add other fields if needed by backend
      if (submissionForm.authors)
        formData.append("authors", submissionForm.authors);
      if (submissionForm.keywords)
        formData.append("keywords", submissionForm.keywords);

      if (submissionForm.file) {
        formData.append("resumePdf", submissionForm.file);
      }

      // eventId is in the URL, not needed in body

      const response = await axios.post(
        `/api/events/${id}/submissions`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 201 || response.data.message) {
        setSubmissionSuccess(true);
        setSubmissionError("");

        // Reset form
        setSubmissionForm({
          title: "",
          abstract: "",
          authors: "",
          keywords: "",
          correspondingAuthor: "",
          email: "",
          phone: "",
          institution: "",
          presentationType: "oral",
          file: null,
          fileName: "",
          termsAccepted: false,
        });

        setTimeout(() => {
          setSubmissionSuccess(false);
          setShowSubmissionForm(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmissionError(
        error.response?.data?.message ||
        "Failed to submit abstract. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle workshop registration
  const handleWorkshopRegister = (workshop) => {
    setSelectedWorkshop(workshop);
    if (currentUser?.role?.toUpperCase() !== "PARTICIPANT") {
      setWorkshopError("Only participants can register for workshops.");
      setShowWorkshopModal(true);
      return;
    }
    setSelectedWorkshop(workshop);
    setShowWorkshopModal(true);
    setWorkshopError("");
  };

  // Handle session registration
  const handleSessionRegister = (session) => {
    setSelectedSession(session);
    if (currentUser?.role?.toUpperCase() !== "PARTICIPANT") {
      setWorkshopError("Only participants can register for sessions.");
      setShowSessionModal(true);
      return;
    }
    setSelectedSession(session);
    setShowSessionModal(true);
    setWorkshopError("");
  };

  // Submit workshop registration
  const handleSubmitWorkshopRegistration = async (e) => {
    e.preventDefault();
    setRegistrationLoading(true);
    setWorkshopError("");

    try {
      const token = localStorage.getItem("token");

      // Backend expects an integer workshopId - use 'id' field (numeric)
      const workshopId = selectedWorkshop.id;

      if (!workshopId || typeof workshopId !== "number") {
        setWorkshopError(
          "Invalid workshop ID. Cannot register for this workshop. Please make sure you are registering for a workshop from the backend."
        );
        setRegistrationLoading(false);
        return;
      }

      // Backend doesn't expect a body, just the workshopId in URL
      const response = await axios.post(
        `/api/events/workshops/${workshopId}/register`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        setRegistrationSuccess(true);

        // Trigger dashboard update event with registration data
        const registrationData = {
          id: response.data.registrationId,
          type: "Workshop",
          title: selectedWorkshop.title,
          parent: event.name,
          place: selectedWorkshop.room || event.location || "",
          date: selectedWorkshop.day ? new Date(selectedWorkshop.day).toISOString() : new Date().toISOString(),
          status: "confirmed",
          paymentStatus: "a_payer",
        };

        window.dispatchEvent(
          new CustomEvent("registration-updated", {
            detail: registrationData,
          })
        );

        setTimeout(() => {
          setRegistrationSuccess(false);
          setShowWorkshopModal(false);
          setWorkshopSessionForm({
            notes: "",
            dietaryRequirements: "",
            specialNeeds: "",
          });
        }, 2000);
      }
    } catch (error) {
      console.error("Workshop registration error:", error);
      let errorMsg = "Failed to register for workshop. Please try again.";

      if (error.response) {
        // Backend returned an error response
        errorMsg =
          error.response.data?.message ||
          error.response.data?.error ||
          errorMsg;

        // Handle specific status codes with user-friendly messages
        if (error.response.status === 401) {
          errorMsg = "Please log in to register for workshops.";
        } else if (error.response.status === 403) {
          errorMsg =
            error.response.data?.message ||
            "You don't have permission to register for workshops.";
        } else if (error.response.status === 404) {
          errorMsg = error.response.data?.message || "Workshop not found.";
        } else if (error.response.status === 409) {
          errorMsg =
            error.response.data?.message ||
            "You are already registered for this workshop.";
        } else if (error.response.status === 400) {
          errorMsg =
            error.response.data?.message || "Invalid registration request.";
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMsg =
          "Unable to connect to the server. Please check your internet connection.";
      }

      setWorkshopError(errorMsg);
    } finally {
      setRegistrationLoading(false);
    }
  };

  // Submit session registration
  const handleSubmitSessionRegistration = async (e) => {
    e.preventDefault();
    // Note: Session registration endpoint is not available in the backend
    // Sessions are automatically assigned to users when they register for events
    setWorkshopError(
      "Session registration is not available. Sessions are automatically included when you register for the event."
    );
    setTimeout(() => {
      setShowSessionModal(false);
      setWorkshopError("");
      setWorkshopSessionForm({
        notes: "",
        dietaryRequirements: "",
        specialNeeds: "",
      });
    }, 3000);
  };

  // Handle workshop/session form changes
  const handleWorkshopSessionChange = (e) => {
    const { name, value } = e.target;
    setWorkshopSessionForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate payment form
  const validatePaymentForm = () => {
    if (paymentMethod === "online") {
      if (!cardNumber.trim()) {
        setPaymentFormError("Card number is required");
        return false;
      }
      if (!cardExpiry.trim()) {
        setPaymentFormError("Expiry date is required");
        return false;
      }
      if (!cardCvc.trim()) {
        setPaymentFormError("CVC is required");
        return false;
      }
      if (!cardHolderName.trim()) {
        setPaymentFormError("Card holder name is required");
        return false;
      }

      // Simple validation for card number (16 digits)
      const cardNumberClean = cardNumber.replace(/\s/g, "");
      if (!/^\d{16}$/.test(cardNumberClean)) {
        setPaymentFormError("Card number must be 16 digits");
        return false;
      }

      // Simple validation for expiry date (MM/YY)
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        setPaymentFormError("Expiry date must be in MM/YY format");
        return false;
      }

      // Simple validation for CVC (3 digits)
      if (!/^\d{3}$/.test(cardCvc)) {
        setPaymentFormError("CVC must be 3 digits");
        return false;
      }
    }

    setPaymentFormError("");
    return true;
  };

  // Handle event registration
  const handleConfirmRegistration = async (e) => {
    e.preventDefault();

    // Validate payment form if online payment is selected
    if (paymentMethod === "online" && !validatePaymentForm()) {
      return;
    }

    setLoading(true);
    setEventRegistrationError("");
    setPaymentFormError("");

    try {
      const token = localStorage.getItem("token");

      // Register the user for the event - ensure uppercase role and correct data
      const response = await axios.post(
        `/api/inscriptions/register/${id}`,
        {
          profil: (currentUser?.role || "PARTICIPANT").toUpperCase(),
          nom: currentUser?.nom || fullName,
          prenom: currentUser?.prenom || fullName.split(' ')[0],
          email: currentUser?.email || email
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        const inscriptionId = response.data.inscriptionId;

        // If online payment, update payment status
        if (paymentMethod === "online") {
          setProcessingPayment(true);

          try {
            // Update payment status using the correct endpoint and value
            const updateResponse = await axios.put(
              `/api/inscriptions/${inscriptionId}/payment-status`,
              { statut_paiement: "paye_en_ligne" },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (updateResponse.status === 200) {
              // Online payment successful
              setInscriptionData({
                ...response.data,
                inscriptionId,
                fullName,
                email,
                organisation,
              });
              setBadgeReady(true);
              setShowRegistrationModal(false);
              setProcessingPayment(false);

              // Trigger dashboard update with registration data
              const dashboardData = {
                id: inscriptionId, // Use real ID
                type: "Event",
                title: event.name,
                parent: "",
                place: event.location || "",
                date: event.startDate ? new Date(event.startDate).toISOString() : new Date().toISOString(),
                status: "confirmed",
                paymentStatus: "paye_en_ligne",
              };

              window.dispatchEvent(
                new CustomEvent("registration-updated", {
                  detail: dashboardData,
                })
              );
            }
          } catch (paymentError) {
            console.error("Payment processing error:", paymentError);
            setEventRegistrationError(
              paymentError.response?.data?.message ||
              "Payment processing failed. Please try again or contact support."
            );
            setProcessingPayment(false);
            setLoading(false);
            return;
          }
        } else {
          // For onsite payment, complete registration
          setInscriptionData({
            ...response.data,
            inscriptionId,
            fullName,
            email,
            organisation,
          });
          setBadgeReady(true);
          setShowRegistrationModal(false);
          setEventRegistrationError("");

          // Trigger dashboard update with registration data
          const dashboardData = {
            id: inscriptionId, // Use real ID
            type: "Event",
            title: event.name,
            parent: "",
            place: event.location || "",
            date: event.startDate ? new Date(event.startDate).toISOString() : new Date().toISOString(),
            status: "confirmed",
            paymentStatus: "a_payer",
          };

          window.dispatchEvent(
            new CustomEvent("registration-updated", {
              detail: dashboardData,
            })
          );
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      setEventRegistrationError(
        error.response?.data?.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBadge = async () => {
    if (!badgeRef.current) return;

    const canvas = await html2canvas(badgeRef.current);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 20, width, height);
    pdf.save("badge.pdf");
  };

  // Section navigation
  const sections = [
    { id: "info", label: "Info", icon: <FaInfoCircle /> },
    { id: "committee", label: "Committee", icon: <FaUserFriends /> },
    { id: "guests", label: "Guests", icon: <FaUserGraduate /> },
    { id: "summary", label: "Summary", icon: <FaClipboard /> },
    { id: "program", label: "Program", icon: <FaCalendarAlt /> },
    { id: "call", label: "Call for Communications", icon: <FaPaperPlane /> },
    { id: "qa", label: "Q&A", icon: <FaQuestionCircle /> },
  ];

  // Filtered data based on program filter
  // Generate "conferences" based on the event details (one per day or just one main one)
  // The user wants "all the conferences... with the same name of event"
  const conferences = useMemo(() => {
    if (!event || !days) return [];
    return days.map((day, index) => ({
      id: `conf-${index}`,
      title: event.name, // "same name of event"
      time: "09:00 AM - 05:00 PM", // Default time or derive from event
      room: event.location || "Main Hall",
      description: event.description,
      day: day, // Associate with each day
      speaker: "Various Speakers",
      type: "Conference"
    }));
  }, [event, days]);

  const filteredConferences = conferences.filter((c) => c.day === activeDay);
  const filteredWorkshops = backendWorkshops.filter((w) => w.day === activeDay);
  const filteredSessions = sessions.filter((s) => s.day === activeDay);

  // Determine what to show based on filter
  const showConferences =
    programFilter === "all" || programFilter === "conferences";
  const showWorkshops =
    programFilter === "all" || programFilter === "workshops";
  const showSessions = programFilter === "all" || programFilter === "sessions";

  // Render section content based on active section
  const renderSectionContent = () => {
    switch (activeSection) {
      case "info":
        return <EventInfoSection eventInfo={eventInfo} />;

      case "committee":
        return <EventCommitteeSection committeeMembers={committeeMembers} />;

      case "guests":
        return <EventGuestsSection guests={guests} />;

      case "summary":
        return <EventSummarySection summaryContent={summaryContent} />;

      case "program":
        return (
          <EventProgramSection
            days={days}
            activeDayIndex={activeDayIndex}
            setActiveDayIndex={setActiveDayIndex}
            programFilter={programFilter}
            setProgramFilter={setProgramFilter}
            filteredConferences={filteredConferences}
            filteredWorkshops={filteredWorkshops}
            filteredSessions={filteredSessions}
            showConferences={showConferences}
            showWorkshops={showWorkshops}
            showSessions={showSessions}
            currentUser={currentUser}
            handleWorkshopRegister={handleWorkshopRegister}
            handleSessionRegister={handleSessionRegister}
          />
        );

      case "qa":
        return (
          <>
            <EventQASection
              currentUser={currentUser}
              questionText={questionText}
              setQuestionText={setQuestionText}
              questionError={questionError}
              setQuestionError={setQuestionError}
              questionSuccess={questionSuccess}
              submittingQuestion={submittingQuestion}
              handleSubmitQuestion={handleSubmitQuestion}
              questionSort={questionSort}
              setQuestionSort={setQuestionSort}
              loadingQuestions={loadingQuestions}
              sortedQuestions={sortedQuestions}
              questionLikes={questionLikes}
              handleLikeQuestion={handleLikeQuestion}
              confirmDeleteQuestion={confirmDeleteQuestion}
            />
            <EventFeedbackSection
              currentUser={currentUser}
              feedbackRating={feedbackRating}
              setFeedbackRating={setFeedbackRating}
              feedbackComment={feedbackComment}
              setFeedbackComment={setFeedbackComment}
              feedbackSubmitted={feedbackSubmitted}
              feedbackError={feedbackError}
              setFeedbackError={setFeedbackError}
              loadingFeedback={loadingFeedback}
              handleSubmitFeedback={handleSubmitFeedback}
            />
          </>
        );

      case "call": {
        // Check if current user is the event organizer/author
        const organizerId =
          eventDetails?.event?.id_organisateur || eventDetails?.id_organisateur;
        const isOrganizer =
          currentUser && organizerId && currentUser.id === organizerId;
        const isAuthor =
          isOrganizer || hasPermission(currentUser, "submit_communication");

        return (
          <EventCallSection
            callForPapers={callForPapers}
            showSubmissionForm={showSubmissionForm}
            setShowSubmissionForm={setShowSubmissionForm}
            submissionSuccess={submissionSuccess}
            submissionError={submissionError}
            submissionForm={submissionForm}
            handleSubmissionChange={handleSubmissionChange}
            handleSubmitSubmission={handleSubmitSubmission}
            loading={loading}
            isAuthor={isAuthor}
          />
        );
      }

      default:
        return null;
    }
  };

  if (!event) {
    return (
      <div className="ed-page">
        <div className="ed-shell">
          <div className="ed-nav">
            <button
              className="ed-back-btn"
              type="button"
              onClick={() => navigate("/events")}
            >
              <FaArrowLeft /> Back to events
            </button>
          </div>
          <div className="ed-empty">
            <h1 className="ed-empty-title">Event not found</h1>
            <p className="ed-empty-text">
              No event data was provided for id {id}. Please return to the event
              list.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ed-page" >
      <NavBar />
      <div className="ed-shell">
        {/* TOP NAV */}
        <div className="ed-nav">
          <button
            className="ed-back-home-btn"
            type="button"
            onClick={() => navigate("/")}
          >
            <FaHome /> Back to Home
          </button>

          <div className="ed-logo">
            <div className="ed-logo-icon">NS</div>
            <span className="ed-logo-text">{event.name}</span>
          </div>

          <button
            type="button"
            className="ed-nav-cta"
            onClick={() => setShowRegistrationModal(true)}
          >
            Register for Event
          </button>
        </div>

        {/* HERO */}
        <header className="ed-hero">
          <div className="ed-hero-main">
            <span className="ed-hero-tag">
              {event.thematique || event.category || "Scientific event"}
            </span>
            <h1 className="ed-hero-title">{event.name}</h1>
            <p className="ed-hero-subtitle">{event.description}</p>

            <div className="ed-hero-meta-row">
              <div className="ed-hero-meta-card">
                <div className="ed-meta-label">Start date</div>
                <div className="ed-meta-value">
                  <FaCalendarAlt className="ed-meta-icon" />
                  {startDate}
                </div>
              </div>
              <div className="ed-hero-meta-card">
                <div className="ed-meta-label">End date</div>
                <div className="ed-meta-value">
                  <FaCalendarAlt className="ed-meta-icon" />
                  {endDate}
                </div>
              </div>
              {event.location && (
                <div className="ed-hero-meta-card">
                  <div className="ed-meta-label">Location</div>
                  <div className="ed-meta-value">
                    <FaMapMarkerAlt className="ed-meta-icon" />
                    {event.location}
                  </div>
                </div>
              )}
            </div>

            {badgeReady && (
              <div className="ed-hero-badge-hint">
                Your MEDEVENTA badge is ready. Use the button below to download
                it.
              </div>
            )}
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="ed-main">
          {/* Section Navigation */}
          <div className="ed-section-nav">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`ed-section-nav-btn ${activeSection === section.id ? "active" : ""
                  }`}
                onClick={() => setActiveSection(section.id)}
              >
                {section.icon}
                <span>{section.label}</span>
              </button>
            ))}
          </div>

          {/* Dynamic Section Content */}
          <div className="ed-active-section">{renderSectionContent()}</div>

          {/* Speakers section (always visible) */}
          <section className="ed-speakers-section">
            <div className="ed-section-header">
              <span className="ed-section-kicker">Speakers</span>
              <h2 className="ed-section-title">Speakers</h2>
            </div>
            <div className="ed-speakers-grid">
              {speakers.map((sp) => (
                <article key={sp.id} className="ed-speaker-card">
                  <div className="ed-speaker-avatar-wrap">
                    <FaUserTie className="ed-speaker-icon" />
                  </div>
                  <h3 className="ed-speaker-name">{sp.name}</h3>
                  <div className="ed-speaker-role">{sp.role}</div>
                  <div className="ed-speaker-org">{sp.organisation}</div>
                  <div className="ed-speaker-country">{sp.country}</div>
                  <p className="ed-speaker-bio">{sp.bio}</p>
                </article>
              ))}
            </div>
          </section>
        </main>

        {/* BADGE SECTION */}
        {badgeReady && (
          <section className="ed-badge-section">
            <div className="ed-section-header">
              <span className="ed-section-kicker">Badge</span>
              <h2 className="ed-section-title">Your badge</h2>
            </div>

            {/* hidden badge only for PDF generation */}
            <div
              style={{ position: "absolute", left: "-9999px", top: 0 }}
              aria-hidden="true"
            >
              <div ref={badgeRef} className="idcard">
                <div className="idcard-top">
                  <div className="idcard-brand">
                    <span className="idcard-brand-name">MEDEVENTA</span>
                    <span className="idcard-brand-sub">Scientific Events</span>
                  </div>
                </div>

                <div className="idcard-body">
                  <div className="idcard-avatar">
                    <FaUserCircle className="idcard-avatar-icon" />
                  </div>

                  <div className="idcard-main">
                    <div className="idcard-name">
                      {(
                        inscriptionData?.fullName ||
                        currentUser?.name ||
                        ""
                      ).toUpperCase() || "GUEST"}
                    </div>
                    <div className="idcard-role">
                      {paymentMethod === "online"
                        ? "Online Participant"
                        : "On-site Participant"}
                    </div>

                    <div className="idcard-payment">
                      Payment status:{" "}
                      {paymentStatus === "a_payer" ? "Not paid" : "Paid online"}
                    </div>

                    <div className="idcard-id-line">
                      <span className="idcard-id-label">Badge ID</span>
                      <span className="idcard-id-value">{badgeCode}</span>
                    </div>
                  </div>
                </div>

                <div className="idcard-footer">
                  <div className="idcard-dates">
                    <span>Valid from {startDate}</span>
                    <span>to {endDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* visible part */}
            <div className="ed-badge-wrapper">
              <p className="ed-badge-info">
                Your MEDEVENTA badge is generated. You can download it as PDF.
              </p>
              <button
                type="button"
                className="btn-secondary badge-download"
                onClick={handleDownloadBadge}
              >
                <FaDownload />
                <span>Download badge (PDF)</span>
              </button>
            </div>
          </section>
        )}
      </div>

      {/* EVENT REGISTRATION MODAL - WITH PAYMENT FORM INSIDE */}
      {showRegistrationModal && (
        <div className="ed-modal-backdrop">
          <div className="ed-modal large">
            <button
              type="button"
              className="ed-modal-close"
              onClick={() => setShowRegistrationModal(false)}
              disabled={loading || processingPayment}
            >
              ×
            </button>

            <div className="ed-modal-header">
              <span className="ed-modal-tag">Secure Registration</span>
              <h3 className="ed-modal-title">Complete Your Registration</h3>
              <p className="ed-modal-subtitle">
                Fill in your details and choose your payment method
              </p>
            </div>

            <div className="ed-modal-body">
              {eventRegistrationError && (
                <div className="ed-message-error">
                  <FaTimes /> {eventRegistrationError}
                </div>
              )}

              {paymentFormError && (
                <div className="ed-message-error">
                  <FaTimes /> {paymentFormError}
                </div>
              )}

              <form
                id="ed-registration-form"
                onSubmit={handleConfirmRegistration}
              >
                <div className="ed-form-grid">
                  <div className="ed-form-group">
                    <label htmlFor="fullName">
                      Full name <span className="ed-required">*</span>
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Smith"
                      required
                      disabled={loading || processingPayment}
                    />
                  </div>
                  <div className="ed-form-group">
                    <label htmlFor="email">
                      Business email <span className="ed-required">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john.smith@company.com"
                      required
                      disabled={loading || processingPayment}
                    />
                  </div>
                  <div className="ed-form-group">
                    <label htmlFor="organisation">
                      Organisation / Hospital
                    </label>
                    <input
                      id="organisation"
                      type="text"
                      value={organisation}
                      onChange={(e) => setOrganisation(e.target.value)}
                      placeholder="Your organisation"
                      disabled={loading || processingPayment}
                    />
                  </div>
                </div>

                <div className="ed-payment-section">
                  <h4 className="ed-section-title">
                    <FaRegCreditCard /> Payment Options
                  </h4>
                  <div className="ed-payment-options">
                    <div
                      className={`ed-payment-option ${paymentMethod === "online" ? "active" : ""
                        }`}
                      onClick={() => setPaymentMethod("online")}
                    >
                      <div className="ed-payment-icon">
                        <FaRegCreditCard />
                      </div>
                      <div className="ed-payment-content">
                        <div className="ed-payment-title">Pay online</div>
                        <div className="ed-payment-description">
                          Secure instant payment with card
                        </div>
                        <div className="ed-payment-badge">Instant pass</div>
                      </div>
                    </div>

                    <div
                      className={`ed-payment-option ${paymentMethod === "onsite" ? "active" : ""
                        }`}
                      onClick={() => setPaymentMethod("onsite")}
                    >
                      <div className="ed-payment-icon">
                        <FaCalendarAlt />
                      </div>
                      <div className="ed-payment-content">
                        <div className="ed-payment-title">Pay at event</div>
                        <div className="ed-payment-description">
                          Pay when you arrive at the venue
                        </div>
                        <div className="ed-payment-badge">Reservation only</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PAYMENT FORM - SHOWS WHEN "PAY ONLINE" IS SELECTED */}
                {paymentMethod === "online" && (
                  <div className="ed-card-payment-section">
                    <h4 className="ed-section-title">
                      <FaRegCreditCard /> Payment Details
                    </h4>
                    <div className="ed-card-form">
                      <div className="ed-form-group">
                        <label htmlFor="cardHolderName">
                          Card Holder Name{" "}
                          <span className="ed-required">*</span>
                        </label>
                        <input
                          id="cardHolderName"
                          type="text"
                          placeholder="John Smith"
                          value={cardHolderName}
                          onChange={(e) => setCardHolderName(e.target.value)}
                          disabled={loading || processingPayment}
                        />
                      </div>

                      <div className="ed-form-group">
                        <label htmlFor="cardNumber">
                          Card Number <span className="ed-required">*</span>
                        </label>
                        <div className="ed-card-input">
                          <FaRegCreditCard className="ed-card-icon" />
                          <input
                            id="cardNumber"
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            disabled={loading || processingPayment}
                          />
                        </div>
                      </div>

                      <div className="ed-card-details">
                        <div className="ed-form-group">
                          <label htmlFor="cardExpiry">
                            Expiry Date (MM/YY){" "}
                            <span className="ed-required">*</span>
                          </label>
                          <input
                            id="cardExpiry"
                            type="text"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            disabled={loading || processingPayment}
                          />
                        </div>
                        <div className="ed-form-group">
                          <label htmlFor="cardCvc">
                            CVC <span className="ed-required">*</span>
                          </label>
                          <input
                            id="cardCvc"
                            type="text"
                            placeholder="123"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            disabled={loading || processingPayment}
                          />
                        </div>
                      </div>

                      <div className="ed-payment-security">
                        <FaInfoCircle className="ed-info-icon" />
                        <span>
                          Your payment is secured with SSL encryption. No card
                          details are stored on our servers.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="ed-modal-footer">
                  <div className="ed-terms">
                    <input
                      type="checkbox"
                      id="terms"
                      required
                      disabled={loading || processingPayment}
                    />
                    <label htmlFor="terms">
                      I agree to the terms and conditions and privacy policy
                    </label>
                  </div>
                  <div className="ed-modal-actions">
                    <button
                      type="button"
                      className="ed-btn secondary"
                      onClick={() => setShowRegistrationModal(false)}
                      disabled={loading || processingPayment}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="ed-btn primary wide"
                      disabled={loading || processingPayment}
                    >
                      {loading || processingPayment ? (
                        <FaSpinner className="spin" />
                      ) : null}
                      {processingPayment
                        ? "Processing Payment..."
                        : loading
                          ? "Processing..."
                          : paymentMethod === "online"
                            ? "Pay €150.00 & Register"
                            : "Confirm Registration"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* WORKSHOP REGISTRATION MODAL */}
      {
        showWorkshopModal && selectedWorkshop && (
          <div className="ed-modal-backdrop">
            <div className="ed-modal medium">
              <button
                type="button"
                className="ed-modal-close"
                onClick={() => setShowWorkshopModal(false)}
                disabled={registrationLoading}
              >
                ×
              </button>

              <div className="ed-modal-header">
                <span className="ed-modal-tag">Workshop Registration</span>
                <h3 className="ed-modal-title">Register for Workshop</h3>
                <p className="ed-modal-subtitle">{selectedWorkshop.title}</p>
              </div>

              <div className="ed-modal-body">
                {registrationSuccess ? (
                  <div className="ed-registration-success">
                    <FaCheck className="ed-success-icon" />
                    <h4>Registration Successful!</h4>
                    <p>You have successfully registered for the workshop.</p>
                    <button
                      type="button"
                      className="ed-btn secondary"
                      onClick={() => setShowWorkshopModal(false)}
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitWorkshopRegistration}>
                    {workshopError && (
                      <div className="ed-message-error">
                        <FaTimes /> {workshopError}
                      </div>
                    )}
                    <div className="ed-workshop-info">
                      <div className="ed-info-row">
                        <FaClock /> <strong>Time:</strong> {selectedWorkshop.time}
                      </div>
                      <div className="ed-info-row">
                        <FaMapMarkerAlt /> <strong>Location:</strong>{" "}
                        {selectedWorkshop.room}
                      </div>
                      <div className="ed-info-row">
                        <FaUserTie /> <strong>Trainer:</strong>{" "}
                        {selectedWorkshop.trainer}
                      </div>
                      <div className="ed-info-row">
                        <FaUsers /> <strong>Availability:</strong>{" "}
                        {selectedWorkshop.registeredCount}/
                        {selectedWorkshop.capacity}
                      </div>
                    </div>

                    <div className="ed-form-group">
                      <label>Additional Notes (Optional)</label>
                      <textarea
                        name="notes"
                        value={workshopSessionForm.notes}
                        onChange={handleWorkshopSessionChange}
                        placeholder="Any special requirements or notes..."
                        rows="3"
                        disabled={registrationLoading}
                      />
                    </div>

                    <div className="ed-form-group">
                      <label>Dietary Requirements (Optional)</label>
                      <input
                        type="text"
                        name="dietaryRequirements"
                        value={workshopSessionForm.dietaryRequirements}
                        onChange={handleWorkshopSessionChange}
                        placeholder="e.g., Vegetarian, Gluten-free"
                        disabled={registrationLoading}
                      />
                    </div>

                    <div className="ed-form-group">
                      <label>Special Needs (Optional)</label>
                      <input
                        type="text"
                        name="specialNeeds"
                        value={workshopSessionForm.specialNeeds}
                        onChange={handleWorkshopSessionChange}
                        placeholder="e.g., Wheelchair access"
                        disabled={registrationLoading}
                      />
                    </div>

                    <div className="ed-modal-footer">
                      <div className="ed-terms">
                        <input
                          type="checkbox"
                          id="workshop-terms"
                          required
                          disabled={registrationLoading}
                        />
                        <label htmlFor="workshop-terms">
                          I confirm my registration for this workshop
                        </label>
                      </div>
                      <div className="ed-modal-actions">
                        <button
                          type="button"
                          className="ed-btn secondary"
                          onClick={() => setShowWorkshopModal(false)}
                          disabled={registrationLoading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="ed-btn primary wide"
                          disabled={registrationLoading}
                        >
                          {registrationLoading ? (
                            <FaSpinner className="spin" />
                          ) : (
                            <FaPen />
                          )}
                          {registrationLoading
                            ? "Registering..."
                            : "Confirm Workshop Registration"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* SESSION REGISTRATION MODAL */}
      {
        showSessionModal && selectedSession && (
          <div className="ed-modal-backdrop">
            <div className="ed-modal medium">
              <button
                type="button"
                className="ed-modal-close"
                onClick={() => setShowSessionModal(false)}
                disabled={registrationLoading}
              >
                ×
              </button>

              <div className="ed-modal-header">
                <span className="ed-modal-tag">Session Registration</span>
                <h3 className="ed-modal-title">Register for Session</h3>
                <p className="ed-modal-subtitle">{selectedSession.title}</p>
              </div>

              <div className="ed-modal-body">
                {registrationSuccess ? (
                  <div className="ed-registration-success">
                    <FaCheck className="ed-success-icon" />
                    <h4>Registration Successful!</h4>
                    <p>You have successfully registered for the session.</p>
                    <button
                      type="button"
                      className="ed-btn secondary"
                      onClick={() => setShowSessionModal(false)}
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitSessionRegistration}>
                    <div className="ed-session-info">
                      <div className="ed-info-row">
                        <FaClock /> <strong>Time:</strong> {selectedSession.time}
                      </div>
                      <div className="ed-info-row">
                        <FaMapMarkerAlt /> <strong>Location:</strong>{" "}
                        {selectedSession.room}
                      </div>
                      <div className="ed-info-row">
                        <FaUserTie /> <strong>Chair:</strong>{" "}
                        {selectedSession.chair}
                      </div>
                      <div className="ed-info-row">
                        <FaUsers /> <strong>Availability:</strong>{" "}
                        {selectedSession.registeredCount}/
                        {selectedSession.capacity}
                      </div>
                    </div>

                    <div className="ed-form-group">
                      <label>Additional Notes (Optional)</label>
                      <textarea
                        name="notes"
                        value={workshopSessionForm.notes}
                        onChange={handleWorkshopSessionChange}
                        placeholder="Any special requirements or notes..."
                        rows="3"
                        disabled={registrationLoading}
                      />
                    </div>

                    <div className="ed-form-group">
                      <label>Dietary Requirements (Optional)</label>
                      <input
                        type="text"
                        name="dietaryRequirements"
                        value={workshopSessionForm.dietaryRequirements}
                        onChange={handleWorkshopSessionChange}
                        placeholder="e.g., Vegetarian, Gluten-free"
                        disabled={registrationLoading}
                      />
                    </div>

                    <div className="ed-form-group">
                      <label>Special Needs (Optional)</label>
                      <input
                        type="text"
                        name="specialNeeds"
                        value={workshopSessionForm.specialNeeds}
                        onChange={handleWorkshopSessionChange}
                        placeholder="e.g., Wheelchair access"
                        disabled={registrationLoading}
                      />
                    </div>

                    <div className="ed-modal-footer">
                      <div className="ed-terms">
                        <input
                          type="checkbox"
                          id="session-terms"
                          required
                          disabled={registrationLoading}
                        />
                        <label htmlFor="session-terms">
                          I confirm my registration for this session
                        </label>
                      </div>
                      <div className="ed-modal-actions">
                        <button
                          type="button"
                          className="ed-btn secondary"
                          onClick={() => setShowSessionModal(false)}
                          disabled={registrationLoading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="ed-btn primary wide"
                          disabled={registrationLoading}
                        >
                          {registrationLoading ? (
                            <FaSpinner className="spin" />
                          ) : (
                            <FaBook />
                          )}
                          {registrationLoading
                            ? "Registering..."
                            : "Confirm Session Registration"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* DELETE QUESTION CONFIRMATION MODAL */}
      {
        questionToDelete && (
          <div className="ed-modal-backdrop">
            <div className="ed-modal small">
              <div className="ed-modal-header">
                <h3 className="ed-modal-title">Delete Question</h3>
              </div>
              <div className="ed-modal-body">
                <p>
                  Are you sure you want to delete this question? This action
                  cannot be undone.
                </p>
              </div>
              <div className="ed-modal-footer">
                <div className="ed-modal-actions">
                  <button
                    type="button"
                    className="ed-btn secondary"
                    onClick={() => setQuestionToDelete(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="ed-btn primary"
                    onClick={handleDeleteQuestion}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default EventDetailsPage;
