import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Upload, Layers, Palette, Calculator } from 'lucide-react'

const features = [
  {
    icon: Upload,
    title: 'Upload Your House',
    description: 'Simply upload a photo of your home exterior. Our system accepts any angle or lighting condition.',
  },
  {
    icon: Layers,
    title: 'AI Region Detection',
    description: 'Advanced AI automatically identifies walls, windows, balconies, railings, and other architectural elements.',
  },
  {
    icon: Palette,
    title: 'Apply Materials',
    description: 'Browse our catalog of paints, cladding, tiles, and panels. Preview textures on each detected region.',
  },
  {
    icon: Calculator,
    title: 'Instant Cost Estimate',
    description: 'Get a detailed breakdown of material costs, labor costs, and quantities — with editable rates.',
  },
]

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="font-heading text-5xl font-bold tracking-tight text-[#1C2B3A] sm:text-6xl">
                Reimagine Your Home&apos;s Exterior
              </h1>
              <p className="mt-6 text-lg leading-8 text-[#1C2B3A]/70">
                Upload a photo, let AI detect architectural regions, apply premium materials,
                and get an accurate renovation cost estimate — all in minutes.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-[#C4622D] hover:bg-[#a85225] text-base px-8">
                    Start Your Project
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="text-base px-8">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
            <div className="relative left-[calc(50%)] aspect-[1155/678] w-[36rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#C4622D]/20 to-[#C4622D]/5 opacity-30 sm:w-[72rem]" />
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="font-heading text-3xl font-bold text-[#1C2B3A] sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-[#1C2B3A]/60">
                Four simple steps to your dream exterior
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, i) => (
                <div
                  key={feature.title}
                  className="relative rounded-2xl border border-[#1C2B3A]/5 bg-[#FAFAF8] p-8 transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#C4622D]/10">
                    <feature.icon className="h-6 w-6 text-[#C4622D]" />
                  </div>
                  <span className="absolute top-6 right-6 font-heading text-4xl font-bold text-[#1C2B3A]/5">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-heading text-xl font-semibold text-[#1C2B3A]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#1C2B3A]/60">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-[#1C2B3A] px-8 py-16 text-center sm:px-16">
              <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
                Ready to Transform Your Home?
              </h2>
              <p className="mt-4 text-lg text-white/70">
                Join homeowners who plan smarter renovations with AI-powered cost estimates.
              </p>
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="mt-8 bg-[#C4622D] hover:bg-[#a85225] text-base px-8"
                >
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1C2B3A]/10 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-[#1C2B3A]/50">
          &copy; {new Date().getFullYear()} RenovateAI. All rights reserved.
        </div>
      </footer>
    </>
  )
}
