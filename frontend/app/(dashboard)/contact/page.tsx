"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Phone, User, Send, CheckCircle, MessageSquare } from "lucide-react";
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
    <div className="p-4 sm:p-6 lg:p-8 text-zinc-100 font-sans select-none">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Mail className="h-6 w-6 stroke-[1.8]" />
            </div>
            <span>Contact & Inquiries</span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Get in touch for institutional access, feature proposals, or engineering support.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-5 items-start">
          {/* Contact Details Card */}
          <div className="md:col-span-2 space-y-4">
            <Card className="border-white/[0.08] bg-zinc-900/60 backdrop-blur-xl rounded-2xl shadow-xl">
              <CardHeader className="p-5 pb-3 border-b border-white/[0.06]">
                <CardTitle className="text-sm font-semibold text-white">Direct Channels</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Connect with the engineering lead
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-800 border border-white/[0.06] text-zinc-300">
                    <User className="h-4.5 w-4.5 stroke-[1.8]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Representative</p>
                    <p className="font-semibold text-white text-xs sm:text-sm mt-0.5">Shrikant Kalase</p>
                  </div>
                </div>

                <a 
                  href="mailto:shrikalase@gmail.com" 
                  className="flex items-center gap-3 border-b border-white/[0.06] pb-3.5 hover:bg-white/[0.03] rounded-xl p-2 -mx-2 transition-all duration-150 active:scale-[0.98]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Mail className="h-4.5 w-4.5 stroke-[1.8]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Email Address</p>
                    <p className="font-semibold text-white text-xs sm:text-sm hover:underline truncate mt-0.5">shrikalase@gmail.com</p>
                  </div>
                </a>

                <a 
                  href="tel:+91-9096180081" 
                  className="flex items-center gap-3 hover:bg-white/[0.03] rounded-xl p-2 -mx-2 transition-all duration-150 active:scale-[0.98]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Phone className="h-4.5 w-4.5 stroke-[1.8]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Telephone</p>
                    <p className="font-semibold text-white text-xs sm:text-sm hover:underline mt-0.5 font-mono">+91 90961 80081</p>
                  </div>
                </a>
              </CardContent>
            </Card>

            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/60 backdrop-blur-xl p-4 text-xs text-zinc-400 space-y-1.5 leading-relaxed shadow-xl">
              <p className="font-semibold text-zinc-300">Desk Hours</p>
              <p>Monday to Friday, 9:00 AM – 6:00 PM IST.</p>
              <p className="text-[11px] text-zinc-500">Inquiries typically resolved within 24 business hours.</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="md:col-span-3">
            <Card className="border-white/[0.08] bg-zinc-900/60 backdrop-blur-xl rounded-2xl shadow-xl">
              <CardHeader className="p-5 pb-3 border-b border-white/[0.06]">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-400 stroke-[1.8]" />
                  <span>Transmit Inquiry</span>
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Fill out the parameters below to establish communications
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Anand Sharma"
                      className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/80 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="anand@example.com"
                      className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/80 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Message Content</label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Detail your inquiry, feedback, or integration requirement..."
                      className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/80 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs sm:text-sm px-4 py-2.5 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    {submitting ? (
                      <div className="h-4 w-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 stroke-[2]" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
