import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check required environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SANITY_PROJECT_ID',
      'NEXT_PUBLIC_SANITY_DATASET',
      'SANITY_API_WRITE_TOKEN'
    ]

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        ok: false,
        error: 'Missing environment variables',
        missingVars,
        message: 'Please check your .env.local file and ensure all required variables are set.'
      }, { status: 500 })
    }

    // Test Sanity connection
    try {
      const serverClient = (await import('@/sanity/lib/serverClient')).default
      await serverClient.fetch('*[_type == "quiz"][0]')
      
      return NextResponse.json({
        ok: true,
        message: 'All systems operational',
        sanityConnection: 'Connected',
        timestamp: new Date().toISOString()
      })
    } catch (sanityError: any) {
      return NextResponse.json({
        ok: false,
        error: 'Sanity connection failed',
        details: sanityError.message,
        message: 'Environment variables are set but Sanity connection failed. Check your project ID, dataset, and token.'
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: 'Health check failed',
      details: error.message
    }, { status: 500 })
  }
}
