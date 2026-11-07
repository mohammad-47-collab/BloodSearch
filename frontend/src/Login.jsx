import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Auth.css'

function Login() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    })

    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const handleChange = (event) => {
        const { name, value, checked, type } = event.target

        setFormData((previousData) => ({
            ...previousData,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setMessage('')

        if (!formData.email.trim() || !formData.password) {
            setError('Please enter your email and password.')
            return
        }

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    password: formData.password,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.message || 'Login failed. Please try again.')
                return
            }

            setMessage('Login successful! Welcome to BloodSearch.')

            console.log('Logged-in user:', data.user)

            // Save the logged-in user's information
            localStorage.setItem(
                'bloodsearchUser',
                JSON.stringify(data.user)
            )

            // Save JWT token for authenticated API requests
            if (data.token) {
                localStorage.setItem('bloodsearchToken', data.token)
            } else {
                setError('Login succeeded, but the authentication token was not received.')
                return
            }

            setTimeout(() => {
                navigate('/')
            }, 1000)

        } catch (error) {
            console.error('Login error:', error)

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
                <section className="auth-card">
                    <div className="auth-heading">
                        <div className="auth-heart">♥</div>

                        <p className="auth-label">WELCOME BACK</p>

                        <h1>Login to BloodSearch</h1>

                        <p>
                            Sign in to connect with donors and help save lives.
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
                            Password *
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                <input
                                    style={{ flex: 1, minWidth: 0 }}
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword((previous) => !previous)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    style={{
                                        padding: '10px',
                                        border: '1px solid #eadfe2',
                                        borderRadius: '8px',
                                        background: '#fff',
                                        color: '#e91e3a',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </label>

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '12px',
                                flexWrap: 'wrap',
                                margin: '8px 0 20px',
                            }}
                        >
                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                />
                                <span>Remember me</span>
                            </label>

                            <button
                                type="button"
                                onClick={() =>
                                    setMessage(
                                        'Password recovery will be available after backend setup.'
                                    )
                                }
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#e91e3a',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                }}
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <button type="submit" className="auth-submit">
                            Login →
                        </button>
                    </form>

                    <p className="auth-switch">
                        Don't have an account? <Link to="/register">Create Account</Link>
                    </p>

                    <p className="auth-disclaimer">
                        Your account information should always be kept secure.
                    </p>
                </section>
            </main>

            <footer className="auth-footer">
                © {new Date().getFullYear()} BloodSearch · Connecting hearts, saving
                lives.
            </footer>
        </div>
    )
}

export default Login