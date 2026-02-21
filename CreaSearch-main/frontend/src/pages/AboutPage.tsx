import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 py-16 md:py-24">
                <div className="max-w-4xl mx-auto px-4 md:px-8">
                    <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">
                        About Creasearch
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8">
                        Pakistan's leading creator collaboration marketplace.
                    </p>

                    <div className="space-y-8">
                        <section>
                            <h2 className="font-heading text-2xl font-semibold mb-4">Our Mission</h2>
                            <p className="text-muted-foreground">
                                Creasearch was founded with a simple mission: to connect Pakistan's incredible creator talent with organizations looking for authentic collaboration. We believe that the best content comes from genuine partnerships.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-heading text-2xl font-semibold mb-4">What We Do</h2>
                            <p className="text-muted-foreground">
                                We provide a verified marketplace where content creators, speakers, trainers, and influencers can showcase their work and connect with brands, agencies, and organizations for video content, podcasts, events, and training opportunities.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-heading text-2xl font-semibold mb-4">Our Values</h2>
                            <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                <li><strong>Trust</strong> - Every creator is verified for authenticity</li>
                                <li><strong>Quality</strong> - We prioritize meaningful collaborations</li>
                                <li><strong>Transparency</strong> - Clear communication and fair pricing</li>
                                <li><strong>Growth</strong> - Supporting Pakistan's creator economy</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="font-heading text-2xl font-semibold mb-4">Contact Us</h2>
                            <p className="text-muted-foreground">
                                Have questions? Reach out at <a href="mailto:hello@creasearch.com" className="text-primary hover:underline">hello@creasearch.com</a>
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
