import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Profile.css'

const API_URL = 'http://localhost:5000'

const initialForm = {
    fullName: '',
    email: '',
    phone: '',
    bloodGroup: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    weight: '',
    lastDonationDate: '',
    availableToDonate: true,
    latitude: '',
    longitude: ''
}

function Profile() {
    const navigate = useNavigate()

    const [form, setForm] = useState(initialForm)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    // Load the logged-in user's profile
    useEffect(() => {
        const loadProfile = async () => {
            const token = localStorage.getItem('bloodsearchToken')

            if (!token) {
                navigate('/login', { replace: true })
                return
            }

            try {
                const response = await fetch(`${API_URL}/api/profile`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })

                const data = await response.json()

                if (response.status === 401) {
                    localStorage.removeItem('bloodsearchToken')
                    localStorage.removeItem('bloodsearchUser')
                    navigate('/login', { replace: true })
                    return
                }

                if (!response.ok) {
                    throw new Error(data.message || 'Could not load your profile.')
                }

                const user = data.user

                setForm({
                    fullName: user.fullName ?? '',
                    email: user.email ?? '',
                    phone: user.phone ?? '',
                    bloodGroup: user.bloodGroup ?? '',
                    dateOfBirth: user.dateOfBirth
                        ? String(user.dateOfBirth).slice(0, 10)
                        : '',
                    gender: user.gender ?? '',
                    address: user.address ?? '',
                    weight: user.weight ?? '',
                    lastDonationDate: user.lastDonationDate
                        ? String(user.lastDonationDate).slice(0, 10)
                        : '',
                    availableToDonate: Boolean(user.availableToDonate),
                    latitude: user.latitude ?? '',
                    longitude: user.longitude ?? ''
                })
            } catch (err) {
                setError(err.message || 'Something went wrong.')
            } finally {
                setLoading(false)
            }
        }

        loadProfile()
    }, [navigate])

    // Update form fields
    const handleChange = (event) => {
        const { name, value, type, checked } = event.target

        setForm((previous) => ({
            ...previous,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    // Save profile changes
    const handleSubmit = async (event) => {
        event.preventDefault()

        setError('')
        setMessage('')

        const token = localStorage.getItem('bloodsearchToken')

        if (!token) {
            navigate('/login', { replace: true })
            return
        }

        if (!form.fullName.trim()) {
            setError('Please enter your full name.')
            return
        }

        if (!form.email.trim()) {
            setError('Please enter your email address.')
            return
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            setError('Please enter a valid email address.')
            return
        }

        if (!form.phone.trim()) {
            setError('Please enter your phone number.')
            return
        }

        if (!form.bloodGroup) {
            setError('Please select your blood group.')
            return
        }

        if (
            form.weight !== '' &&
            (!Number.isFinite(Number(form.weight)) || Number(form.weight) <= 0)
        ) {
            setError('Weight must be a positive number.')
            return
        }

        if (
            form.latitude !== '' &&
            (!Number.isFinite(Number(form.latitude)) ||
                Number(form.latitude) < -90 ||
                Number(form.latitude) > 90)
        ) {
            setError('Latitude must be between -90 and 90.')
            return
        }

        if (
            form.longitude !== '' &&
            (!Number.isFinite(Number(form.longitude)) ||
                Number(form.longitude) < -180 ||
                Number(form.longitude) > 180)
        ) {
            setError('Longitude must be between -180 and 180.')
            return
        }

        const payload = {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            bloodGroup: form.bloodGroup,
            dateOfBirth: form.dateOfBirth || null,
            gender: form.gender || null,
            address: form.address.trim(),
            weight: form.weight === '' ? null : Number(form.weight),
            lastDonationDate: form.lastDonationDate || null,
            availableToDonate: form.availableToDonate,
            latitude: form.latitude === '' ? null : Number(form.latitude),
            longitude: form.longitude === '' ? null : Number(form.longitude)
        }

        setSaving(true)

        try {
            const response = await fetch(`${API_URL}/api/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            const data = await response.json()

            if (response.status === 401) {
                localStorage.removeItem('bloodsearchToken')
                localStorage.removeItem('bloodsearchUser')
                navigate('/login', { replace: true })
                return
            }

            if (!response.ok) {
                throw new Error(data.message || 'Could not update your profile.')
            }

            // Keep the navbar user information updated
            const oldUser = JSON.parse(
                localStorage.getItem('bloodsearchUser') || '{}'
            )

            const updatedUser = {
                ...oldUser,
                id: data.user?.id ?? oldUser.id,
                fullName: data.user?.fullName ?? payload.fullName,
                email: data.user?.email ?? payload.email,
                bloodGroup: data.user?.bloodGroup ?? payload.bloodGroup
            }

            localStorage.setItem(
                'bloodsearchUser',
                JSON.stringify(updatedUser)
            )

            setForm((previous) => ({
                ...previous,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                bloodGroup: updatedUser.bloodGroup
            }))

            setMessage('Profile updated successfully!')
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="profile-spinner"></div>
                <p>Loading your profile...</p>
            </div>
        )
    }

    return (
        <div className="profile-page">
            <header className="profile-header">
                <Link to="/" className="profile-brand">
                    <span className="profile-brand-icon">♥</span>
                    BloodSearch
                </Link>

                <Link to="/" className="profile-back-btn">
                    ← Back to Home
                </Link>
            </header>

            <main className="profile-container">
                <section className="profile-heading">
                    <div>
                        <p className="profile-eyebrow">YOUR ACCOUNT</p>
                        <h1>My Profile</h1>
                        <p className="profile-subtitle">
                            View and update your personal information.
                        </p>
                    </div>

                    <div className="profile-avatar">
                        {form.fullName.trim()
                            ? form.fullName.trim().charAt(0).toUpperCase()
                            : 'U'}
                    </div>
                </section>

                {error && (
                    <div className="profile-alert profile-alert-error" role="alert">
                        {error}
                    </div>
                )}

                {message && (
                    <div
                        className="profile-alert profile-alert-success"
                        role="status"
                    >
                        {message}
                    </div>
                )}

                <form className="profile-card" onSubmit={handleSubmit}>
                    <div className="profile-card-heading">
                        <div>
                            <h2>Personal Information</h2>
                            <p>Keep your information accurate and up to date.</p>
                        </div>
                        <span className="profile-required-note">
                            * Required fields
                        </span>
                    </div>

                    <div className="profile-form-grid">
                        <div className="profile-field">
                            <label htmlFor="fullName">Full Name *</label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                value={form.fullName}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                autoComplete="name"
                                required
                            />
                        </div>

                        <div className="profile-field">
                            <label htmlFor="email">Email Address *</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="profile-field">
                            <label htmlFor="phone">Phone Number *</label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="Enter your phone number"
                                autoComplete="tel"
                                required
                            />
                        </div>

                        <div className="profile-field">
                            <label htmlFor="bloodGroup">Blood Group *</label>
                            <select
                                id="bloodGroup"
                                name="bloodGroup"
                                value={form.bloodGroup}
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
                                    'O-'
                                ].map((group) => (
                                    <option key={group} value={group}>
                                        {group}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="profile-field">
                            <label htmlFor="dateOfBirth">Date of Birth</label>
                            <input
                                id="dateOfBirth"
                                name="dateOfBirth"
                                type="date"
                                value={form.dateOfBirth}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="profile-field">
                            <label htmlFor="gender">Gender</label>
                            <select
                                id="gender"
                                name="gender"
                                value={form.gender}
                                onChange={handleChange}
                            >
                                <option value="">Select gender</option>

                                {!['Male', 'Female', 'Other'].includes(form.gender) &&
                                    form.gender && (
                                        <option value={form.gender}>{form.gender}</option>
                                    )}

                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="profile-field">
                            <label htmlFor="weight">Weight (kg)</label>
                            <input
                                id="weight"
                                name="weight"
                                type="number"
                                min="1"
                                step="0.1"
                                value={form.weight}
                                onChange={handleChange}
                                placeholder="Enter your weight"
                            />
                        </div>

                        <div className="profile-field">
                            <label htmlFor="lastDonationDate">Last Donation Date</label>
                            <input
                                id="lastDonationDate"
                                name="lastDonationDate"
                                type="date"
                                value={form.lastDonationDate}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="profile-field profile-field-full">
                            <label htmlFor="address">Address</label>
                            <textarea
                                id="address"
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                placeholder="Enter your address"
                                rows="3"
                            />
                        </div>
                    </div>

                    <div className="profile-donation-section">
                        <h3>Blood Donation Availability</h3>
                        <p>
                            Let others know whether you are currently available to donate
                            blood.
                        </p>

                        <label className="profile-checkbox-row">
                            <input
                                type="checkbox"
                                name="availableToDonate"
                                checked={form.availableToDonate}
                                onChange={handleChange}
                            />
                            <span>
                                <strong>Available to donate blood</strong>
                                <small>
                                    Your availability may be shown in donor search results.
                                </small>
                            </span>
                        </label>
                    </div>

                    <div className="profile-location-section">
                        <h3>Location Information</h3>
                        <p>
                            Optional coordinates used by location-based donor search.
                        </p>

                        <div className="profile-form-grid">
                            <div className="profile-field">
                                <label htmlFor="latitude">Latitude</label>
                                <input
                                    id="latitude"
                                    name="latitude"
                                    type="number"
                                    min="-90"
                                    max="90"
                                    step="any"
                                    value={form.latitude}
                                    onChange={handleChange}
                                    placeholder="e.g. 23.8103"
                                />
                            </div>

                            <div className="profile-field">
                                <label htmlFor="longitude">Longitude</label>
                                <input
                                    id="longitude"
                                    name="longitude"
                                    type="number"
                                    min="-180"
                                    max="180"
                                    step="any"
                                    value={form.longitude}
                                    onChange={handleChange}
                                    placeholder="e.g. 90.4125"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="profile-form-actions">
                        <Link to="/" className="profile-cancel-btn">
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            className="profile-save-btn"
                            disabled={saving}
                        >
                            {saving ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </form>

                <p className="profile-footer-note">
                    Please keep your contact details updated so people can reach you
                    when needed.
                </p>
            </main>
        </div>
    )
}

export default Profile