'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  const signInWithPassword = async () => {
    setMsg('Signing in...')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMsg(`Error: ${error.message}`)
      return
    }
    router.replace('/test-organizations')
  }

  const sendLink = async () => {
    setMsg('Sending magic link...')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMsg(`Error: ${error.message}`)
      return
    }

    setMsg('Check je mail en klik de link')
  }

  const check = async () => {
    const { data } = await supabase.auth.getUser()
    setMsg(`Current user: ${data.user?.email ?? 'none'}`)
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Login</h1>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email"
        style={{ padding: 10, width: 320 }}
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
        style={{ padding: 10, width: 320, marginTop: 8, display: 'block' }}
      />

      <div style={{ marginTop: 12 }}>
        <button onClick={signInWithPassword}>Sign in with password</button>
        <button onClick={sendLink} style={{ marginLeft: 12 }}>
          Send magic link
        </button>
        <button onClick={check} style={{ marginLeft: 12 }}>
          Check session
        </button>
      </div>

      <pre style={{ marginTop: 20 }}>{msg}</pre>
    </div>
  )
}
