import './globals.css';
// eslint-disable-next-line no-unused-vars
import Navbar from '../components/Navbar';
// eslint-disable-next-line no-unused-vars
import Footer from '../components/Footer'; // Importar o componente Footer
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'EbookStark',
  description: 'Crie seus ebooks facilmente',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${inter.variable}`}>
      <body className="font-inter flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
