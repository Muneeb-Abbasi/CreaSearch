import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 py-16 md:py-24">
                <div className="max-w-4xl mx-auto px-4 md:px-8">
                    <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">
                        Privacy Policy
                    </h1>
                    <p className="text-sm text-muted-foreground mb-8">
                        Last updated: January 2026
                    </p>

                    <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
                        <section>
                            <h2 className="font-heading text-2xl font-semibold mb-4">1. Information We Collect</h2>
                            <p className="text-muted-foreground">
                                We collect information you provide directly to us, such as when you create an account, fill out your profile, or contact us. This may include your name, email address, profile photo, social media links, and professional information.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-heading text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
                            <p className="text-muted-foreground">
                                We use the information we collect to provide, maintain, and improve our services, process transactions, send notifications, and communicate with you about products, services, and events.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-heading text-2xl font-semibold mb-4">3. Information Sharing</h2>
                            <p className="text-muted-foreground">
                                We do not sell your personal information. We may share information with third-party service providers who perform services on our behalf, or when required by law.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-heading text-2xl font-semibold mb-4">4. Data Security</h2>
                            <p className="text-muted-foreground">
                                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-heading text-2xl font-semibold mb-4">5. Your Rights</h2>
                            <p className="text-muted-foreground">
                                You have the right to access, correct, or delete your personal information. You can also object to processing or request data portability. Contact us to exercise these rights.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-heading text-2xl font-semibold mb-4">6. Contact Us</h2>
                            <p className="text-muted-foreground">
                                If you have questions about this Privacy Policy, please contact us at privacy@creasearch.com.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
