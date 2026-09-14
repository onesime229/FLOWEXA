import React, { useState } from 'react';
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  CreditCard,
  Phone,
  CheckCircle2,
  Check,
  Package,
} from 'lucide-react';

interface CartItem {
  id: string;
  title: string;
  businessName: string;
  price: number;
  qty: number;
  imageUrl: string;
}

interface ClientMarketplaceViewProps {
  onBack: () => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ClientMarketplaceView: React.FC<ClientMarketplaceViewProps> = ({
  onBack,
  onShowToast,
}) => {
  const [screen, setScreen] = useState<'CART' | 'CHECKOUT' | 'SUCCESS'>('CART');
  const [paymentMethod, setPaymentMethod] = useState<'MTN' | 'MOOV' | 'FEDAPAY' | 'CARD'>('MTN');

  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 'prod-1',
      title: 'Tissu wax véritable — Kalia Créations',
      businessName: 'Kpalimé Style',
      price: 8500,
      qty: 1,
      imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=200&q=80',
    },
    {
      id: 'prod-2',
      title: 'Sac tissé artisanal fait main',
      businessName: 'Kpalimé Style',
      price: 12000,
      qty: 1,
      imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&q=80',
    },
  ]);

  const deliveryFee = 1000;
  const itemsSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalAmount = itemsSubtotal + (cartItems.length > 0 ? deliveryFee : 0);

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it))
        .filter((it) => it.qty > 0)
    );
  };

  const handlePay = () => {
    onShowToast('Paiement validé', `Commande réglée via ${paymentMethod}`, 'success');
    setScreen('SUCCESS');
  };

  if (screen === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4FDF8] to-[#E2FBEF] text-[#111827] flex flex-col justify-between p-6 animate-fade-in">
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
          <div className="w-24 h-24 rounded-full bg-[#10D97F] text-white flex items-center justify-center shadow-xl shadow-[#10D97F]/30 mb-6 fxa-pop">
            <Check className="w-12 h-12 stroke-[3]" />
          </div>

          <h1 className="text-2xl font-black text-[#111827] font-disp mb-2">
            Commande confirmée !
          </h1>
          <p className="text-sm font-semibold text-[#0A9159] leading-relaxed mb-6">
            Le vendeur prépare votre commande. Vous serez notifié à chaque étape d'acheminement.
          </p>

          <div className="w-full bg-white p-5 rounded-2xl shadow-sm border border-[#E8EDF3] text-left text-xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8EDF3]">
              <span className="text-[#5C6B80]">Vendeur</span>
              <span className="font-extrabold text-[#111827]">Kpalimé Style</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E8EDF3]">
              <span className="text-[#5C6B80]">Moyen de paiement</span>
              <span className="font-bold text-[#0A9159]">
                {paymentMethod === 'MTN'
                  ? 'MTN Mobile Money'
                  : paymentMethod === 'MOOV'
                  ? 'Moov Money'
                  : paymentMethod === 'FEDAPAY'
                  ? 'FedaPay'
                  : 'Carte bancaire'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 font-black text-sm">
              <span className="text-[#111827]">Total payé</span>
              <span className="text-[#FB8205]">{totalAmount.toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm mx-auto pt-6">
          <button
            onClick={onBack}
            className="w-full py-3.5 rounded-2xl bg-[#FB8205] text-white font-extrabold text-sm shadow-md hover:brightness-95 cursor-pointer"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'CHECKOUT') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#111827] pb-28">
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8EDF3] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setScreen('CART')}
            aria-label="Retour"
            className="w-9 h-9 rounded-full bg-[#F8FAFC] border border-[#E8EDF3] flex items-center justify-center text-[#111827] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-black text-base text-[#111827]">Paiement de la commande</h1>
        </div>

        <div className="p-5 max-w-lg mx-auto space-y-5">
          {/* Delivery address */}
          <div className="bg-white p-4 rounded-2xl border border-[#E8EDF3] shadow-xs">
            <div className="text-xs font-extrabold text-[#5C6B80] uppercase tracking-wider mb-2">
              Adresse de livraison
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-[#111827]">Cotonou — Cadjehoun</div>
                <div className="text-xs text-[#5C6B80]">Livraison garantie sous 24h</div>
              </div>
              <span className="text-xs font-bold text-[#FB8205] cursor-pointer">Modifier</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white p-4 rounded-2xl border border-[#E8EDF3] shadow-xs">
            <div className="text-xs font-extrabold text-[#5C6B80] uppercase tracking-wider mb-2">
              Moyen de paiement
            </div>
            <p className="text-[11px] text-[#97A3B4] mb-3">
              Paiement sécurisé crypté de bout en bout via les réseaux béninois.
            </p>

            <div className="space-y-2">
              {[
                { id: 'MTN', label: 'MTN Mobile Money' },
                { id: 'MOOV', label: 'Moov Money' },
                { id: 'FEDAPAY', label: 'FedaPay (Agrégateur Bénin)' },
                { id: 'CARD', label: 'Carte Bancaire (Visa / Mastercard)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    paymentMethod === m.id
                      ? 'border-[#FB8205] bg-[#FFF2E1] text-[#E06900]'
                      : 'border-[#E8EDF3] bg-white text-[#111827] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span>{m.label}</span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      paymentMethod === m.id ? 'border-[#FB8205] bg-[#FB8205]' : 'border-[#C3CCD9]'
                    }`}
                  >
                    {paymentMethod === m.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-white p-4 rounded-2xl border border-[#E8EDF3] shadow-xs space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#5C6B80]">
              <span>Articles ({cartItems.length})</span>
              <span className="font-bold text-[#111827]">{itemsSubtotal.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between text-[#5C6B80]">
              <span>Frais de livraison</span>
              <span className="font-bold text-[#111827]">{deliveryFee.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#E8EDF3] text-sm font-black text-[#111827]">
              <span>Total à régler</span>
              <span className="text-[#FB8205]">{totalAmount.toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>

        {/* Sticky Pay Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E8EDF3] p-4 max-w-lg mx-auto shadow-lg">
          <button
            onClick={handlePay}
            className="w-full py-3.5 rounded-2xl bg-[#FB8205] text-white font-extrabold text-sm sm:text-base shadow-md hover:brightness-95 active:scale-98 transition-all cursor-pointer"
          >
            Payer {totalAmount.toLocaleString()} FCFA
          </button>
        </div>
      </div>
    );
  }

  // CART VIEW
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] pb-28">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8EDF3] px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Retour"
          className="w-9 h-9 rounded-full bg-[#F8FAFC] border border-[#E8EDF3] flex items-center justify-center text-[#111827] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-black text-base text-[#111827]">Panier Marketplace</h1>
      </div>

      <div className="p-5 max-w-lg mx-auto space-y-4">
        {cartItems.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-[#E8EDF3] text-center shadow-xs">
            <ShoppingBag className="w-12 h-12 text-[#C3CCD9] mx-auto mb-3" />
            <div className="font-bold text-sm text-[#111827]">Votre panier est vide</div>
            <p className="text-xs text-[#5C6B80] mt-1">Découvrez les créations et produits béninois.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-[#E8EDF3] p-4 shadow-xs divide-y divide-[#E8EDF3]">
              {cartItems.map((item) => (
                <div key={item.id} className="py-3 flex items-center gap-3">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-14 h-14 rounded-xl object-cover border border-[#E8EDF3] flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-xs text-[#111827] truncate">
                      {item.title}
                    </h3>
                    <div className="text-[11px] text-[#5C6B80]">{item.businessName}</div>
                    <div className="text-xs font-black text-[#FB8205] mt-1">
                      {(item.price * item.qty).toLocaleString()} FCFA
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-[#F8FAFC] border border-[#E8EDF3] flex items-center justify-center font-black text-xs text-[#111827] cursor-pointer"
                    >
                      −
                    </button>
                    <span className="font-bold text-xs min-w-[14px] text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-[#F8FAFC] border border-[#E8EDF3] flex items-center justify-center font-black text-xs text-[#111827] cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Price recap */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8EDF3] shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#5C6B80]">
                <span>Sous-total</span>
                <span className="font-bold text-[#111827]">{itemsSubtotal.toLocaleString()} FCFA</span>
              </div>
              <div className="flex items-center justify-between text-[#5C6B80]">
                <span>Livraison standard (Cotonou)</span>
                <span className="font-bold text-[#111827]">{deliveryFee.toLocaleString()} FCFA</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#E8EDF3] text-sm font-black text-[#111827]">
                <span>Total</span>
                <span className="text-[#FB8205]">{totalAmount.toLocaleString()} FCFA</span>
              </div>
            </div>
          </>
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E8EDF3] p-4 max-w-lg mx-auto shadow-lg">
          <button
            onClick={() => setScreen('CHECKOUT')}
            className="w-full py-3.5 rounded-2xl bg-[#FB8205] text-white font-extrabold text-sm shadow-md hover:brightness-95 active:scale-98 transition-all cursor-pointer"
          >
            Passer la commande ({totalAmount.toLocaleString()} FCFA)
          </button>
        </div>
      )}
    </div>
  );
};
