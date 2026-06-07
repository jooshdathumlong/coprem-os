import { NextResponse } from 'next/server'

// JOB pillar — aggregates job service status and metrics
export async function GET() {
  return NextResponse.json({
    pillar: 'job',
    services: ['n8n', 'jeff-agent', 'wf01'],
    status: 'active',
  })
}
