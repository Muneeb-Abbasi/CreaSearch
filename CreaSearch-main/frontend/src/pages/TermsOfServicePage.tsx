import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 py-16 md:py-24">
                <div className="max-w-4xl mx-auto px-4 md:px-8">
                    <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">
                        Terms of Service
                    </h1>
                    <p className="text-sm text-muted-foreground mb-8">
                        Last updated: January 2026
                    </p>

                    <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
                        <section>
                            <h2 className="font-heading text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                            <p className="text-muted-foreground">
                                By accessing and using Creasearch, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-heading text-2xl font-semibold mb-4">2. Use of Service</h2>
                            <p className="text-muted-foreground">
                                Creasearch provides a platform for creators and organizations to connect for collaboration opportunities. You agree to use the service only for lawful purposes and in accordance with these Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-heading text-2xl font-semibold mb-4">3. User Accounts</h2>
                            <p className="text-muted-foreground">
                                You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information and keep it updated. You are responsible for all activities under your account.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-heading text-2xl font-semibold mb-4">4. Creator Profiles</h2>
                            <p className="text-muted-foreground">
                                Creators must provide accurate information about their work, experience, and social media metrics. Misrepresentation may result in account suspension or termination.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-heading text-2xl font-semibold mb-4">5. Intellectual Property</h2>
                            <p className="text-muted-foreground">
                                The platform and its content are owned by Creasearch. Users retain ownership of content they upload but grant Creasearch a license to display it on the platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-heading text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
                            <p className="text-muted-foreground">
                                Creasearch is not responsible for disputes between creators and organizations. We provide the platform for connection but are not a party to any agreements made between users.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-heading text-2xl font-semibold mb-4">7. Termination</h2>
                            <p className="text-muted-foreground">
                                We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent or harmful behavior.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-heading text-2xl font-semibold mb-4">8. Contact</h2>
                            <p className="text-muted-foreground">
                                For questions about these Terms, contact us at legal@creasearch.com.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
