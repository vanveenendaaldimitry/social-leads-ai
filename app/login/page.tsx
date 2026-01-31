'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')

  const sendLink = async () => {
    setMsg('Sending magic link...')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/test-organizations`,
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

      <div style={{ marginTop: 12 }}>
        <button onClick={sendLink}>Send magic link</button>
        <button onClick={check} style={{ marginLeft: 12 }}>
          Check session
        </button>
      </div>

      <pre style={{ marginTop: 20 }}>{msg}</pre>
    </div>
  )
}
