'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Gift, Zap, Star, Trophy, Lock } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { getBalance, addBalance, addTransaction, isEarningsPaused, isTaskCompleted, completeTask, canRotateTask } from '@/lib/balance-store'
import { MAX_BALANCE, EARNINGS_PAUSED_MESSAGE } from '@/lib/constants'

export default function EarnMorePage() {
  const router = useRouter()
  const [completedTasks, setCompletedTasks] = useState<number[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [balance, setBalance] = useState(250000) // Demo balance
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState('')
  const [claimingTaskId, setClaimingTaskId] = useState<number | null>(null)
  const [earningsPaused, setEarningsPaused] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadProfileBalance()
    
    // Load balance from unified store
    const currentBalance = getBalance()
    setBalance(currentBalance)
    
    // Load completed tasks from storage
    loadCompletedTasks()
    
    // Check if earnings are paused
    if (currentBalance >= MAX_BALANCE) {
      setEarningsPaused(true)
    } else {
      setEarningsPaused(isEarningsPaused())
    }
    
    const handleBalanceChange = () => {
      const newBalance = getBalance()
      setBalance(newBalance)
      // Re-check earnings paused status when balance changes
      if (newBalance >= MAX_BALANCE) {
        setEarningsPaused(true)
      } else {
        setEarningsPaused(isEarningsPaused())
      }
    }
    window.addEventListener('balanceChange', handleBalanceChange)
    
    return () => window.removeEventListener('balanceChange', handleBalanceChange)
  }, [])

  const loadProfileBalance = async () => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
      }
    } catch (err) {
      console.error('[v0] Error loading user:', err)
    }
  }

  const loadCompletedTasks = () => {
    // Load completed tasks from storage
    const completed: number[] = []
    tasks.forEach(task => {
      if (isTaskCompleted(task.id)) {
        completed.push(task.id)
      }
    })
    setCompletedTasks(completed)
  }

  const tasks = [
    { id: 1, title: 'Share BPC to Friends', reward: 500, difficulty: 'Easy', icon: Gift },
    { id: 2, title: 'Complete Your Profile', reward: 1000, difficulty: 'Easy', icon: CheckCircle },
    { id: 3, title: 'Verify Your Identity', reward: 800, difficulty: 'Medium', icon: Zap },
    { id: 4, title: 'Make 5 Transactions', reward: 1000, difficulty: 'Medium', icon: Trophy },
    { id: 5, title: 'Invite a Friend', reward: 1000, difficulty: 'Easy', icon: Gift },
    { id: 6, title: 'Buy BPC Code', reward: 500, difficulty: 'Medium', icon: Gift },
    { id: 7, title: 'Set Up 2FA', reward: 600, difficulty: 'Easy', icon: Zap },
    { id: 8, title: 'Watch Tutorial Video', reward: 300, difficulty: 'Easy', icon: Star },
    { id: 9, title: 'Rate the App', reward: 400, difficulty: 'Easy', icon: Star },
    { id: 10, title: 'Daily Login Streak (7 days)', reward: 1000, difficulty: 'Medium', icon: Zap },
  ]

  const handleCompleteTask = async (taskId: number) => {
    if (completedTasks.includes(taskId)) return
    if (claimingTaskId) return
    
    // Check if balance is at max or earnings are paused
    if (balance >= MAX_BALANCE || earningsPaused) {
      alert(EARNINGS_PAUSED_MESSAGE)
      return
    }

    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    setClaimingTaskId(taskId)

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      console.log('[v0] Claiming reward:', { taskId, reward: task.reward, userId })

      // Check again before adding balance (backend validation)
      const currentBalance = getBalance()
      if (currentBalance + task.reward > MAX_BALANCE) {
        setEarningsPaused(true)
        alert('Cannot claim reward - would exceed maximum balance. Complete a transaction to continue earning.')
        return
      }

      // Update demo balance in unified store
      const result = addBalance(task.reward)
      const newBalance = typeof result === 'object' ? result.newBalance : result
      setBalance(newBalance)
      
      // Mark task as completed in storage
      completeTask(taskId)
      
      setCompletedTasks([...completedTasks, taskId])
      setTotalEarnings(totalEarnings + task.reward)

      // Update earnings paused status if at max
      if (newBalance >= MAX_BALANCE) {
        setEarningsPaused(true)
      }

      // Add transaction to unified store
      addTransaction({
        type: 'reward',
        amount: task.reward,
        status: 'success',
        description: `Reward Claim - ${task.title}`,
      })

      console.log('[v0] Reward claimed successfully:', { newBalance, taskId })
    } catch (err) {
      console.error('[v0] Error completing task:', err)
      alert('Failed to claim reward. Please try again.')
    } finally {
      setClaimingTaskId(null)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-3 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-[#0000ff] hover:opacity-80 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold text-sm">Back</span>
          </button>
          <h1 className="text-lg font-bold text-gray-900">Earn More</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-3 py-4">
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-[#0000ff] to-blue-600 rounded-xl p-4 text-white mb-4">
          <p className="text-white/70 text-xs mb-1">Current Balance</p>
          <h2 className="text-2xl font-bold">NGN {balance.toLocaleString()}</h2>
          <p className="text-xs opacity-80 mt-1">Earned: ₦{totalEarnings.toLocaleString()}</p>
        </div>

        {/* Tasks Grid */}
        <h3 className="text-base font-bold text-gray-900 mb-3">Available Tasks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {tasks.map((task) => {
            const Icon = task.icon
            const isCompleted = completedTasks.includes(task.id)

            return (
              <div
                key={task.id}
                className={`rounded-lg p-3 border transition-all ${
                  isCompleted
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : 'border-gray-200 bg-white hover:border-[#0000ff]'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <div className={`p-2 rounded ${isCompleted ? 'bg-gray-200' : 'bg-[#0000ff]/10'}`}>
                    {isCompleted ? (
                      <Lock className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Icon className={`w-4 h-4 ${isCompleted ? 'text-gray-400' : 'text-[#0000ff]'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold text-xs mb-0 ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </h4>
                      {isCompleted && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-semibold">
                          Locked
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded inline-block mt-1 ${
                        task.difficulty === 'Easy'
                          ? 'bg-green-100 text-green-700'
                          : task.difficulty === 'Medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {task.difficulty}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#0000ff]">+₦{task.reward}</p>
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    disabled={isCompleted || claimingTaskId === task.id || earningsPaused}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                      isCompleted
                        ? 'bg-gray-200 text-gray-500 flex items-center gap-1'
                        : earningsPaused
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : claimingTaskId === task.id
                            ? 'bg-[#0000ff]/70 text-white'
                            : 'bg-[#0000ff] text-white hover:opacity-90'
                    }`}
                    title={earningsPaused ? EARNINGS_PAUSED_MESSAGE : ''}
                  >
                    {isCompleted ? (
                      <>
                        <Lock className="w-3 h-3" />
                        Locked
                      </>
                    ) : earningsPaused ? (
                      'Paused'
                    ) : claimingTaskId === task.id ? (
                      'Claiming...'
                    ) : (
                      'Claim'
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Info Box */}
        <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-gray-700">
            <span className="font-semibold">💡 Tip:</span> Complete tasks to earn rewards that are added directly to your BLUEPAY balance!
          </p>
        </div>
      </main>
    </div>
  )
}
