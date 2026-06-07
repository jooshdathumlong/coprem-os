import { NextResponse } from 'next/server'

// PERSONAL pillar — aggregates personal agent status and projects
export async function GET() {
  return NextResponse.json({
    pillar: 'personal',
    services: ['eilinaire-agent'],
    status: 'active',
  })
}
