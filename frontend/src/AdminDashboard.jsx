// src/AdminDashboard.jsx

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Activity,
    Users,
    Droplet,
    UserCheck,
    LayoutDashboard,
    LogOut,
    RefreshCw,
    ShieldCheck,
    AlertCircle,
    Menu,
    X,
} from 'lucide-react'

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function AdminDashboard() {
    const navigate = useNavigate()

    const [admin, setAdmin] = useState(null)
    const [statistics, setStatistics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const logout = useCallback(() => {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        setAdmin(null)
        navigate('/admin/login', { replace: true })
    }, [navigate])

    const loadDashboard = useCallback(async () => {
        const token = localStorage.getItem('adminToken')
        const savedAdmin = localStorage.getItem('adminUser')

        if (!token || !savedAdmin) {
            logout()
            return
        }

        try {
            const parsedAdmin = JSON.parse(savedAdmin)

            if (parsedAdmin.role !== 'admin') {
                logout()
                return
            }

            setAdmin(parsedAdmin)
            setError('')
            setLoading(true)

            const response = await fetch(
                `${API_BASE_URL}/api/admin/dashboard`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            const data = await response.json()

            if (response.status === 401 || response.status === 403) {
                logout()
                return
            }

            if (!response.ok) {
                throw new Error(data.message || 'Could not load dashboard data.')
            }

            setStatistics(data.statistics)
        } catch (err) {
            if (err instanceof SyntaxError) {
                logout()
                return
            }

            setError(
                err.message === 'Failed to fetch'
                    ? 'Cannot connect to the backend. Check whether your server is running.'
                    : err.message || 'Something went wrong.'
            )
        } finally {
            setLoading(false)
        }
    }, [logout])

    useEffect(() => {
        loadDashboard()
    }, [loadDashboard])

    const cards = [
        {
            title: 'Total Registered Users',
            value: statistics?.totalUsers ?? 0,
            description: 'All registered accounts',
            icon: Users,
            iconStyle: 'bg-blue-50 text-blue-700',
        },
        {
            title: 'Total Administrators',
            value: statistics?.totalAdmins ?? 0,
            description: 'Accounts with admin access',
            icon: ShieldCheck,
            iconStyle: 'bg-purple-50 text-purple-700',
        },
        {
            title: 'Registered Donors',
            value: statistics?.totalDonors ?? '—',
            description: 'Donor count not yet connected',
            icon: Droplet,
            iconStyle: 'bg-red-50 text-red-700',
        },
        {
            title: 'Available Donors',
            value: statistics?.availableDonors ?? '—',
            description: 'Availability statistics not yet connected',
            icon: UserCheck,
            iconStyle: 'bg-green-50 text-green-700',
        },
    ]

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-sm transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-red-700 p-2.5 text-white">
                            <Droplet size={25} fill="currentColor" />
                        </div>

                        <div>
                            <h1 className="text-lg font-extrabold text-slate-900">
                                BloodSearch
                            </h1>
                            <p className="text-xs text-slate-500">Admin Panel</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        aria-label="Close sidebar"
                        onClick={() => setSidebarOpen(false)}
                        className="text-slate-500 lg:hidden"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="px-4 py-6">
                    <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Main Menu
                    </p>

                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="flex w-full items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-left font-semibold text-red-700"
                    >
                        <LayoutDashboard size={20} />
                        Dashboard Overview
                    </button>

                    <div className="mt-3 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500">
                        <Users size={20} />
                        <span>User Management</span>
                        <span className="ml-auto rounded-md bg-slate-100 px-2 py-1 text-xs">
                            Next
                        </span>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500">
                        <Droplet size={20} />
                        <span>Donor Management</span>
                        <span className="ml-auto rounded-md bg-slate-100 px-2 py-1 text-xs">
                            Next
                        </span>
                    </div>
                </div>

                <div className="mt-auto border-t border-slate-100 p-4">
                    <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-700">
                            {(admin?.fullName || 'A').charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-800">
                                {admin?.fullName || 'Administrator'}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                                {admin?.email || ''}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-red-700 transition hover:bg-red-50"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="min-h-screen lg:ml-72">
                <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="Open navigation"
                            onClick={() => setSidebarOpen(true)}
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                        >
                            <Menu size={23} />
                        </button>

                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                                Dashboard Overview
                            </h2>
                            <p className="hidden text-sm text-slate-500 sm:block">
                                Welcome back, {admin?.fullName || 'Administrator'}!
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={loadDashboard}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:px-4"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </header>

                <div className="p-4 sm:p-8">
                    {/* Welcome banner */}
                    <section className="relative mb-8 overflow-hidden rounded-2xl bg-red-700 p-6 text-white sm:p-8">
                        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-red-600 opacity-70" />

                        <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                            <div>
                                <p className="mb-2 text-sm font-semibold text-red-100">
                                    ADMINISTRATION CENTER
                                </p>
                                <h3 className="text-2xl font-extrabold sm:text-3xl">
                                    Welcome to BloodSearch
                                </h3>
                                <p className="mt-2 max-w-xl text-sm leading-6 text-red-100 sm:text-base">
                                    Monitor your platform and help keep blood donation services
                                    organized.
                                </p>
                            </div>

                            <div className="flex h-16 w-16 shrink-0 items-center justify-center self-start rounded-2xl bg-white/15 sm:self-center">
                                <Activity size={34} />
                            </div>
                        </div>
                    </section>

                    {/* Error message */}
                    {error && (
                        <div
                            role="alert"
                            className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 sm:flex-row sm:items-center"
                        >
                            <AlertCircle size={22} className="shrink-0" />
                            <div>
                                <p className="font-bold">Unable to load dashboard</p>
                                <p className="mt-1 text-sm">{error}</p>
                            </div>

                            <button
                                type="button"
                                onClick={loadDashboard}
                                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold hover:bg-red-100 sm:ml-auto"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {/* Statistics */}
                    <section>
                        <div className="mb-5">
                            <h3 className="text-lg font-extrabold text-slate-900">
                                Platform Statistics
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                An overview of your BloodSearch platform.
                            </p>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                            {cards.map((card) => {
                                const Icon = card.icon

                                return (
                                    <article
                                        key={card.title}
                                        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div
                                                className={`rounded-xl p-3 ${card.iconStyle}`}
                                            >
                                                <Icon size={23} />
                                            </div>

                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                                                Overview
                                            </span>
                                        </div>

                                        <p className="mt-5 text-sm font-medium text-slate-500">
                                            {card.title}
                                        </p>

                                        <p className="mt-2 text-3xl font-extrabold text-slate-900">
                                            {loading ? '...' : card.value}
                                        </p>

                                        <p className="mt-2 text-xs leading-5 text-slate-400">
                                            {card.description}
                                        </p>
                                    </article>
                                )
                            })}
                        </div>
                    </section>

                    {/* Status panel */}
                    <section className="mt-8 grid gap-6 xl:grid-cols-2">
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-green-50 p-3 text-green-700">
                                    <ShieldCheck size={24} />
                                </div>

                                <div>
                                    <h3 className="font-extrabold text-slate-900">
                                        Administrator Access
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        Current session information
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                <span className="text-sm text-slate-500">Account role</span>
                                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold uppercase text-green-700">
                                    {admin?.role || 'Unknown'}
                                </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-sm text-slate-500">Login email</span>
                                <span className="max-w-[60%] break-all text-right text-sm font-semibold text-slate-700">
                                    {admin?.email || '—'}
                                </span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-red-50 p-3 text-red-700">
                                    <Droplet size={24} />
                                </div>

                                <div>
                                    <h3 className="font-extrabold text-slate-900">
                                        BloodSearch Management
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        Platform management modules
                                    </p>
                                </div>
                            </div>

                            <p className="mt-5 text-sm leading-6 text-slate-600">
                                The dashboard overview is connected to your admin statistics
                                API. User and donor management tables can be added next using
                                your existing database and API routes.
                            </p>

                            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-800">
                                Donor statistics will appear when the backend provides those
                                counts.
                            </div>
                        </div>
                    </section>

                    <footer className="mt-10 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
                        © {new Date().getFullYear()} BloodSearch · Administrator Panel
                    </footer>
                </div>
            </main>
        </div>
    )
}

export default AdminDashboard