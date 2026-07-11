"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Mail, User, Send, CheckCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Message sent successfully! Shrikant will get back to you shortly.");
      setName("");
      setEmail("");
      setMessage("");
      setSubmitting(false);
    }, 1200);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 text-slate-100 pb-24">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Phone className="h-8 w-8 text-blue-400" /> Contact Us
          </h1>
          <p className="mt-1.5 text-sm text-slate-300 font-light max-w-2xl leading-relaxed">
            Get in touch with us for inquiries, feature requests, or developer support.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-5 items-start">
          {/* Contact Details Card (Col 2) */}
          <div className="md:col-span-2 space-y-4">
            <Card className="border-white/5 bg-slate-900/40 backdrop-blur-md glass-card py-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-white">Direct Connect</CardTitle>
                <CardDescription className="text-slate-300 text-xs font-light">
                  Get in touch with the lead developer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Representative</p>
                    <p className="font-semibold text-white mt-0.5 text-sm">Shrikant Kalase</p>
                  </div>
                </div>

                <a 
                  href="mailto:shrikalase@gmail.com" 
                  className="flex items-center gap-3 border-b border-white/5 pb-3 hover:bg-white/5 rounded-lg p-1.5 -m-1.5 transition-all duration-200"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</p>
                    <p className="font-semibold text-white mt-0.5 text-sm hover:underline">shrikalase@gmail.com</p>
                  </div>
                </a>

                <a 
                  href="tel:+91-9096180081" 
                  className="flex items-center gap-3 hover:bg-white/5 rounded-lg p-1.5 -m-1.5 transition-all duration-200"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Phone className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Phone Hotline</p>
                    <p className="font-semibold text-white mt-0.5 text-sm hover:underline">+91 90961 80081</p>
                  </div>
                </a>
              </CardContent>
            </Card>

            <div className="rounded-xl border border-white/5 bg-slate-950/40 p-4 text-xs text-slate-400 font-light space-y-2 leading-relaxed glass-card">
              <p>
                <strong>Availability:</strong> Monday to Friday (9 AM - 6 PM IST). 
              </p>
              <p>
                We usually respond to all engineering query emails within 24 hours.
              </p>
            </div>
          </div>

          {/* Contact Form Card (Col 3) */}
          <div className="md:col-span-3">
            <Card className="border-white/5 bg-slate-900/40 backdrop-blur-md glass-card py-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-400" /> Send a Message
                </CardTitle>
                <CardDescription className="text-slate-300 text-xs font-light">
                  Have a suggestion or request? Write directly to Shrikant.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs text-slate-300">Your Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-slate-950/60 border-white/10 text-sm h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs text-slate-300">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-950/60 border-white/10 text-sm h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-xs text-slate-300">Message Details</Label>
                    <textarea
                      id="message"
                      rows={4}
                      placeholder="Hi Shrikant, I love the cockpit theme..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-md bg-slate-950/60 border border-white/10 p-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs h-10 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 border border-white/10"
                  >
                    {submitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
