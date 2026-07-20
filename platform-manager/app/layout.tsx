import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Sidebar } from "./sidebar";
import { ToastProvider } from "./components/toast";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Gestor de plataformas Moodle",
  description: "Panel externo para gestionar cursos y usuarios de una plataforma Moodle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full bg-brand-blue-50 dark:bg-brand-blue-999">
        <ToastProvider>
          <div className="flex min-h-screen flex-col md:flex-row">
            <Sidebar />
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
