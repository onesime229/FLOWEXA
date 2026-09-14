import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Bed,
  Check,
  Building2,
  Sparkles,
} from 'lucide-react';
import { ClientEstablishment } from './clientData';

interface ClientBookingViewProps {
  establishment: ClientEstablishment;
  serviceTitle?: string;
  priceAmount?: number;
  onBack: () => void;
  onCompleteBooking: (bookingDetails: any) => void;
}

export const ClientBookingView: React.FC<ClientBookingViewProps> = ({
  establishment,
  serviceTitle = 'Chambre standard',
  priceAmount = establishment.priceStartingAt,
  onBack,
  onCompleteBooking,
}) => {
  const [step, setStep] = useState<'FORM' | 'CONFIRMED'>('FORM');
  const [selectedDay, setSelectedDay] = useState('Sam 13');
  const [selectedTime, setSelectedTime] = useState('18:00');
  const [peopleCount, setPeopleCount] = useState(2);
  const [clientNotes, setClientNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const DAYS = [
    { code: 'Ven 12', day: 'Ven', num: '12' },
    { code: 'Sam 13', day: 'Sam', num: '13' },
    { code: 'Dim 14', day: 'Dim', num: '14' },
    { code: 'Lun 15', day: 'Lun', num: '15' },
    { code: 'Mar 16', day: 'Mar', num: '16' },
  ];

  const TIMES = [
    { time: '10:00', available: true },
    { time: '12:00', available: true },
    { time: '14:00', available: true },
    { time: '16:00', available: false },
    { time: '18:00', available: true },
    { time: '19:00', available: true },
    { time: '20:00', available: true },
    { time: '21:00', available: false },
  ];

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const details = {
      establishmentId: establishment.id,
      establishmentName: establishment.name,
      serviceTitle,
      price: priceAmount,
      day: selectedDay,
      time: selectedTime,
      people: peopleCount,
      notes: clientNotes,
      status: 'PENDING',
      timestamp: new Date().toISOString(),
    };

    // Simulated short round-trip to feel natural
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('CONFIRMED');
      onCompleteBooking(details);
    }, 600);
  };

  if (step === 'CONFIRMED') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4FDF8] to-[#E2FBEF] text-[#111827] flex flex-col justify-between p-6 animate-fade-in">
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
          {/* Big Green Badge */}
          <div className="w-24 h-24 rounded-full bg-[#10D97F] text-white flex items-center justify-center shadow-xl shadow-[#10D97F]/30 mb-6 fxa-pop">
            <Check className="w-12 h-12 stroke-[3]" />
          </div>

          <h1 className="text-2xl font-black text-[#111827] font-disp mb-2">
            Réservation envoyée !
          </h1>
          <p className="text-sm font-semibold text-[#0A9159] leading-relaxed mb-6">
            {establishment.name} a bien reçu votre demande et vous confirmera dans les plus brefs délais.
          </p>

          <div className="w-full bg-white p-5 rounded-2xl shadow-sm border border-[#E8EDF3] text-left text-xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8EDF3]">
              <span className="text-[#5C6B80]">Établissement</span>
              <span className="font-extrabold text-[#111827]">{establishment.name}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E8EDF3]">
              <span className="text-[#5C6B80]">Prestation</span>
              <span className="font-extrabold text-[#111827]">{serviceTitle}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E8EDF3]">
              <span className="text-[#5C6B80]">Date & Créneau</span>
              <span className="font-extrabold text-[#111827]">
                {selectedDay} à {selectedTime}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E8EDF3]">
              <span className="text-[#5C6B80]">Personnes</span>
              <span className="font-extrabold text-[#111827]">{peopleCount}</span>
            </div>
            <div className="flex items-center justify-between pt-1 font-black text-sm">
              <span className="text-[#111827]">Total indicatif</span>
              <span className="text-[#FB8205]">{priceAmount.toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm mx-auto space-y-2 pt-6">
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] pb-28">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E8EDF3] px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Retour"
          className="w-9 h-9 rounded-full bg-[#F8FAFC] border border-[#E8EDF3] flex items-center justify-center text-[#111827] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-black text-base text-[#111827]">Réserver</h1>
          <div className="text-xs text-[#5C6B80] font-semibold">
            {establishment.name} · {serviceTitle}
          </div>
        </div>
      </div>

      {/* 3 Step Indicator */}
      <div className="flex gap-2 px-5 py-3">
        <span className="flex-1 h-1.5 rounded-full bg-[#0794A0]" />
        <span className="flex-1 h-1.5 rounded-full bg-[#0794A0]" />
        <span className="flex-1 h-1.5 rounded-full bg-[#0794A0]" />
      </div>

      <div className="p-5 max-w-lg mx-auto space-y-6">
        {/* 1. Day Picker */}
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#5C6B80] mb-3">
            1. Choisissez le jour
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {DAYS.map((d) => {
              const isSel = selectedDay === d.code;
              return (
                <button
                  key={d.code}
                  type="button"
                  onClick={() => setSelectedDay(d.code)}
                  className={`py-3 px-2 rounded-2xl text-center font-extrabold transition-all cursor-pointer ${
                    isSel
                      ? 'bg-[#FB8205] text-white shadow-md scale-102'
                      : 'bg-white border border-[#E8EDF3] text-[#111827] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span className={`block text-[11px] font-bold ${isSel ? 'text-[#FFE0BC]' : 'text-[#97A3B4]'}`}>
                    {d.day}
                  </span>
                  <span className="text-lg">{d.num}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Time Slot Picker */}
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#5C6B80] mb-3">
            2. Choisissez l’heure
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {TIMES.map((t) => {
              const isSel = selectedTime === t.time;
              if (!t.available) {
                return (
                  <button
                    key={t.time}
                    disabled
                    className="py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E8EDF3] text-xs font-bold text-[#C3CCD9] line-through cursor-not-allowed text-center"
                  >
                    {t.time}
                  </button>
                );
              }
              return (
                <button
                  key={t.time}
                  type="button"
                  onClick={() => setSelectedTime(t.time)}
                  className={`py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    isSel
                      ? 'bg-[#FB8205] text-white shadow-md'
                      : 'bg-white border border-[#E8EDF3] text-[#111827] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {t.time}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. People Counter */}
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#5C6B80] mb-3">
            3. Nombre de personnes
          </h2>
          <div className="bg-white p-4 rounded-2xl border border-[#E8EDF3] shadow-xs flex items-center justify-between">
            <span className="text-sm font-bold text-[#111827]">Participants / invités</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPeopleCount((p) => Math.max(1, p - 1))}
                className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E8EDF3] text-lg font-black text-[#E06900] active:scale-90 transition-transform cursor-pointer"
              >
                −
              </button>
              <span className="text-lg font-black text-[#111827] min-w-[20px] text-center">
                {peopleCount}
              </span>
              <button
                type="button"
                onClick={() => setPeopleCount((p) => Math.min(10, p + 1))}
                className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E8EDF3] text-lg font-black text-[#E06900] active:scale-90 transition-transform cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* 4. Notes & Summary */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF3] shadow-xs space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#5C6B80]">
            Récapitulatif de la réservation
          </h3>
          <div className="text-xs divide-y divide-[#E8EDF3] space-y-2">
            <div className="flex items-center justify-between pt-1">
              <span className="text-[#5C6B80]">Prestation</span>
              <span className="font-bold text-[#111827]">{serviceTitle}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[#5C6B80]">Date & Heure</span>
              <span className="font-bold text-[#111827]">
                {selectedDay} à {selectedTime}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[#5C6B80]">Personnes</span>
              <span className="font-bold text-[#111827]">{peopleCount}</span>
            </div>
            <div className="flex items-center justify-between pt-2 text-sm font-black">
              <span className="text-[#111827]">Total</span>
              <span className="text-[#FB8205]">{priceAmount.toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E8EDF3] p-4 max-w-lg mx-auto flex items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="text-lg font-black text-[#111827]">
            {priceAmount.toLocaleString()} FCFA
          </div>
          <div className="text-[11px] text-[#5C6B80] font-bold">
            {selectedDay} · {selectedTime}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="flex-1 py-3.5 px-6 rounded-2xl bg-[#FB8205] text-white font-extrabold text-sm shadow-md hover:brightness-95 active:scale-98 transition-all text-center cursor-pointer disabled:opacity-75"
        >
          {isSubmitting ? 'Envoi en cours…' : 'Confirmer la réservation'}
        </button>
      </div>
    </div>
  );
};
