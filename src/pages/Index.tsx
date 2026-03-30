import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, QrCode, Sparkles, BarChart3, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import PricingCards from "@/components/PricingCards";

const features = [
  {
    icon: QrCode,
    title: "QR Code Generator",
    desc: "Create branded QR codes that link directly to your review funnel. Print them on receipts, tables, or signage.",
  },
  {
    icon: Sparkles,
    title: "AI Review Writer",
    desc: "Customers choose a rating and tags — our AI drafts 3 genuine review suggestions they can post in one tap.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Track scans, reviews generated, copies, and Google clicks. Know exactly what's working.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
              <Star className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">ReviewBoost</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button variant="hero" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              AI-Powered Review Collection
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tight text-foreground leading-[1.1] mb-6">
              Turn happy customers into{" "}
              <span className="text-gradient-hero">5-star reviews</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              QR codes + AI-generated review suggestions = more Google reviews for your
              local business. Set up in 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button variant="hero" size="xl">
                  Start Free <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/r/demo">
                <Button variant="outline" size="lg">
                  Try Demo Funnel
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-secondary/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Everything you need to boost reviews
            </h2>
            <p className="text-muted-foreground text-lg">Powerful features designed to help local businesses collect more reviews and<br />build a stronger online reputation.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-card rounded-2xl p-8 shadow-card border border-border hover:shadow-elevated transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-xl text-card-foreground mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center text-foreground mb-16">
            How it works
          </h2>
          {[
            { step: "1", title: "Create your business profile", desc: "Add your business name, category, and Google review link." },
            { step: "2", title: "Share your QR code", desc: "Print it on receipts, table tents, or your storefront." },
            { step: "3", title: "Customers review in seconds", desc: "They rate, pick tags, and our AI writes the review for them." },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="flex gap-6 mb-10"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-heading font-bold text-lg">
                {item.step}
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-1">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-secondary/50" id="pricing">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground text-lg">Start free. Upgrade when you're ready.</p>
          </div>
          <PricingCards />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-hero flex items-center justify-center">
              <Star className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-heading font-semibold text-foreground">ReviewBoost</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 M&M Fintech. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
