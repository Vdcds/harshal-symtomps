import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              Welcome to{" "}
              <span className="text-primary">harshal-symtomps</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              A modern Next.js application built with TypeScript, Tailwind CSS,
              
              and postgres database.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card>
              <CardHeader>
                <CardTitle>🚀 Fast Development</CardTitle>
                <CardDescription>
                  Built with modern tools for rapid prototyping and development
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🎨 Beautiful UI</CardTitle>
                <CardDescription>
                  Styled with Tailwind CSS and shadcn/ui components
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📱 Responsive</CardTitle>
                <CardDescription>
                  Mobile-first design that works on all devices
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
