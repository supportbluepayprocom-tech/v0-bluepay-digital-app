'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Copy, Check, Users, TrendingUp, Gift, UserCheck, Calendar } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { getBalance, isEarningsPaused } from '@/lib/balance-store'
import { MAX_BALANCE, EARNINGS_PAUSED_MESSAGE } from '@/lib/constants'

export default function ReferAndEarnPage() {
  const router = useRouter()
  const [referralCode, setReferralCode] = useState('')
  const [referralLink, setReferralLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [fullName, setFullName] = useState('User')
  const [totalReferrals, setTotalReferrals] = useState(0)
  const [activeReferrals, setActiveReferrals] = useState(0)
  const [totalEarned, setTotalEarned] = useState(0)
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [referralHistory, setReferralHistory] = useState<Array<any>>([])
  const [earningsPaused, setEarningsPaused] = useState(false)

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          // Fetch profile data
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name, referral_code, total_referrals, active_referrals, total_earned, balance')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            setFullName(profile.full_name || 'User')
            setReferralCode(profile.referral_code || `BLUEPAY${Math.random().toString(36).substring(7).toUpperCase()}`)
            setTotalReferrals(profile.total_referrals || 0)
            setActiveReferrals(profile.active_referrals || 0)
            setTotalEarned(profile.total_earned || 0)
            setBalance(profile.balance || 0)

            // Check if earnings are paused
            const currentBalance = profile.balance || 0
            if (currentBalance >= MAX_BALANCE) {
              setEarningsPaused(true)
            } else {
              setEarningsPaused(isEarningsPaused())
            }

            // Fetch referral history from referrals table
            const { data: referrals } = await supabase
              .from('referral_transactions')
              .select('*')
              .eq('referrer_id', session.user.id)
              .order('created_at', { ascending: false })
              .limit(10)

            if (referrals) {
              setReferralHistory(referrals)
            }
          }
        }
      } catch (err) {
        console.error('[v0] Error loading profile:', err)
        // Fallback to sessionStorage
        const storedName = sessionStorage.getItem('signupFullName')
        setFullName(storedName || 'User')
        setReferralCode(`BLUEPAY${Math.random().toString(36).substring(7).toUpperCase()}`)
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [])

  // Generate referral link and setup realtime updates
  useEffect(() => {
    if (referralCode) {
      setReferralLink(`https://wwwbluepaywebauthdormaindigital-app.vercel.app/?ref=${referralCode}`)

      // Setup realtime subscription for profile updates
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: { session } } = supabase.auth.getSession()
      if (session?.user) {
        const subscription = supabase
          .from(`profiles:id=eq.${session.user.id}`)
          .on('*', payload => {
            if (payload.new) {
              setTotalReferrals(payload.new.total_referrals || 0)
              setActiveReferrals(payload.new.active_referrals || 0)
              setTotalEarned(payload.new.total_earned || 0)
              setBalance(payload.new.balance || 0)
            }
          })
          .subscribe()

        return () => {
          subscription.unsubscribe()
        }
      }
    }
  }, [referralCode])

  const handleCopyCode = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShareLink = async () => {
    if (!referralLink) return

    const message = `Join BLUEPAY PRO V30 and earn rewards!\n\nUse my referral link:\n${referralLink}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BLUEPAY PRO V30 - Referral',
          text: message,
        })
      } catch (err) {
        console.log('[v0] Share cancelled')
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(referralLink)
      alert('Referral link copied!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Refer & Earn</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Referral Link Card */}
        <div className="bg-gradient-to-r from-[#0000ff] to-blue-600 rounded-2xl p-5 text-white mb-2">
          <p className="text-sm mb-2 opacity-90">Your Referral Link</p>
          <div className="bg-white bg-opacity-10 rounded-lg p-3 mb-4 break-all font-mono text-xs">
            {referralLink}
          </div>
          <button
            onClick={handleCopyCode}
            className="w-full bg-white text-[#0000ff] font-bold py-2 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Link
              </>
            )}
          </button>
        </div>

        {/* Referral Stats */}
        <div className="grid grid-cols-3 gap-3 mb-2">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-[#0000ff]" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalReferrals}</p>
            <p className="text-xs text-gray-600 mt-1">Total Referrals</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">NGN {totalEarned.toLocaleString()}</p>
            <p className="text-xs text-gray-600 mt-1">Total Earned</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Gift className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{activeReferrals}</p>
            <p className="text-xs text-gray-600 mt-1">Active Referrals</p>
          </div>
        </div>

        {/* Available Balance */}
        <div className="bg-gradient-to-r from-blue-600 to-[#0000ff] rounded-2xl p-5 text-white mb-2 shadow-lg">
          <p className="text-sm opacity-90 mb-2">Available Balance</p>
          <p className="text-3xl font-bold mb-1">NGN {balance.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs opacity-80">Withdraw anytime to your bank account</p>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-2 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">How It Works</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0000ff] text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">1</div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Share Your Link</p>
                <p className="text-xs text-gray-600">Share your unique referral link with friends</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0000ff] text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">2</div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Friends Sign Up</p>
                <p className="text-xs text-gray-600">They create an account using your referral link</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0000ff] text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">3</div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">You Earn</p>
                <p className="text-xs text-gray-600">Get ₦1,000 for each successful referral</p>
              </div>
            </div>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleShareLink}
            className="w-full bg-[#0000ff] text-white font-bold py-3 rounded-xl hover:opacity-90 transition text-sm"
          >
            Invite Friends
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gray-100 text-gray-900 font-bold py-3 rounded-xl hover:bg-gray-200 transition text-sm"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Referral Activity History */}
        {referralHistory.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-2 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Referral Activity</h2>
            <div className="space-y-3">
              {referralHistory.map((referral, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0000ff]/10 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-[#0000ff]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{referral.referred_full_name || 'Referred User'}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {referral.created_at ? new Date(referral.created_at).toLocaleDateString() : 'Recently'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#0000ff] text-sm">+NGN {(referral.reward_amount || 1000).toLocaleString()}</p>
                    <p className={`text-xs font-semibold ${referral.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                      {referral.status === 'active' ? 'Active' : 'Pending'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 rounded-xl p-4 mt-2 border border-blue-200">
          <p className="text-xs text-blue-900">
            <span className="font-semibold block mb-1">Referral Program:</span>
            Earn ₦1,000 for each friend who signs up and completes their first transaction. Your friend also gets a ₦500 bonus!
          </p>
        </div>
      </div>
    </div>
  )
}
