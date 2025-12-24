import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/stores/useStore'
import { Session } from '@supabase/supabase-js'

export function useAuth() {
  const { user, setUser, reset } = useStore()
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setIsLoading(false)
      }
    })

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (data && !error) {
        setUser(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function signUp(email: string, password: string, username: string, fullName?: string) {
    // El trigger on_auth_user_created crea el perfil automáticamente
    // usando los datos de raw_user_meta_data
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName || null,
        },
      },
    })

    if (authError) throw authError

    return authData
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    reset()
  }

  async function updateProfile(updates: { username?: string; full_name?: string; phone?: string }) {
    if (!user) throw new Error('No user logged in')

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    setUser(data)
    return data
  }

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }
}
