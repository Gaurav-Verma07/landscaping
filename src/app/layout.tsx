import type { Metadata } from "next";
import { Poppins, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LandingThemeEnforcer } from "@/components/landing/theme-enforcer";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://landscaping.pro"),
  title: {
    default: "Landscaping",
    template: "%s | Landscaping",
  },
  description: "Landscaping management software.",
  icons: {
    icon: "/landscraping_logo.png",
    apple: "/landscraping_logo.png",
  },
  openGraph: {
    type: "website",
    url: "https://landscaping.pro",
    title: "Landscaping",
    description: "Landscaping management software.",
    images: [
      {
        url: "/landscraping_logo.png",
        width: 512,
        height: 512,
        alt: "Landscaping logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Landscaping",
    description: "Landscaping management software.",
    images: ["/landscraping_logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${robotoMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LandingThemeEnforcer />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
