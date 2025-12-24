import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface PushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  badge?: number
  priority?: 'default' | 'normal' | 'high'
}

serve(async (req) => {
  try {
    const { messages } = await req.json() as { messages: PushMessage[] }

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Filter out invalid tokens
    const validMessages = messages.filter(
      (m) => m.to && m.to.startsWith('ExponentPushToken')
    )

    if (validMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid push tokens' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validMessages),
    })

    const result = await response.json()

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
