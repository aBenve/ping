import { create } from 'zustand'
import { Profile, AlertWithRecipients, ContactWithProfile, RequestWithUsers } from '@/types/database'

interface AppState {
  // Auth
  user: Profile | null
  setUser: (user: Profile | null) => void
  
  // Alerts
  activeAlert: AlertWithRecipients | null
  setActiveAlert: (alert: AlertWithRecipients | null) => void
  
  // Contacts
  contacts: ContactWithProfile[]
  setContacts: (contacts: ContactWithProfile[]) => void
  
  // Requests
  pendingRequests: RequestWithUsers[]
  setPendingRequests: (requests: RequestWithUsers[]) => void
  
  // UI State
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  
  // Reset
  reset: () => void
}

const initialState = {
  user: null,
  activeAlert: null,
  contacts: [],
  pendingRequests: [],
  isLoading: false,
}

export const useStore = create<AppState>((set) => ({
  ...initialState,
  
  // Auth
  setUser: (user) => set({ user }),
  
  // Alerts
  setActiveAlert: (activeAlert) => set({ activeAlert }),
  
  // Contacts
  setContacts: (contacts) => set({ contacts }),
  
  // Requests
  setPendingRequests: (pendingRequests) => set({ pendingRequests }),
  
  // UI
  setIsLoading: (isLoading) => set({ isLoading }),
  
  // Reset
  reset: () => set(initialState),
}))
