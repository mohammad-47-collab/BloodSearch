import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Home.css'

function Home() {
    const [donors, setDonors] = useState([])
    const [searchError, setSearchError] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const navigate = useNavigate()

    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('bloodsearchUser')) || null
        } catch {
            return null
        }
    })

    const handleLogout = () => {
        localStorage.removeItem('bloodsearchUser')
        localStorage.removeItem('bloodsearchToken')

        setUser(null)
        navigate('/')
    }
    const bloodGroups = [
        'A+', 'A-', 'B+', 'B-',
        'AB+', 'AB-', 'O+', 'O-',
    ]

    const handleSearch = async (event) => {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)

        const bloodGroup = formData.get('bloodGroup')
        const location = formData.get('location')?.trim()

        setSearchError('')
        setDonors([])
        setHasSearched(false)

        if (!bloodGroup || !location) {
            setSearchError('Please select a blood group and enter a location.')
            return
        }

        setIsSearching(true)

        try {
            const params = new URLSearchParams({
                bloodGroup,
                location,
            })

            const response = await fetch(
                `http://localhost:5000/api/donors/search?${params.toString()}`
            )

            const data = await response.json()
            console.log("API Response:", data)
            console.log("Donors:", data.donors)

            if (!response.ok) {
                throw new Error(data.message || 'Could not search for donors.')
            }

            setDonors(data.donors || [])
            setHasSearched(true)
        } catch (error) {
            console.error('Donor search error:', error)

            setSearchError(
                error.message || 'Could not connect to the backend server.'
            )
        } finally {
            setIsSearching(false)
        }
    }

    return (
        <div className="home-page">

            {/* Navigation Bar */}
            <header className="home-navbar">
                <div className="home-nav-container">

                    <Link to="/" className="home-logo">
                        <span>♥</span> Blood<span>Search</span>
                    </Link>

                    <nav className="home-nav-links">
                        <a href="#home">Home</a>
                        <a href="#find-donors">Find Donors</a>
                        <a href="#how-it-works">How It Works</a>
                        <a href="#about">About Us</a>
                    </nav>

                    <div className="home-nav-buttons">
                        {user ? (
                            <>
                                <span className="home-user-greeting">
                                    Welcome, {user.fullName}
                                </span>

                                <Link
                                    to="/profile"
                                    className="home-login-btn"
                                    style={{ textDecoration: 'none' }}
                                >
                                    My Profile
                                </Link>

                                <button
                                    type="button"
                                    className="home-login-btn"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="home-login-btn">
                                    Login
                                </Link>

                                <Link to="/register" className="home-register-btn">
                                    Become a Donor
                                </Link>
                            </>
                        )}
                    </div>

                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section" id="home">
                <div className="hero-container">

                    <div className="hero-content">

                        <div className="hero-badge">
                            <span>♥</span> EVERY DROP COUNTS
                        </div>

                        <h1>
                            Donate Blood,
                            <br />
                            <span>Save Lives.</span>
                        </h1>

                        <p>
                            A single donation can make a big difference.
                            Connect with blood donors and help someone get
                            the blood they need at the right time.
                        </p>

                        <div className="hero-buttons">
                            <a href="#find-donors" className="hero-primary-btn">
                                Find Blood Donors <span>→</span>
                            </a>

                            <Link to="/register" className="hero-secondary-btn">
                                Become a Donor
                            </Link>
                        </div>

                        <div className="hero-note">
                            <span>♥</span>
                            Be someone's reason to smile today.
                        </div>

                    </div>

                    <div className="hero-visual">
                        <div className="hero-circle">
                            <div className="hero-heart">♥</div>
                            <div className="hero-drop">+</div>
                        </div>

                        <div className="floating-card floating-card-top">
                            <span className="floating-icon">♥</span>
                            <div>
                                <strong>Give Blood</strong>
                                <p>Give the gift of life</p>
                            </div>
                        </div>

                        <div className="floating-card floating-card-bottom">
                            <span className="floating-check">✓</span>
                            <div>
                                <strong>Every Donor Matters</strong>
                                <p>Your kindness can save a life</p>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Find Donors Section */}
            <section className="find-section" id="find-donors">
                <div className="section-heading">
                    <span className="section-label">FIND A DONOR</span>
                    <h2>Find the Right Blood Donor</h2>
                    <p>
                        Search by blood group and location to find potential donors.
                    </p>
                </div>

                <form className="donor-search-form" onSubmit={handleSearch}>

                    <div className="search-field">
                        <label htmlFor="bloodGroup">Blood Group</label>

                        <select id="bloodGroup" name="bloodGroup" required>
                            <option value="">Select blood group</option>

                            {bloodGroups.map((group) => (
                                <option key={group} value={group}>
                                    {group}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="search-field">
                        <label htmlFor="location">Location / Area</label>

                        <input
                            id="location"
                            name="location"
                            type="text"
                            placeholder="e.g. Mohakhali, Dhaka"
                            required
                        />
                    </div>

                    <button type="submit" className="donor-search-btn">
                        <span>⌕</span> Search Donors
                    </button>

                </form>

                <p className="search-disclaimer">
                    Donor availability and eligibility must be confirmed before donation.
                </p>
                {searchError && (
                    <p className="search-error">{searchError}</p>
                )}

                {isSearching && (
                    <p className="search-loading">Searching for donors...</p>
                )}

                {hasSearched && !isSearching && (
                    <div className="donor-results">
                        <h2>Search Results</h2>

                        {donors.length > 0 ? (
                            <div className="donor-list">

                                {donors.map((donor) => (
                                    <div className="donor-card" key={donor.id}>

                                        <div className="donor-card-header">
                                            <div className="donor-avatar">
                                                {donor.full_name?.charAt(0).toUpperCase()}
                                            </div>

                                            <div className="donor-info">
                                                <h3>{donor.full_name}</h3>

                                                <span className="blood-group-badge">
                                                    {donor.blood_group}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="donor-card-details">
                                            <p>
                                                <strong>Address:</strong>{" "}
                                                {donor.address}
                                            </p>

                                            <p>
                                                <strong>Phone:</strong>{" "}
                                                {donor.phone || "Not provided"}
                                            </p>
                                        </div>

                                        {donor.phone && (
                                            <a
                                                href={`tel:${donor.phone}`}
                                                className="contact-donor-btn"
                                            >
                                                Contact Donor
                                            </a>
                                        )}

                                    </div>
                                ))}

                            </div>
                        ) : (
                            <p>No donors found for this blood group and location.</p>
                        )}
                    </div>
                )}
            </section>

            {/* How It Works */}
            <section className="how-section" id="how-it-works">
                <div className="section-heading">
                    <span className="section-label">SIMPLE PROCESS</span>
                    <h2>How BloodSearch Works</h2>
                    <p>
                        Three simple steps to connect people who need blood
                        with potential donors.
                    </p>
                </div>

                <div className="steps-container">

                    <article className="step-card">
                        <div className="step-number">01</div>
                        <div className="step-icon">👤</div>
                        <h3>Create an Account</h3>
                        <p>
                            Register as a donor and provide your blood group
                            and contact information.
                        </p>
                    </article>

                    <div className="step-arrow">→</div>

                    <article className="step-card">
                        <div className="step-number">02</div>
                        <div className="step-icon">🔎</div>
                        <h3>Find a Donor</h3>
                        <p>
                            Search for potential donors using the required
                            blood group and location.
                        </p>
                    </article>

                    <div className="step-arrow">→</div>

                    <article className="step-card">
                        <div className="step-number">03</div>
                        <div className="step-icon">♥</div>
                        <h3>Connect and Help</h3>
                        <p>
                            Contact a potential donor and coordinate with
                            a qualified blood donation center.
                        </p>
                    </article>

                </div>
            </section>

            {/* Blood Groups */}
            <section className="blood-groups-section">
                <div className="section-heading">
                    <span className="section-label">BLOOD TYPES</span>
                    <h2>Explore Blood Groups</h2>
                    <p>
                        Select a blood group to learn which type you need
                        to search for.
                    </p>
                </div>

                <div className="blood-groups-grid">
                    {bloodGroups.map((group) => (
                        <a
                            href="#find-donors"
                            className="blood-group-card"
                            key={group}
                            onClick={() => {
                                const select = document.getElementById('bloodGroup')

                                if (select) {
                                    select.value = group
                                }
                            }}
                        >
                            <div className="blood-group-icon">♥</div>
                            <h3>{group}</h3>
                            <span>Find Donors →</span>
                        </a>
                    ))}
                </div>
            </section>

            {/* About / Why BloodSearch */}
            <section className="about-section" id="about">
                <div className="about-content">

                    <span className="section-label">WHY BLOODSEARCH?</span>

                    <h2>
                        Connecting Hearts,
                        <br />
                        <span>Saving Lives.</span>
                    </h2>

                    <p>
                        BloodSearch aims to make it easier for people to find
                        potential blood donors. Our goal is to help communities
                        connect quickly and make blood donation information
                        easier to access.
                    </p>

                    <div className="about-features">
                        <div>
                            <span>✓</span>
                            Search by blood group
                        </div>

                        <div>
                            <span>✓</span>
                            Search by location
                        </div>

                        <div>
                            <span>✓</span>
                            Easy donor registration
                        </div>

                        <div>
                            <span>✓</span>
                            Community-focused platform
                        </div>
                    </div>

                    <Link to="/register" className="about-cta">
                        Join Our Community →
                    </Link>

                </div>

                <div className="about-visual">
                    <div className="about-heart-circle">
                        <span>♥</span>
                    </div>

                    <div className="about-quote">
                        <span>“</span>
                        A little kindness can make a big difference.
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="cta-section">
                <div className="cta-heart">♥</div>

                <h2>Be a Hero. Become a Donor.</h2>

                <p>
                    Your willingness to donate could help someone in need.
                    Join our community today.
                </p>

                <Link to="/register" className="cta-button">
                    Register as a Donor →
                </Link>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <div className="footer-container">

                    <div className="footer-brand">
                        <Link to="/" className="home-logo">
                            <span>♥</span> Blood<span>Search</span>
                        </Link>

                        <p>
                            Connecting people with potential blood donors
                            and helping communities support one another.
                        </p>
                    </div>

                    <div className="footer-links">
                        <h3>Quick Links</h3>
                        <a href="#home">Home</a>
                        <a href="#find-donors">Find Donors</a>
                        <a href="#how-it-works">How It Works</a>
                    </div>

                    <div className="footer-links">
                        <h3>Account</h3>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Become a Donor</Link>
                    </div>

                </div>

                <div className="footer-bottom">
                    <p>
                        © {new Date().getFullYear()} BloodSearch.
                        Connecting hearts, saving lives.
                    </p>

                    <p>
                        Blood donation eligibility must be assessed by
                        qualified healthcare professionals.
                    </p>
                </div>
            </footer>

        </div>
    )
}

export default Home