import Image from 'next/image'
import Link from 'next/link'
import { Activity, Shield, Zap, FileText, Mic, Brain } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <Image src="/logo.svg" alt="UrgentCare EMR" width={80} height={80} className="mx-auto" />
          <h1 className="text-5xl font-bold tracking-tight">UrgentCare EMR</h1>
          <p className="text-xl text-muted-foreground">
            AI-powered, HIPAA-compliant urgent care EMR with speech-to-text and intelligent documentation
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link 
              href="/login" 
              className="inline-flex px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="inline-flex px-6 py-3 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground font-medium transition"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20 max-w-6xl mx-auto">
          <FeatureCard 
            icon={<Mic className="w-6 h-6" />}
            title="Voice Documentation"
            description="Record patient encounters with real-time speech-to-text transcription"
          />
          <FeatureCard 
            icon={<Brain className="w-6 h-6" />}
            title="AI-Powered Notes"
            description="Generate structured SOAP notes automatically using advanced AI"
          />
          <FeatureCard 
            icon={<FileText className="w-6 h-6" />}
            title="Smart Templates"
            description="Pre-built templates for common urgent care scenarios"
          />
          <FeatureCard 
            icon={<Shield className="w-6 h-6" />}
            title="HIPAA Compliant"
            description="End-to-end encryption and comprehensive audit logging"
          />
          <FeatureCard 
            icon={<Zap className="w-6 h-6" />}
            title="Fast & Efficient"
            description="Reduce documentation time by up to 70%"
          />
          <FeatureCard 
            icon={<Activity className="w-6 h-6" />}
            title="Real-time Sync"
            description="Access patient data across devices instantly"
          />
        </div>

        {/* Tech Stack */}
        <div className="mt-20 text-center space-y-4">
          <h2 className="text-2xl font-semibold">Built with Modern Technology</h2>
          <div className="flex flex-wrap gap-3 justify-center text-sm text-muted-foreground">
            <Badge>Next.js 14</Badge>
            <Badge>.NET 8</Badge>
            <Badge>PostgreSQL</Badge>
            <Badge>Anthropic Claude</Badge>
            <Badge>OpenAI Whisper</Badge>
            <Badge>Prisma ORM</Badge>
            <Badge>shadcn/ui</Badge>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>Phase 1: Authentication, Patient Management API, and UI Framework Complete</p>
          <p className="mt-2">
            <a 
              href="https://github.com/kj12354/UrgentCare" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition"
            >
              View on GitHub
            </a>
          </p>
        </footer>
      </div>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
      {children}
    </span>
  )
}
