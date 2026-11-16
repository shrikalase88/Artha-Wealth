"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Phone, User, Send, MessageSquare } from "lucide-react";
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
    <div className="p-4 sm:p-6 lg:p-8 text-foreground font-sans select-none">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Mail className="h-6 w-6 stroke-[1.8]" />
            </div>
            <span>Contact & Inquiries</span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Get in touch for institutional access, feature proposals, or engineering support.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-5 items-start">
          {/* Contact Details Card */}
          <div className="md:col-span-2 space-y-4">
            <Card className="border-border bg-card backdrop-blur-xl rounded-2xl shadow-xs dark:shadow-xl">
              <CardHeader className="p-5 pb-3 border-b border-border/80">
                <CardTitle className="text-sm font-semibold">Direct Channels</CardTitle>
                <CardDescription className="text-xs">
                  Connect with the engineering lead
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3 border-b border-border/80 pb-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted border border-border text-foreground">
                    <User className="h-4.5 w-4.5 stroke-[1.8]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">Founder & Engineer</p>
                    <p className="text-xs font-semibold text-foreground">Shrikant Kalase</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-b border-border/80 pb-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted border border-border text-foreground">
                    <Mail className="h-4.5 w-4.5 stroke-[1.8]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground">Email</p>
                    <a
                      href="mailto:shrikantkalase1998@gmail.com"
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline truncate block"
                    >
                      shrikantkalase1998@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted border border-border text-foreground">
                    <Phone className="h-4.5 w-4.5 stroke-[1.8]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">Mobile Phone</p>
                    <a
                      href="tel:+918237976269"
                      className="text-xs font-mono font-semibold text-foreground hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      +91 8237976269
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-3">
            <Card className="border-border bg-card backdrop-blur-xl rounded-2xl shadow-xs dark:shadow-xl">
              <CardHeader className="p-5 pb-3 border-b border-border/80">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-500 stroke-[1.8]" />
                  <span>Send a Direct Message</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  We typically reply within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Message</label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share your requirements or thoughts..."
                      className="w-full p-3 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{submitting ? "Transmitting..." : "Send Inquiries"}</span>
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
