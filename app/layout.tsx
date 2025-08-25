import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kalkulator pada prometa i PDV naplate',
  description: 'Profesionalni kalkulator za poređenje naplate PDV-a pri promjeni stope sa 7% na 15%, uz zadati pad prometa i inflaciju. Posebno dizajniran za turizam i ugostiteljstvo.',
  keywords: 'PDV kalkulator, VAT calculator, turizam, ugostiteljstvo, porez, Srbija',
  authors: [{ name: 'VAT Calculator App' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr">
      <body className={inter.className}>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}