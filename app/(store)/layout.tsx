import { CartProvider } from '@/contexts/CartContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ToastProvider } from '@/contexts/ToastContext';
import AnnouncementBar from '@/components/store/AnnouncementBar';
import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';
import WhatsAppButton from '@/components/store/WhatsAppButton';
import BottomNav from '@/components/store/BottomNav';
import { getSettings } from '@/lib/server/queries';
import type { SiteSettings } from '@/lib/types';

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pre-fetch settings on the server so navbar/footer/announcement bar render
  // with real data on first paint. cached() de-dupes if the page also calls it.
  const initialSettings = (await getSettings()) as unknown as SiteSettings | null;

  return (
    <SettingsProvider initial={initialSettings}>
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
