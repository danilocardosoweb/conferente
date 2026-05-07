import React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conferente – Contador de Perfis de Alumínio",
  description:
    "Sistema de visão computacional para contagem automática de perfis de alumínio em pallets",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-surface-900 text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
