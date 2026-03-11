import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, Zap, Film, Music, Upload, BarChart3 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span className="text-xl font-bold text-white">Faceless POV AI</span>
          </div>
          <a href={getLoginUrl()}>
            <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
              Sign In
            </Button>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-block mb-4 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
            <span className="text-sm font-semibold text-amber-400">✨ AI-Powered Video Generation</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Create Stunning Videos
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              in Minutes
            </span>
          </h1>

          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Transform your ideas into professional AI-generated videos. From script to YouTube upload, 
            all automated with cutting-edge AI technology.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a href={getLoginUrl()}>
              <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 gap-2">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <Button size="lg" variant="outline" className="border-slate-700 hover:bg-slate-800 text-white">
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-sm">
            <div>
              <div className="text-2xl font-bold text-amber-400">100%</div>
              <div className="text-slate-400">Automated</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400">&lt;5min</div>
              <div className="text-slate-400">Per Video</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400">4K</div>
              <div className="text-slate-400">Quality</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
          <p className="text-lg text-slate-400">Everything you need to create viral videos</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Film,
              title: "AI Script Generation",
              description: "Automatic script creation from your topic using advanced AI",
            },
            {
              icon: Sparkles,
              title: "Image Generation",
              description: "Create stunning visuals with Flux and Qwen AI models",
            },
            {
              icon: Zap,
              title: "Video Creation",
              description: "Convert images to dynamic videos with Veo3 and Kling",
            },
            {
              icon: Music,
              title: "Voice Generation",
              description: "Natural-sounding narration with 8 voice options",
            },
            {
              icon: Upload,
              title: "Auto YouTube Upload",
              description: "Automatically publish to YouTube with optimized metadata",
            },
            {
              icon: BarChart3,
              title: "Progress Tracking",
              description: "Real-time monitoring of your video generation pipeline",
            },
          ].map((feature, idx) => (
            <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-amber-400" />
                </div>
                <CardTitle className="text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Workflow Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Simple Workflow</h2>
          <p className="text-lg text-slate-400">Just 3 steps to create your first video</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-6">
            {[
              {
                step: 1,
                title: "Enter Your Topic",
                description: "Tell us what your video should be about",
              },
              {
                step: 2,
                title: "Configure Settings",
                description: "Choose voice, style, duration, and other preferences",
              },
              {
                step: 3,
                title: "Generate & Upload",
                description: "Our AI creates and uploads your video to YouTube automatically",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                    {item.step}
                  </div>
                  {item.step < 3 && <div className="w-1 h-12 bg-gradient-to-b from-amber-500 to-transparent mt-2" />}
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Create?</h2>
          <p className="text-lg text-slate-300 mb-8">
            Start creating stunning AI videos today. No credit card required.
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
              Start Free Trial
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-slate-400">Faceless POV AI Machine</span>
            </div>
            <div className="text-sm text-slate-500">
              © 2026 All rights reserved
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
