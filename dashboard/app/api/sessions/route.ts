import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const ROOT = join(process.cwd(), '..')

function parseStatusSessions(content: string) {
  const sessions: { date: string; title: string; steps: { time: string; action: string; result: string }[] }[] = []
  const lines = content.split('\n')
  let current: typeof sessions[0] | null = null

  for (const line of lines) {
    const sessionMatch = line.match(/^## (\d{4}-\d{2}-\d{2})\s+(.+)/)
    if (sessionMatch) {
      if (current) sessions.push(current)
      current = { date: sessionMatch[1], title: sessionMatch[2].trim(), steps: [] }
      continue
    }
    if (current && line.startsWith('| 20')) {
      const parts = line.split('|').map(s => s.trim()).filter(Boolean)
      if (parts.length >= 2) {
        current.steps.push({ time: parts[0], action: parts[1], result: parts[2] || '' })
      }
    }
  }
  if (current) sessions.push(current)
  return sessions.reverse().slice(0, 10)
}

function getGitLog() {
  try {
    const out = execSync(`git -C ${ROOT} log --oneline -20 --format="%h|||%s|||%cr"`, { encoding: 'utf8' })
    return out.trim().split('\n').filter(Boolean).map(line => {
      const [hash, subject, time] = line.split('|||')
      return { hash, subject, time }
    })
  } catch { return [] }
}

export async function GET() {
  const statusPath = join(ROOT, 'STATUS.md')
  const status = existsSync(statusPath) ? readFileSync(statusPath, 'utf-8') : ''
  const sessions = parseStatusSessions(status)
  const commits = getGitLog()
  return NextResponse.json({ sessions, commits })
}
