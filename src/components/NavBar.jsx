import React, { useState } from "react";
import "./Navbar.css";
import { FaChevronDown, FaBars, FaBell } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import ActivityFeed from "./ActivityFeed";
import axios from "axios";

const Navbar = () => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const [openMenu, setOpenMenu] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);

  // NEW: controls ActivityFeed panel
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Fetch fresh profile on mount
  React.useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        return;
      }
      try {
        const res = await axios.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.user) {
          const u = res.data.user;
          // Harmonize field for display
          u.name = `${u.prenom || ""} ${u.nom || ""}`.trim();
          setUser(u);
          localStorage.setItem("user", JSON.stringify(u));
        }
      } catch (err) {
        console.error("Navbar profile fetch failed", err);
      }
    };
    fetchProfile();
  }, [location.pathname]); // Re-check on navigation

  const handleNavClick = (e, path, sectionId = null) => {
    e.preventDefault();

    // If we're navigating to home and there's a section
    if (path === "/" && sectionId) {
      // If we're already on home page, just scroll
      if (location.pathname === "/") {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        // Navigate first, then scroll after page loads
        navigate("/");
        setTimeout(() => {
          const element = document.getElementById(sectionId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 300);
      }
    } else if (path === "/") {
      // Just navigate to home, scroll to top
      if (location.pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate("/");
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 300);
      }
    } else {
      navigate(path);
    }
  };

  const handleAuthClick = () => {
    navigate("/login");
  };

  const handleToggleMenu = () => setOpenMenu((v) => !v);
  const handleToggleMobile = () => setOpenMobile((v) => !v);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <>
      <header className="navbar-header">
        <nav className="navbar-container">
          {/* Logo */}
          <div
            className="navbar-logo"
            onClick={() => {
              if (location.pathname === "/") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                navigate("/");
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }, 300);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <div className="navbar-logo-text">
              <h1 className="navbar-logo-main">MedEventa</h1>
              <span className="navbar-logo-sub">PLATFORM</span>
            </div>
          </div>

          {/* Center menu */}
          <div className={`navbar-menu ${openMobile ? "mobile-open" : ""}`}>
            <a
              href="#home"
              className="navbar-link"
              onClick={(e) => handleNavClick(e, "/", "home")}
            >
              Home
            </a>
            <a
              href="#events"
              className="navbar-link"
              onClick={(e) => handleNavClick(e, "/", "events")}
            >
              Events
            </a>
            <a
              href="#about"
              className="navbar-link"
              onClick={(e) => handleNavClick(e, "/", "about")}
            >
              About
            </a>
            <a
              href="#contact"
              className="navbar-link"
              onClick={(e) => handleNavClick(e, "/", "contact")}
            >
              Contact Us
            </a>

            {/* Logged‑in area: user + menu + bell */}
            {user && user.name && (
              <div className="navbar-user-area">
                <button
                  type="button"
                  className="navbar-user"
                  onClick={() => navigate("/profile")}
                >
                  {user.name}
                  {user.role && (
                    <span className="navbar-user-role">· {user.role}</span>
                  )}
                </button>

                {/* Existing menu pill (3-bars) */}
                <button
                  type="button"
                  className="navbar-messages-pill"
                  onClick={handleToggleMenu}
                >
                  <FaBars className="navbar-burger-icon" />
                  <span className="navbar-messages-badge">3</span>
                </button>

                {/* NEW: bell opens ActivityFeed */}
                <button
                  type="button"
                  className="navbar-messages-pill"
                  onClick={() => setIsActivityOpen(true)}
                >
                  <FaBell className="navbar-burger-icon" />
                </button>

                {openMenu && (
                  <div className="navbar-dropdown">

                    {/* Bloc réservé aux participants */}
                    {user.role?.toUpperCase() === "PARTICIPANT" && (
                      <>

                        <button
                          type="button"
                          className="navbar-dropdown-item"
                          onClick={() => {
                            navigate("/participant/dashboard");
                            setOpenMenu(false);
                          }}
                        >
                          Participant Dashboard
                        </button>

                        <button
                          type="button"
                          className="navbar-dropdown-item"
                          onClick={() => {
                            navigate("/participant/registrations");
                            setOpenMenu(false);
                          }}
                        >
                          My Registrations
                        </button>

                        <button
                          type="button"
                          className="navbar-dropdown-item"
                          onClick={() => {
                            navigate("/participant/certificates");
                            setOpenMenu(false);
                          }}
                        >
                          My Certificates
                        </button>

                        <button
                          type="button"
                          className="navbar-dropdown-item"
                          onClick={() => {
                            setIsActivityOpen(true);
                            setOpenMenu(false);
                          }}
                        >
                          Activity
                        </button>
                      </>
                    )}

                    {/* Bloc réservé aux communicants (Authors) */}
                    {(user.role?.toUpperCase() === "COMMUNICANT" || user.role?.toUpperCase() === "SUPER_ADMIN") && (
                      <button
                        type="button"
                        className="navbar-dropdown-item"
                        onClick={() => {
                          navigate("/author/dashboard");
                          setOpenMenu(false);
                        }}
                      >
                        Author Space
                      </button>
                    )}
                    {user.role?.toUpperCase() === "COMMUNICANT" && (
                      <>
                        <button
                          type="button"
                          className="navbar-dropdown-item"
                          onClick={() => {
                            navigate("/author/new-submission");
                            setOpenMenu(false);
                          }}
                        >
                          New Submission
                        </button>
                        <button
                          type="button"
                          className="navbar-dropdown-item"
                          onClick={() => {
                            navigate("/author/programme");
                            setOpenMenu(false);
                          }}
                        >
                          My Programme
                        </button>
                      </>
                    )}

                    {/* Bloc réservé aux organisateurs */}
                    {(user.role?.toUpperCase() === "ORGANISATEUR" || user.role?.toUpperCase() === "SUPER_ADMIN") && (
                      <button
                        type="button"
                        className="navbar-dropdown-item"
                        onClick={() => {
                          navigate("/admin/dashboard");
                          setOpenMenu(false);
                        }}
                      >
                        Organizer Space
                      </button>
                    )}

                    {/* Bloc réservé au comité scientifique */}
                    {(user.role?.toUpperCase() === "MEMBRE_COMITE" || user.role?.toUpperCase() === "SUPER_ADMIN") && (
                      <button
                        type="button"
                        className="navbar-dropdown-item"
                        onClick={() => {
                          navigate("/committee/dashboard");
                          setOpenMenu(false);
                        }}
                      >
                        Committee Space
                      </button>
                    )}

                    {/* Bloc réservé aux responsables de workshop */}
                    {(user.role?.toUpperCase() === "RESP_WORKSHOP" || user.role?.toUpperCase() === "SUPER_ADMIN") && (
                      <button
                        type="button"
                        className="navbar-dropdown-item"
                        onClick={() => {
                          navigate("/workshop-manager/dashboard");
                          setOpenMenu(false);
                        }}
                      >
                        Workshop Space
                      </button>
                    )}

                    {/* Bloc réservé aux invités (Guest) */}
                    {(user.role?.toUpperCase() === "INVITE" || user.role?.toUpperCase() === "SUPER_ADMIN") && (
                      <button
                        type="button"
                        className="navbar-dropdown-item"
                        onClick={() => {
                          navigate("/guest/dashboard");
                          setOpenMenu(false);
                        }}
                      >
                        Guest Space
                      </button>
                    )}

                    {/* Bloc réservé aux super admins */}
                    {user.role?.toUpperCase() === "SUPER_ADMIN" && (
                      <button
                        type="button"
                        className="navbar-dropdown-item"
                        onClick={() => {
                          navigate("/superadmin/dashboard");
                          setOpenMenu(false);
                        }}
                      >
                        Super Admin Panel
                      </button>
                    )}

                    {/* Profil */}
                    <button
                      type="button"
                      className="navbar-dropdown-item"
                      onClick={() => navigate("/profile")}
                    >
                      Profile
                    </button>

                    {/* Messages / notifications */}
                    <button
                      type="button"
                      className="navbar-dropdown-item"
                      onClick={() => navigate("/messages")}
                    >
                      Messages Inbox
                    </button>

                    {/* Langue (optionnel) */}
                    <button type="button" className="navbar-dropdown-item">
                      Language
                      <span className="navbar-lang-pill">
                        En <FaChevronDown className="navbar-chevron" />
                      </span>
                    </button>

                    {/* Logout */}
                    <button
                      type="button"
                      className="navbar-dropdown-item logout"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side: Login (if logged out) + mobile toggle */}
          <div className="navbar-right">
            {!user && (
              <button className="navbar-login-btn" onClick={handleAuthClick}>
                Login
              </button>
            )}

            <button
              type="button"
              className="navbar-mobile-toggle"
              onClick={handleToggleMobile}
            >
              <FaBars />
            </button>
          </div>
        </nav>
      </header>

      {/* ActivityFeed panel controlled by the nav */}
      <ActivityFeed
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
      />
    </>
  );
};

export default Navbar;
