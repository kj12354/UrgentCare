import Link from 'next/link'

export default function Sidebar() {
  return (
    <aside className="w-60 border-r min-h-screen p-4 space-y-3">
      <h2 className="font-semibold">EMR</h2>
      <nav className="space-y-2 text-sm">
        <Link href="/dashboard" className="block">Dashboard</Link>
        <Link href="/patients" className="block">Patients</Link>
        <Link href="/encounters" className="block">Encounters</Link>
        <Link href="/documents" className="block">Documents</Link>
        <Link href="/analytics" className="block">Analytics</Link>
      </nav>
    </aside>
  )
}
