import { createMetadata } from "@/lib/metadata";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, MessageSquare, Clock } from "lucide-react";
import { Metadata } from "next";

export const metadata:Metadata = createMetadata({
    title: "Contact Us",
    description: "Get in touch with Consensus. Emails, support addresses, and office location.",
});

export default function ContactPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Header */}
            <section className="py-20 lg:py-24 relative overflow-hidden bg-muted/20 border-b border-border/40">
                <div className="container mx-auto px-4 text-center max-w-4xl space-y-6">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Get in Touch
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        We’d love to hear from you. <br />
                        Whether you have a question, feedback, partnership inquiry, or need support, feel free to reach out.
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">

                        {/* Contact Info */}
                        <div className="space-y-12">
                            <div className="space-y-8">
                                {/* Email Contacts */}
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-primary/10 rounded-lg text-primary shrink-0">
                                        <Mail className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-4 w-full">
                                        <h3 className="font-bold text-xl">Contact Information</h3>
                                        <div className="space-y-3">
                                            <div className="p-4 rounded-xl bg-card border border-border/50">
                                                <p className="text-sm text-muted-foreground mb-1">General Support</p>
                                                <a href="mailto:support@consensus.com" className="font-medium hover:text-primary transition-colors block">support@consensus.com</a>
                                            </div>
                                            <div className="p-4 rounded-xl bg-card border border-border/50">
                                                <p className="text-sm text-muted-foreground mb-1">Partnerships & Collaborations</p>
                                                <a href="mailto:partnerships@consensus.com" className="font-medium hover:text-primary transition-colors block">partnerships@consensus.com</a>
                                            </div>
                                            <div className="p-4 rounded-xl bg-card border border-border/50">
                                                <p className="text-sm text-muted-foreground mb-1">Legal or Compliance</p>
                                                <a href="mailto:legal@consensus.com" className="font-medium hover:text-primary transition-colors block">legal@consensus.com</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Office Address */}
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-primary/10 rounded-lg text-primary shrink-0">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl mb-2">Office Address</h3>
                                        <p className="text-muted-foreground">
                                          
                                            Mumbai, Maharashtra, India
                                        </p>
                                    </div>
                                </div>

                                {/* Support Info */}
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-primary/10 rounded-lg text-primary shrink-0">
                                        <Clock className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl mb-2">Support</h3>
                                        <p className="text-muted-foreground mb-4">
                                            For account-related issues, payments, or platform support:
                                        </p>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm mb-4">
                                            <li>Please email us with your registered email ID</li>
                                            <li>Include relevant details or screenshots for faster resolution</li>
                                        </ul>
                                        <p className="font-medium text-foreground">
                                            We aim to respond within 24–48 business hours.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feedback / Contact Form */}
                        <div className="space-y-6">
                            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm h-fit">
                                <div className="mb-6 space-y-2">
                                    <div className="flex items-center gap-2 text-primary font-medium mb-2">
                                        <MessageSquare className="w-5 h-5" />
                                        <span>Feedback & Suggestions</span>
                                    </div>
                                    <h3 className="text-2xl font-bold">We’re building this platform with the community.</h3>
                                    <p className="text-muted-foreground">If you have ideas, feature requests, or improvements, we’d genuinely love to hear them.</p>
                                </div>

                                <form className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="name" className="text-sm font-medium">Name</label>
                                            <Input id="name" placeholder="Your name" />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="email" className="text-sm font-medium">Email</label>
                                            <Input id="email" type="email" placeholder="you@example.com" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                                        <Input id="subject" placeholder="Feedback / Inquiry" />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="message" className="text-sm font-medium">Message</label>
                                        <Textarea
                                            id="message"
                                            placeholder="Tell us your thoughts..."
                                            className="min-h-[150px] resize-none"
                                        />
                                    </div>

                                    <Button size="lg" className="w-full font-semibold">
                                        Send Message
                                    </Button>
                                </form>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
}
