import React, {
  createContext, useContext, useEffect,
  useState, useCallback, useRef,
} from 'react'
import { supabase } from '@/app/lib/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'

export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string
  platform_type: string
  city: string
  pincode: string
  zone: string
  city_tier: string
  weekly_earnings: number
  upi_id: string
  shield_score: number
  role: 'user' | 'admin'
  date_of_birth?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  created_at: string
}

export interface ActivePolicy {
  id: string
  user_id: string
  plan_id: string
  plan_name: string
  weekly_premium: number
  coverage_amount: number
  weekly_payout_cap: number
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'PENDING CHANGE'
  start_date: string
  dynamic_premium?: number
  season_multiplier?: number
  tier_multiplier?: number
}

interface AppContextType {
  user:         User | null
  session:      Session | null
  profile:      Profile | null
  activePolicy: ActivePolicy | null
  loading:      boolean
  profileLoading: boolean
  setProfile:   (p: Profile | null) => void
  setActivePolicy: (p: ActivePolicy | null) => void
  refreshProfile: () => Promise<void>
  refreshPolicy:  () => Promise<void>
  signOut:      () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user,         setUser]         = useState<User | null>(null)
  const [session,      setSession]      = useState<Session | null>(null)
  const [profile,      setProfile]      = useState<Profile | null>(null)
  const [activePolicy, setActivePolicy] = useState<ActivePolicy | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchProfile = useCallback(async (uid: string) => {
    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle()

      if (error) {
        console.error('[AppContext] Profile fetch error:', error)
        return
      }

        if (!data) {
          // Profile missing — create from auth metadata
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const meta = user.user_metadata || {}
            const fallback = {
              id: uid,
              email: user.email || '',
              full_name:
                meta.full_name || meta.name || user.email?.split('@')[0] || '',
              phone: meta.phone || '',
              platform_type: meta.platform_type || '',
              city: meta.city || '',
              pincode: meta.pincode || '',
              zone: meta.zone || '',
              city_tier: meta.city_tier || 'Tier 3',
              weekly_earnings: Number(meta.weekly_earnings) || 3000,
              upi_id: meta.upi_id || '',
              shield_score: 75,
              role: 'user',
            }
            const { data: created } = await supabase
              .from('profiles')
              .upsert(fallback, { onConflict: 'id' })
              .select()
              .maybeSingle()
            if (created) setProfile(created as Profile)
          }
          return
        }

      setProfile(data as Profile)
    } catch (e) {
      console.error('[AppContext] fetchProfile exception:', e)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const fetchPolicy = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('user_id', uid)
        .neq('status', 'CANCELLED')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('[AppContext] Policy fetch error:', error)
        return
      }
      setActivePolicy(data as ActivePolicy | null)
    } catch (e) {
      console.error('[AppContext] fetchPolicy exception:', e)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id)
  }, [user, fetchProfile])

  const refreshPolicy = useCallback(async () => {
    if (user?.id) await fetchPolicy(user.id)
  }, [user, fetchPolicy])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setActivePolicy(null)
  }, [])

  useEffect(() => {
    // Safety timeout — never get stuck loading
    const safetyTimer = setTimeout(() => {
      setLoading(false)
    }, 5000)

    const init = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession()
        setSession(s)
        setUser(s?.user ?? null)

        if (s?.user) {
          await Promise.all([
            fetchProfile(s.user.id),
            fetchPolicy(s.user.id),
          ])
        }
      } catch (e) {
        console.error('[AppContext] init error:', e)
      } finally {
        clearTimeout(safetyTimer)
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        setSession(s)
        setUser(s?.user ?? null)

        if (event === 'SIGNED_IN' && s?.user) {
          // Silent fetch, do not block
          fetchProfile(s.user.id)
          fetchPolicy(s.user.id)
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null)
          setActivePolicy(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(safetyTimer)
    }
  }, [fetchProfile, fetchPolicy])

  return (
    <AppContext.Provider value={{
      user, session, profile, activePolicy,
      loading, profileLoading,
      setProfile, setActivePolicy,
      refreshProfile, refreshPolicy,
      signOut,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
