import { create } from 'zustand';
import { personaApi, Persona, CreatePersonaData, UpdatePersonaData } from '@/lib/api/persona';

interface PersonaState {
  personas: Persona[];
  currentPersona: Persona | null;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
}

interface PersonaActions {
  // State management
  setPersonas: (personas: Persona[]) => void;
  setCurrentPersona: (persona: Persona | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // API actions
  fetchPersonas: () => Promise<void>;
  fetchPersona: (id: string) => Promise<void>;
  createPersona: (data: CreatePersonaData) => Promise<Persona>;
  updatePersona: (id: string, data: UpdatePersonaData) => Promise<Persona>;
  deletePersona: (id: string) => Promise<void>;
  seedDefaultPersonas: () => Promise<void>;
  
  // Local state updates
  addPersona: (persona: Persona) => void;
  updatePersonaInList: (id: string, data: Partial<Persona>) => void;
  removePersonaFromList: (id: string) => void;
}

const initialState: PersonaState = {
  personas: [],
  currentPersona: null,
  isLoading: false,
  error: null,
  totalCount: 0,
};

export const usePersonaStore = create<PersonaState & PersonaActions>((set, get) => ({
  ...initialState,

  // State management
  setPersonas: (personas) => set({ personas }),
  setCurrentPersona: (persona) => set({ currentPersona: persona }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // API actions
  fetchPersonas: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await personaApi.getPersonas();
      set({
        personas: response.data,
        totalCount: response.count,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Failed to fetch personas',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchPersona: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await personaApi.getPersona(id);
      set({
        currentPersona: response.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Failed to fetch persona',
        isLoading: false,
      });
      throw error;
    }
  },

  createPersona: async (data: CreatePersonaData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await personaApi.createPersona(data);
      const newPersona = response.data;
      
      // Update local state
      set((state) => ({
        personas: [newPersona, ...state.personas],
        totalCount: state.totalCount + 1,
        isLoading: false,
      }));
      
      return newPersona;
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Failed to create persona',
        isLoading: false,
      });
      throw error;
    }
  },

  updatePersona: async (id: string, data: UpdatePersonaData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await personaApi.updatePersona(id, data);
      const updatedPersona = response.data;
      
      // Update local state
      set((state) => ({
        personas: state.personas.map((p) =>
          p.id === id ? updatedPersona : p
        ),
        currentPersona: state.currentPersona?.id === id ? updatedPersona : state.currentPersona,
        isLoading: false,
      }));
      
      return updatedPersona;
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Failed to update persona',
        isLoading: false,
      });
      throw error;
    }
  },

  deletePersona: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await personaApi.deletePersona(id);
      
      // Update local state (soft delete - set isActive to false)
      set((state) => ({
        personas: state.personas.map((p) =>
          p.id === id ? { ...p, isActive: false } : p
        ),
        currentPersona: state.currentPersona?.id === id ? null : state.currentPersona,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Failed to delete persona',
        isLoading: false,
      });
      throw error;
    }
  },

  seedDefaultPersonas: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await personaApi.seedDefaultPersonas();
      set({
        personas: response.data,
        totalCount: response.data.length,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Failed to seed default personas',
        isLoading: false,
      });
      throw error;
    }
  },

  // Local state updates
  addPersona: (persona: Persona) => {
    set((state) => ({
      personas: [persona, ...state.personas],
      totalCount: state.totalCount + 1,
    }));
  },

  updatePersonaInList: (id: string, data: Partial<Persona>) => {
    set((state) => ({
      personas: state.personas.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
      currentPersona: state.currentPersona?.id === id 
        ? { ...state.currentPersona, ...data }
        : state.currentPersona,
    }));
  },

  removePersonaFromList: (id: string) => {
    set((state) => ({
      personas: state.personas.filter((p) => p.id !== id),
      totalCount: state.totalCount - 1,
      currentPersona: state.currentPersona?.id === id ? null : state.currentPersona,
    }));
  },
}));