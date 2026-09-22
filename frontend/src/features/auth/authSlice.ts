import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

interface User {
  id: number
  name: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
  error: string | null
}

function parseJWT(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return { id: payload.id, name: payload.name, email: payload.email, role: payload.role }
  } catch {
    return null
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
}

export const checkSession = createAsyncThunk('auth/checkSession', async () => {
  const token = localStorage.getItem('access_token')
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('access_token')
    return null
  }
  return parseJWT(token)
})

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    if (!res.ok) {
      return rejectWithValue('Неверный email или пароль')
    }
    const data = await res.json()
    localStorage.setItem('access_token', data.access_token)
    return parseJWT(data.access_token)
  },
)

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('access_token')
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
