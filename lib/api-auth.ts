
import { NextResponse } from 'next/server';

export async function verifyAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    console.error('Missing NEXT_PUBLIC_FIREBASE_API_KEY');
    return null;
  }

  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken: token }),
    });

    const data = await res.json();

    if (data.users && data.users.length > 0) {
      return data.users[0]; // Valid user
    }
  } catch (error) {
    console.error('Auth verification failed:', error);
  }

  return null;
}

export function unauthorizedResponse() {
  return NextResponse.json({ ok: false, error: 'Unauthorized: Invalid or missing token' }, { status: 401 });
}
