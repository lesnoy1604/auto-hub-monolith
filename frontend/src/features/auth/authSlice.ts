import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

interface User {
  name: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
  error: string | null
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
}

export const checkSession = createAsyncThunk('auth/checkSession', async () => {
  const res = await fetch('/api/auth/session', { credentials: 'include' })
  const data = await res.json()
  if (data?.user) return data.user as User
  return null
})

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    const res = await fetch('/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...credentials, redirect: false }),
    })
    if (!res.ok) {
      return rejectWithValue('Неверный email или пароль')
    }
    const sessionRes = await fetch('/api/auth/session', { credentials: 'include' })
    const data = await sessionRes.json()
    if (!data?.user) return rejectWithValue('Неверный email или пароль')
    return data.user as User
  },
)

export const logout = createAsyncThunk('auth/logout', async () => {
  await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' })
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(checkSession.pending, (state) => { state.status = 'loading' })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.user = action.payload
        state.status = action.payload ? 'authenticated' : 'unauthenticated'
      })
      .addCase(checkSession.rejected, (state) => { state.status = 'unauthenticated' })
      .addCase(login.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload
        state.status = 'authenticated'
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'unauthenticated'
        state.error = action.payload as string
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.status = 'unauthenticated'
      })
  },
})

export const authReducer = authSlice.reducer
