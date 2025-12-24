import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/stores/useStore'
import { ContactWithProfile } from '@/types/database'

export function useContacts() {
  const { user, contacts, setContacts } = useStore()

  const fetchContacts = useCallback(async (): Promise<ContactWithProfile[]> => {
    if (!user) return []

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          contact:profiles!contact_id(*)
        `)
        .eq('user_id', user.id)
        .order('is_trusted', { ascending: false })

      if (error) throw error

      const contactsData = data as ContactWithProfile[]
      setContacts(contactsData)
      return contactsData
    } catch (error) {
      console.error('Error fetching contacts:', error)
      return []
    }
  }, [user, setContacts])

  async function addContact(username: string): Promise<void> {
    if (!user) throw new Error('No user logged in')

    // Buscar usuario por username
    const { data: contactProfile, error: searchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase().trim())
      .single()

    if (searchError || !contactProfile) {
      throw new Error('Usuario no encontrado')
    }

    if (contactProfile.id === user.id) {
      throw new Error('No podés agregarte a vos mismo')
    }

    // Verificar si ya existe
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', user.id)
      .eq('contact_id', contactProfile.id)
      .single()

    if (existing) {
      throw new Error('Este contacto ya existe')
    }

    // Crear contacto
    const { error } = await supabase
      .from('contacts')
      .insert({
        user_id: user.id,
        contact_id: contactProfile.id,
        is_trusted: false,
      })

    if (error) throw error

    await fetchContacts()
  }

  async function removeContact(contactId: string): Promise<void> {
    if (!user) throw new Error('No user logged in')

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('user_id', user.id)
      .eq('contact_id', contactId)

    if (error) throw error

    await fetchContacts()
  }

  async function toggleTrusted(contactId: string, isTrusted: boolean): Promise<void> {
    if (!user) throw new Error('No user logged in')

    const { error } = await supabase
      .from('contacts')
      .update({ is_trusted: isTrusted })
      .eq('user_id', user.id)
      .eq('contact_id', contactId)

    if (error) throw error

    await fetchContacts()
  }

  const trustedContacts = contacts.filter(c => c.is_trusted)

  return {
    contacts,
    trustedContacts,
    fetchContacts,
    addContact,
    removeContact,
    toggleTrusted,
  }
}
