'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Menu,
  Bell,
  Eye,
  EyeOff,
  CreditCard,
  Play,
  Phone,
  Radio,
  Headphones,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  MessageCircle,
  Plus,
  UserCircle,
  Settings,
  LogOut,
  Dices,
  Tv,
  Lightbulb,
  Share2,
  BarChart3,
  Send,
  MessageSquare,
  Camera,
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { getBalance, getTransactions, initializeBalance } from '@/lib/balance-store'
import { getTimeBasedGreeting } from '@/lib/lib/greeting'

export default function DashboardPage() {
  const router = useRouter()
  const [balance, setBalance] = useState(250000)
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  const [fullName, setFullName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [isUploadingProfile, setIsUploadingProfile] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showBalance, setShowBalance] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [greeting, setGreeting] = useState('Good Morning')

  // Promotional banners
  const banners = [
    {
      title: 'GLO Network',
      description: 'Africa\'s Biggest & Best Network Communication',
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/images%20%2845%29-20a4b0TDd0SQc2CMBxKxb4sRhMfYB3.jpeg',
    },
    {
      title: 'HILO Plus',
      description: 'New Premium Device Launch',
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/images%20%2844%29-DdVNQxquhPZMHEOj3qm0HoXY9BblXN.jpeg',
    },
    {
      title: 'MTN Network',
      description: 'Premium Connectivity Solution',
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/images%20%281%29%20%2828%29-qi7XH2apOj4ZhTdqe1AoTywpVpIGoL.jpeg',
    },
    {
      title: 'Airtel Network',
      description: 'Bigger Faster Growth',
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/images%20%2841%29-YSlg1sOd6KYrJzI976MhmOnduKiJYS.jpeg',
    },
    {
      title: 'MTN Services',
      description: 'Premium Communication Services',
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/images%20%2834%29-ZMCeOQ3ENpaslzOZDrtW0UwRYLrWaY.jpeg',
    },
    {
      title: 'Airtel Premium',
      description: 'Next Generation Network',
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/images%20%2840%29-Pboh80l5VJ1g4C6BVFsyc3KiE3OZIK.jpeg',
    },
    {
      title: 'Community Event',
      description: 'Civic Engagement & Voting',
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/images%20%281%29%20%2811%29-VN09k6KFAwCYAfZ8CEQ7mmbPtTaGR1.jpeg',
    },
    {
      title: 'Financial Services',
      description: 'Secure Banking Solutions',
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/images%20%281%29%20%2814%29-o0FOTYp2huNpZrrB6H1leYFa3R96hk.jpeg',
    },
    {
      title: 'Political Event',
      description: 'National Leadership Summit',
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/images%20%281%29%20%2822%29-7shg4AK3HAQPqWibAQsT2KXI5uYbM8.jpeg',
    },
    {
      title: 'Community Service',
      description: 'Public Outreach Program',
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/images%20%281%29%20%282%29-jlucdY9rQLP0iVKPNYWMWT1yRhJExn.jpeg',
    },
    {
      title: 'Public Rally',
      description: 'Community Mobilization',
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/images%20%281%29%20%2826%29-GusOUAJo4Jt8gHadGJBnsVCT07dXMt.jpeg',
    },
  ]

  // Auto-rotate banners every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Helper functions for transactions
  const getTransactionColor = (type: string): string => {
    const colors: Record<string, string> = {
      withdrawal: 'bg-blue-100',
      airtime: 'bg-green-100',
      data: 'bg-cyan-100',
      betting: 'bg-indigo-100',
      electricity: 'bg-yellow-100',
      tv: 'bg-teal-100',
      reward: 'bg-purple-100',
    }
    return colors[type] || 'bg-gray-100'
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'withdrawal':
        return <CreditCard className="w-4 h-4 text-blue-600" />
      case 'airtime':
        return <Phone className="w-4 h-4 text-green-600" />
      case 'data':
        return <Radio className="w-4 h-4 text-cyan-600" />
      case 'betting':
        return <Dices className="w-4 h-4 text-indigo-600" />
      case 'electricity':
        return <Lightbulb className="w-4 h-4 text-yellow-600" />
      case 'tv':
        return <Tv className="w-4 h-4 text-teal-600" />
      case 'reward':
        return <DollarSign className="w-4 h-4 text-purple-600" />
      default:
        return <CreditCard className="w-4 h-4 text-gray-600" />
    }
  }

  const formatDate = (date: string | undefined): string => {
    if (!date) return 'Today'
    try {
      const d = new Date(date)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
    } catch {
      return 'Today'
    }
  }

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setIsUploadingProfile(true)
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Upload to storage
      const filename = `profile-${userId}-${Date.now()}.jpg`
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filename, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filename)

      setProfileImage(publicUrl)

      // Update profile
      await supabase
        .from('profiles')
        .update({ profile_image_url: publicUrl })
        .eq('id', userId)
    } catch (err) {
      console.error('[v0] Error uploading profile image:', err)
    } finally {
      setIsUploadingProfile(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    // Set time-based greeting on client side
    setGreeting(getTimeBasedGreeting())
    // Only run on client side
    if (typeof window !== 'undefined') {
      loadUserData()
    }
  }, [])

  async function loadUserData() {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUserId(session.user.id)
        setUserEmail(session.user.email || '')

        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, profile_image_url')
          .eq('id', session.user.id)
          .single()

        if (profile?.full_name) {
          setFullName(profile.full_name)
        }
        if (profile?.profile_image_url) {
          setProfileImage(profile.profile_image_url)
        }

        // Load balance from unified store
        const initialBalance = initializeBalance()
        setBalance(initialBalance)
        setLoadingBalance(false)

        // Load recent transactions from unified store
        const txData = getTransactions()
        setTransactions(txData)
        setLoadingTransactions(false)
      } else {
        // Fallback to session storage if not authenticated
        const storedName = sessionStorage.getItem('signupFullName')
        const storedEmail = sessionStorage.getItem('signupEmail')
        if (storedName) {
          setFullName(storedName)
        }
        if (storedEmail) {
          setUserEmail(storedEmail)
        }
        
        const initialBalance = initializeBalance()
        setBalance(initialBalance)
        setLoadingBalance(false)
        
        const txData = getTransactions()
        setTransactions(txData)
        setLoadingTransactions(false)
      }
    } catch (err) {
      console.error('[v0] Error loading user data:', err)
      const storedName = sessionStorage.getItem('signupFullName')
      if (storedName) {
        setFullName(storedName)
      }
      
      const initialBalance = initializeBalance()
      setBalance(initialBalance)
      setLoadingBalance(false)
      
      const txData = getTransactions()
      setTransactions(txData)
      setLoadingTransactions(false)
    }
  }

  // Set up event listeners for balance and transaction changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const handleBalanceChange = () => {
        try {
          const newBalance = getBalance()
          setBalance(newBalance)
        } catch (e) {
          console.error('[v0] Error updating balance:', e)
        }
      }
      
      const handleTransactionsChange = () => {
        try {
          const newTransactions = getTransactions()
          setTransactions(newTransactions)
        } catch (e) {
          console.error('[v0] Error updating transactions:', e)
        }
      }

      window.addEventListener('balanceChange', handleBalanceChange)
      window.addEventListener('transactionsChange', handleTransactionsChange)

      return () => {
        window.removeEventListener('balanceChange', handleBalanceChange)
        window.removeEventListener('transactionsChange', handleTransactionsChange)
      }
    } catch (err) {
      console.error('[v0] Error setting up event listeners:', err)
    }
  }, [])

  const handleLogout = () => {
    sessionStorage.clear()
    router.push('/')
  }

  const primaryButtons = [
    { label: 'BUY BPC', icon: CreditCard, color: 'bg-yellow-500', path: '/buy-bpc' },
    { label: 'WATCH', icon: Play, color: 'bg-blue-500', path: '/watch' },
    { label: 'AIRTIME', icon: Phone, color: 'bg-green-500', path: '/airtime' },
    { label: 'DATA', icon: Radio, color: 'bg-gray-500', path: '/data' },
  ]

  const moreServices = [
    { label: 'SUPPORT', icon: Headphones, color: 'bg-cyan-500', path: '/support' },
    { label: 'GROUP', icon: Users, color: 'bg-purple-500', path: '/group' },
    { label: 'EARN', icon: DollarSign, color: 'bg-yellow-400', path: '/earn' },
    { label: 'DATA REVIEW', icon: TrendingUp, color: 'bg-pink-500', path: '/support' },
    { label: 'BETTING', icon: Dices, color: 'bg-indigo-600', path: '/betting' },
    { label: 'TV SUBSCRIPTION', icon: Tv, color: 'bg-red-500', path: '/tv-subscription' },
    { label: 'ELECTRICITY', icon: Lightbulb, color: 'bg-yellow-600', path: '/electricity' },
    { label: 'REFER AND EARN', icon: Share2, color: 'bg-emerald-500', path: '/refer-earn' },
  ]

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      {/* Top Blue Header - Compact */}
      <header className="sticky top-0 z-50 bg-[#0000ff] text-white">
        <div className="px-3 py-2 flex items-center justify-between">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 hover:bg-blue-600 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">BLUEPAY</h1>
          <button className="relative p-1 hover:bg-blue-600 rounded-lg">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
          </button>
        </div>
      </header>

      {/* Main Content - Compact */}
      <main className="px-3 py-2 max-w-2xl mx-auto">
        {activeTab === 'home' && (
          <>
            {/* User Greeting - Reduced */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <label className="relative w-16 h-16 rounded-full bg-[#0000ff] flex items-center justify-center text-white text-xl font-bold overflow-hidden cursor-pointer group transition hover:shadow-lg hover:ring-2 hover:ring-[#0000ff] hover:ring-offset-2">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    fullName.charAt(0).toUpperCase()
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    disabled={isUploadingProfile}
                    className="hidden"
                  />
                  {!profileImage && (
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs">
                      <Plus className="w-3 h-3" />
                    </div>
                  )}
                </label>
                <div>
                  <p className="text-gray-500 text-xs">{greeting}</p>
                  <h2 className="text-base font-bold text-gray-900">{fullName}</h2>
                </div>
              </div>
              <button className="p-2 bg-[#0000ff] rounded-full text-white hover:opacity-90">
                <Bell className="w-4 h-4" />
              </button>
            </div>

            {/* Balance Card - Compact */}
            <div className="bg-[#0000ff] rounded-xl p-2.5 text-white shadow-lg mb-3">
              <p className="text-white/70 text-xs mb-1">Available Balance</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 flex-1">
                  <h3 className="text-base font-bold">
                    {loadingBalance ? 'Loading...' : (showBalance ? `NGN${balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••••')}
                  </h3>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-0.5 hover:bg-white/20 rounded-lg transition"
                  >
                    {showBalance ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                </div>
                <button
                  onClick={() => router.push('/withdraw')}
                  className="px-2 py-0.5 bg-white text-[#0000ff] font-bold rounded-full text-xs hover:opacity-90 transition whitespace-nowrap"
                >
                  Withdraw
                </button>
              </div>
              
              {/* Daily Allocation - Compact */}
              <div className="mt-1.5 pt-1.5 border-t border-white/20">
                <div className="flex justify-between items-center text-xs mb-0.5">
                  <p className="text-white/80">Daily Allocation</p>
                  <p className="font-bold text-white">NGN{balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="w-full bg-white/20 rounded-full h-0.5">
                  <div className="bg-white h-0.5 rounded-full" style={{ width: '70%' }} />
                </div>
              </div>
            </div>

            {/* Primary Action Buttons - Compact */}
            <div className="grid grid-cols-4 gap-1 mb-3">
              {primaryButtons.map((btn) => {
                const Icon = btn.icon
                return (
                  <button
                    key={btn.label}
                    onClick={() => router.push(btn.path)}
                    className={`${btn.color} rounded-lg p-2 flex flex-col items-center gap-0.5 hover:opacity-90 transition text-white shadow-sm`}
                  >
                    <Icon className="w-4 h-4" />
                    <p className="text-xs font-bold text-center leading-tight">{btn.label}</p>
                  </button>
                )
              })}
            </div>

            {/* More Services */}
            <h3 className="text-xs font-bold text-gray-900 mb-2">More Services</h3>
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {moreServices.map((btn) => {
                const Icon = btn.icon
                return (
                  <button
                    key={btn.label}
                    onClick={() => router.push(btn.path)}
                    className={`${btn.color} rounded-lg p-2 flex flex-col items-center gap-0.5 hover:opacity-90 transition text-white shadow-sm`}
                  >
                    <Icon className="w-4 h-4" />
                    <p className="text-xs font-bold text-center leading-tight">{btn.label}</p>
                  </button>
                )
              })}
            </div>

            {/* Promotional Banner Carousel */}
            <div className="mb-4">
              <div className="relative w-full rounded-xl overflow-hidden shadow-md bg-gray-900 h-40 md:h-48">
                {/* Banner Slide */}
                <div className="relative w-full h-full">
                  <img
                    src={banners[currentBannerIndex].image}
                    alt={banners[currentBannerIndex].title}
                    className="w-full h-full object-cover transition-all duration-500 ease-in-out"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3C/svg%3E'
                    }}
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/20"></div>
                  
                  {/* Banner caption */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                    <p className="text-white text-xs font-bold">{banners[currentBannerIndex].title}</p>
                    <p className="text-white text-xs opacity-90">{banners[currentBannerIndex].description}</p>
                  </div>

                  {/* Carousel indicators */}
                  <div className="absolute top-2 right-3 flex gap-1">
                    {banners.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentBannerIndex(idx)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          idx === currentBannerIndex ? 'bg-white w-4' : 'bg-white/50'
                        }`}
                        aria-label={`Go to banner ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <h3 className="text-xs font-bold text-gray-900 mb-2">Recent Transactions</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {loadingTransactions ? (
                <p className="text-xs text-gray-600 text-center py-2">Loading...</p>
              ) : transactions.length === 0 ? (
                <p className="text-xs text-gray-600 text-center py-2">No transactions yet</p>
              ) : (
                transactions.slice(0, 8).map((tx, idx) => (
                  <button
                    key={idx}
                    onClick={() => router.push(`/transaction-details?id=${tx.id}`)}
                    className="w-full flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition text-left"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`p-1.5 rounded ${getTransactionColor(tx.type)}`}>
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{tx.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-xs font-bold text-red-600">-₦{Math.abs(tx.amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
              <div className="w-20 h-20 bg-[#0000ff] rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{fullName}</h2>
              <p className="text-gray-600 text-sm mb-4">{userEmail}</p>
              <button className="px-3 py-2 bg-[#0000ff] text-white rounded-xl hover:opacity-90 transition text-sm font-semibold">
                Edit Profile
              </button>
            </div>

            <button className="w-full bg-white rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 transition shadow-sm">
              <Settings className="w-5 h-5 text-[#0000ff]" />
              <span className="font-semibold text-gray-900">Security Settings</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full bg-white rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 transition text-red-600 shadow-sm"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-semibold">Logout</span>
            </button>
          </div>
        )}
      </main>

      {/* Floating Customer Support Button */}
      <button
        onClick={() => {
          window.open('https://wa.me/2347078434086?text=Hello%20BLUEPAY%20Support%2C%20I%20need%20assistance.', '_blank')
        }}
        className="fixed bottom-24 right-4 w-14 h-14 bg-green-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition flex items-center justify-center z-40"
        title="Chat with Grace"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 hover:opacity-100 transition pointer-events-none">
          Hi I&apos;m Grace
        </span>
      </button>

      {/* Floating Telegram Join Button with Animation */}
      <button
        onClick={() => {
          window.open('https://t.me/bluepay2', '_blank')
        }}
        className="fixed bottom-32 right-4 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transition flex items-center justify-center z-40 animate-bounce"
        style={{ animation: 'bounce 2s infinite' }}
        title="Join our Telegram"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 hover:opacity-100 transition pointer-events-none">
          Join TELEGRAM
        </span>
      </button>

      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-2xl mx-auto shadow-2xl">
        <div className="flex justify-around items-center">
          {/* Calendar */}
          <button
            onClick={() => router.push('/calendar')}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors text-gray-600 hover:text-orange-500`}
          >
            <Calendar className="w-5 h-5 mb-1 text-orange-500" />
            <span className="text-xs font-medium">Calendar</span>
          </button>
          
          {/* Social */}
          <button
            onClick={() => router.push('/social')}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors text-gray-600 hover:text-pink-500`}
          >
            <MessageCircle className="w-5 h-5 mb-1 text-pink-500" />
            <span className="text-xs font-medium">Social</span>
          </button>
          
          {/* Center Plus */}
          <button
            onClick={() => router.push('/quick-actions')}
            className="flex-1 flex flex-col items-center justify-center py-3 hover:scale-110 transition"
          >
            <div className="w-11 h-11 bg-[#0000ff] rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl">
              <Plus className="w-6 h-6" />
            </div>
          </button>
          
          {/* Support */}
          <button
            onClick={() => router.push('/support')}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors text-gray-600 hover:text-cyan-500`}
          >
            <BarChart3 className="w-5 h-5 mb-1 text-cyan-500" />
            <span className="text-xs font-medium">Support</span>
          </button>
          
          {/* Profile */}
          <button
            onClick={() => router.push('/profile')}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors text-gray-600 hover:text-purple-600`}
          >
            <UserCircle className="w-5 h-5 mb-1 text-purple-600" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
