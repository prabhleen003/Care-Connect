import { Link } from "wouter";
import { useImpactStats } from "@/hooks/use-impact";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { ArrowRight, Users, Heart, Globe, CheckCircle } from "lucide-react";

export default function Landing() {
  const { data: stats } = useImpactStats();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Abstract background blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-display font-bold text-secondary tracking-tight leading-tight">
                Make an Impact <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  That Matters.
                </span>
              </h1>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-muted-foreground leading-relaxed"
            >
              Connect with causes that need you. CareConnect bridges the gap between passionate volunteers and NGOs changing the world.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              <Link href="/register">
                <Button size="xl" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/25 bg-primary hover:bg-primary/90">
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="xl" variant="outline" className="h-14 px-8 text-lg rounded-full border-2">
                  I'm an Organization
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatsCard 
              icon={<Users className="h-8 w-8 text-primary" />}
              value={stats?.totalVolunteers || 0}
              label="Active Volunteers"
            />
            <StatsCard 
              icon={<Globe className="h-8 w-8 text-accent" />}
              value={stats?.totalNgos || 0}
              label="Partner NGOs"
            />
            <StatsCard 
              icon={<CheckCircle className="h-8 w-8 text-green-500" />}
              value={stats?.causesCompleted || 0}
              label="Causes Completed"
            />
            <StatsCard 
              icon={<Heart className="h-8 w-8 text-rose-500" />}
              value={stats?.volunteerHours || 0}
              label="Volunteer Hours"
            />
          </div>
        </div>
      </section>

      {/* Features/Info Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-display font-bold text-secondary">Why Join CareConnect?</h2>
              <p className="text-lg text-muted-foreground">
                We simplify the process of finding meaningful volunteer work. Whether you're an individual looking to give back or an organization in need of hands, we've built the tools you need.
              </p>
              <ul className="space-y-4">
                {[
                  "Verified NGOs and impactful causes",
                  "Track your volunteer hours and impact",
                  "Certificate generation for completed tasks",
                  "Community of changemakers"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-secondary font-medium">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-2xl transform rotate-3 scale-105" />
              {/* diverse group of volunteers planting trees */}
              <img 
                src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80" 
                alt="Volunteers working together" 
                className="relative rounded-2xl shadow-2xl border border-white/10"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatsCard({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) {
  return (
    <div className="text-center space-y-2 p-6 rounded-2xl hover:bg-muted/50 transition-colors">
      <div className="mx-auto w-16 h-16 rounded-full bg-background border shadow-sm flex items-center justify-center mb-4">
        {icon}
      </div>
      <div className="text-3xl font-bold text-secondary font-display">{value}+</div>
      <div className="text-muted-foreground text-sm font-medium uppercase tracking-wide">{label}</div>
    </div>
  );
}
