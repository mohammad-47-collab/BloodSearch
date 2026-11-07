// src/AdminLogin.jsx

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Droplet } from 'lucide-react'

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function AdminLogin() {
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })

    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value,
        })
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Admin login failed.')
            }

            if (!data.token || data.user?.role !== 'admin') {
                throw new Error('The server did not return valid admin credentials.')
            }

            // Keep admin credentials separate from regular user login.
            localStorage.setItem('adminToken', data.token)
            localStorage.setItem('adminUser', JSON.stringify(data.user))

            navigate('/admin/dashboard', { replace: true })
        } catch (err) {
            setError(
                err.message === 'Failed to fetch'
                    ? 'Cannot connect to the server. Check whether your backend is running.'
                    : err.message || 'Something went wrong. Please try again.'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
            <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
                {/* Left panel */}
                <div className="relative hidden flex-col justify-between overflow-hidden bg-red-700 p-10 text-white md:flex">
                    <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-red-600 opacity-70" />
                    <div className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full border-[35px] border-red-600 opacity-70" />

                    <div className="relative z-10 flex items-center gap-3">
                        <div className="rounded-xl bg-white p-3 text-red-700">
                            <Droplet size={30} fill="currentColor" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold">BloodSearch</h1>
                            <p className="text-sm text-red-100">Save lives together</p>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-red-200">
                            Administrator Portal
                        </p>
                        <h2 className="mb-5 text-4xl font-extrabold leading-tight">
                            Manage donors.
                            <br />
                            Help save lives.
                        </h2>
                        <p className="max-w-sm leading-7 text-red-100">
                            Manage BloodSearch users and monitor donor statistics from one
                            secure dashboard.
                        </p>
                    </div>

                    <p className="relative z-10 text-sm text-red-200">
                        BloodSearch Administration
                    </p>
                </div>

                {/* Login form */}
                <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
                    <div className="w-full max-w-md">
                        <div className="mb-8 flex items-center gap-3 md:hidden">
                            <div className="rounded-xl bg-red-100 p-3 text-red-700">
                                <Droplet size={28} fill="currentColor" />
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold text-slate-900">
                                    BloodSearch
                                </h1>
                                <p className="text-sm text-slate-500">Admin Portal</p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <div className="mb-5 inline-flex rounded-2xl bg-red-50 p-3 text-red-700">
                                <ShieldCheck size={30} />
                            </div>

                            <h2 className="text-3xl font-extrabold text-slate-900">
                                Admin Login
                            </h2>
                            <p className="mt-2 text-slate-500">
                                Sign in with your administrator account.
                            </p>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                            >
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Email address
                                </label>

                                <div className="flex items-center rounded-xl border border-slate-200 px-4 transition focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100">
                                    <Mail size={19} className="shrink-0 text-slate-400" />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="username"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="admin@example.com"
                                        className="w-full bg-transparent px-3 py-3.5 text-slate-800 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Password
                                </label>

                                <div className="flex items-center rounded-xl border border-slate-200 px-4 transition focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100">
                                    <Lock size={19} className="shrink-0 text-slate-400" />
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        className="w-full bg-transparent px-3 py-3.5 text-slate-800 outline-none"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="text-slate-400 hover:text-slate-700"
                                    >
                                        {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3.5 font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <ShieldCheck size={20} />
                                {loading ? 'Signing in...' : 'Sign In to Dashboard'}
                            </button>
                        </form>

                        <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                            <Link
                                to="/"
                                className="text-sm font-semibold text-red-700 hover:text-red-800"
                            >
                                ← Back to BloodSearch
                            </Link>
                        </div>

                        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
                            Authorized administrators only. All access is subject to server
                            verification.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminLogin