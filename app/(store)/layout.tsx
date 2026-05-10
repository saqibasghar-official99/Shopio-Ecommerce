import { CartProvider } from '@/contexts/CartContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ToastProvider } from '@/contexts/ToastContext';
import AnnouncementBar from '@/components/store/AnnouncementBar';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import WhatsAppButton from '@/components/store/WhatsAppButton';
import BottomNav from '@/components/store/BottomNav';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <CartProvider>
        <ToastProvider>
          <div className="flex flex-col min-h-screen">
            <AnnouncementBar />
            <Navbar />
            <main className="flex-1 min-h-screen pb-20 md:pb-0">
              {children}
            </main>
            <Footer />
            <WhatsAppButton />
            <BottomNav />
          </div>
        </ToastProvider>
      </CartProvider>
    </SettingsProvider>
  );
}
