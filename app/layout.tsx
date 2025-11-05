import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/sonner"
import { StoreInitializer } from "@/components/store-initializer"
import { AuthInitializer } from "@/components/auth-initializer"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/header"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Billares Chapinlandia - Sistema de Gestión",
  description: "Sistema de gestión para Billares Chapinlandia",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">
        <StoreInitializer />
        <AuthInitializer />
        <AuthGuard>
          <Header />
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </AuthGuard>
        <Toaster />
      </body>
    </html>
  )
}
