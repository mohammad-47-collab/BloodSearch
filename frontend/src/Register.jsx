import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './Auth.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const donorMarkerIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = donorMarkerIcon
function LocationPicker({ position, onLocationSelect }) {
    useMapEvents({
        click(event) {
            onLocationSelect({
                latitude: event.latlng.lat,
                longitude: event.latlng.lng,
            })
        },
    })

    return position ? <Marker position={position} /> : null
}

function Register() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        bloodGroup: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        weight: '',
        lastDonationDate: '',
        availableToDonate: true,
        agreeToTerms: false,
    })

    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [location, setLocation] = useState({
        latitude: null,
        longitude: null,
    })

    const [locationMessage, setLocationMessage] = useState('')
    const [isGettingLocation, setIsGettingLocation] = useState(false)

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target

        setFormData((previousData) => ({
            ...previousData,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }
    const handleGetCurrentLocation = () => {
        setError('')
        setLocationMessage('')

        if (!navigator.geolocation) {
            setError('Your browser does not support location detection.')
            return
        }

        setIsGettingLocation(true)

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                })

                setLocationMessage('Current location captured successfully.')
                setIsGettingLocation(false)
            },
            (error) => {
                console.error('Location error:', error)

                setError(
                    'Could not get your location. Please allow location access or select your location on the map.'
                )

                setIsGettingLocation(false)
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            }
        )
    }

    // Updated handleSubmit function
    const handleSubmit = async (event) => {
        event.preventDefault()

        setMessage('')
        setError('')

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        if (formData.password.length < 8) {
            setError('Password must contain at least 8 characters.')
            return
        }
        if (
            location.latitude === null ||
            location.longitude === null
        ) {
            setError(
                'Please select your location using the button or map before registering.'
            )
            return
        }

        if (!formData.agreeToTerms) {
            setError('Please agree to the terms before registering.')
            return
        }

        try {
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    bloodGroup: formData.bloodGroup,
                    dateOfBirth: formData.dateOfBirth,
                    gender: formData.gender,
                    address: formData.address,
                    weight: formData.weight,
                    lastDonationDate: formData.lastDonationDate || null,
                    availableToDonate: formData.availableToDonate,
                    latitude: location.latitude,
                    longitude: location.longitude,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.message || 'Registration failed. Please try again.')
                return
            }

            setMessage('Registration successful! Your account has been created.')

            setFormData({
                fullName: '',
                email: '',
                phone: '',
                password: '',
                confirmPassword: '',
                bloodGroup: '',
                dateOfBirth: '',
                gender: '',
                address: '',
                weight: '',
                lastDonationDate: '',
                availableToDonate: true,
                agreeToTerms: false,
            })
        } catch (error) {
            console.error('Registration error:', error)
            setError(
                'Could not connect to the server. Please make sure the backend is running.'
            )
        }
    }

    return (
        <div className="auth-page">
            <header className="auth-navbar">
                <Link to="/" className="auth-logo">
                    <span>♥</span> Blood<span>Search</span>
                </Link>

                <Link to="/" className="back-home">
                    ← Back to Home
                </Link>
            </header>

            <main className="auth-container">
                <section className="auth-card register-card">
                    <div className="auth-heading">
                        <div className="auth-heart">♥</div>

                        <p className="auth-label">
                            JOIN OUR DONOR COMMUNITY
                        </p>

                        <h1>Become a Donor</h1>

                        <p>
                            Your one donation could make a life-saving difference.
                        </p>
                    </div>

                    {error && (
                        <div className="auth-error" role="alert">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="auth-success" role="status">
                            {message}
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <h2>Personal Information</h2>

                        <div className="form-grid">
                            <label className="form-field">
                                Full Name *
                                <input
                                    type="text"
                                    name="fullName"
                                    placeholder="Enter your full name"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    autoComplete="name"
                                    required
                                />
                            </label>

                            <label className="form-field">
                                Email Address *
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="example@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    required
                                />
                            </label>

                            <label className="form-field">
                                Phone Number *
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="01XXXXXXXXX"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    autoComplete="tel"
                                    required
                                />
                            </label>

                            <label className="form-field">
                                Date of Birth *
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    autoComplete="bday"
                                    required
                                />
                            </label>

                            <label className="form-field">
                                Gender
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                >
                                    <option value="">Prefer not to say</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </label>

                            <label className="form-field">
                                Blood Group *
                                <select
                                    name="bloodGroup"
                                    value={formData.bloodGroup}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select blood group</option>

                                    {[
                                        'A+',
                                        'A-',
                                        'B+',
                                        'B-',
                                        'AB+',
                                        'AB-',
                                        'O+',
                                        'O-',
                                    ].map((group) => (
                                        <option key={group} value={group}>
                                            {group}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="form-field">
                                Weight (kg)
                                <input
                                    type="number"
                                    name="weight"
                                    placeholder="Enter weight in kg"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    min="1"
                                    max="400"
                                />
                            </label>

                            <label className="form-field">
                                Last Blood Donation Date
                                <input
                                    type="date"
                                    name="lastDonationDate"
                                    value={formData.lastDonationDate}
                                    onChange={handleChange}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </label>

                            <label className="form-field full-width">
                                Address / Area *
                                <input
                                    type="text"
                                    name="address"
                                    placeholder="e.g. Mohakhali, Dhaka"
                                    value={formData.address}
                                    onChange={handleChange}
                                    autoComplete="street-address"
                                    required
                                />
                            </label>
                            <div className="form-field full-width location-section">
                                <label>Donor Location *</label>

                                <p>
                                    Select your current location so people can find nearby blood donors.
                                </p>

                                <button
                                    type="button"
                                    className="auth-submit location-button"
                                    onClick={handleGetCurrentLocation}
                                    disabled={isGettingLocation}
                                >
                                    {isGettingLocation
                                        ? 'Getting Location...'
                                        : '📍 Use My Current Location'}
                                </button>

                                {locationMessage && (
                                    <p className="location-success">
                                        {locationMessage}
                                    </p>
                                )}

                                <div className="location-map">
                                    <MapContainer
                                        center={
                                            location.latitude !== null
                                                ? [location.latitude, location.longitude]
                                                : [23.8103, 90.4125]
                                        }
                                        zoom={13}
                                        scrollWheelZoom={true}
                                        style={{ height: '350px', width: '100%' }}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />

                                        <LocationPicker
                                            position={
                                                location.latitude !== null
                                                    ? [location.latitude, location.longitude]
                                                    : null
                                            }
                                            onLocationSelect={(selectedLocation) => {
                                                setLocation(selectedLocation)
                                                setLocationMessage('Map location selected successfully.')
                                                setError('')
                                            }}
                                        />
                                    </MapContainer>
                                </div>

                                {location.latitude !== null && (
                                    <p className="location-coordinates">
                                        <strong>Latitude:</strong> {location.latitude.toFixed(6)}
                                        {' | '}
                                        <strong>Longitude:</strong> {location.longitude.toFixed(6)}
                                    </p>
                                )}

                                {location.latitude === null && (
                                    <p className="location-warning">
                                        Please use your current location or click on the map to select a location.
                                    </p>
                                )}
                            </div>
                        </div>

                        <h2 className="form-section-title">
                            Account Security
                        </h2>

                        <div className="form-grid">
                            <label className="form-field">
                                Password *
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="At least 8 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />
                            </label>

                            <label className="form-field">
                                Confirm Password *
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Re-enter your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />
                            </label>
                        </div>

                        <div className="donor-availability">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="availableToDonate"
                                    checked={formData.availableToDonate}
                                    onChange={handleChange}
                                />

                                <span>
                                    <strong>Interested in donating blood</strong>
                                    <small>
                                        You can change your availability later.
                                    </small>
                                </span>
                            </label>
                        </div>

                        <label className="terms-label">
                            <input
                                type="checkbox"
                                name="agreeToTerms"
                                checked={formData.agreeToTerms}
                                onChange={handleChange}
                                required
                            />

                            <span>
                                I agree to the terms and privacy policy.
                            </span>
                        </label>

                        <button type="submit" className="auth-submit">
                            Create Donor Account →
                        </button>
                    </form>

                    <p className="auth-switch">
                        Already have an account? <Link to="/login">Login</Link>
                    </p>

                    <p className="auth-disclaimer">
                        Registration does not confirm medical eligibility to donate.
                        A qualified blood donation center must assess your eligibility.
                    </p>
                </section>
            </main>

            <footer className="auth-footer">
                © {new Date().getFullYear()} BloodSearch · Connecting hearts, saving lives.
            </footer>
        </div>
    )
}

export default Register