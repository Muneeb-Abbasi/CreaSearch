import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function SuccessStoriesPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 py-16 md:py-24">
                <div className="max-w-4xl mx-auto px-4 md:px-8">
                    <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">
                        Success Stories
                    </h1>
                    <p className="text-lg text-muted-foreground mb-12">
                        See how creators and organizations have collaborated successfully through Creasearch.
                    </p>

                    <div className="space-y-12">
                        <div className="border rounded-lg p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    AK
                                </div>
                                <div>
                                    <h3 className="font-semibold">Ayesha Khan</h3>
                                    <p className="text-sm text-muted-foreground">Tech Content Creator</p>
                                </div>
                            </div>
                            <p className="text-muted-foreground">
                                "Creasearch helped me connect with 5 major brands in my first month. The platform made it easy for organizations to find me based on my niche and audience."
                            </p>
                        </div>

                        <div className="border rounded-lg p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    TC
                                </div>
                                <div>
                                    <h3 className="font-semibold">TechCorp Pakistan</h3>
                                    <p className="text-sm text-muted-foreground">Technology Company</p>
                                </div>
                            </div>
                            <p className="text-muted-foreground">
                                "We found the perfect creator for our product launch within days. The verification system gave us confidence in the creators we worked with."
                            </p>
                        </div>

                        <div className="border rounded-lg p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    BH
                                </div>
                                <div>
                                    <h3 className="font-semibold">Bilal Hassan</h3>
                                    <p className="text-sm text-muted-foreground">Corporate Trainer</p>
                                </div>
                            </div>
                            <p className="text-muted-foreground">
                                "As a trainer, I was struggling to find corporate clients. Creasearch's platform connected me with organizations looking for exactly my expertise."
                            </p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
