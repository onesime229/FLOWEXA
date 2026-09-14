import React, { useState } from 'react';
import {
  Home,
  Calendar,
  Bed,
  Users,
  Clock,
  LogIn,
  LogOut,
  CreditCard,
  MessageSquare,
  BarChart3,
  Settings,
  Plus,
  CheckCircle,
  Sparkles,
  Phone,
  UserCheck,
} from 'lucide-react';
import { GuestRoom, GuestBooking } from '../../types';
import { MOCK_GUEST_ROOMS, MOCK_GUEST_BOOKINGS } from '../../data/mockData';
import { Sidebar, SidebarNavItem } from '../design-system/Sidebar';
import { Card, MetricCard } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../design-system/Table';
import { Modal } from '../design-system/Modal';
import { Input, Select } from '../design-system/Input';
import { BarChartWidget } from '../design-system/ChartWidget';
import { BusinessCatalogManager } from './BusinessCatalogManager';

export interface GuestHouseDashboardProps {
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const GuestHouseDashboard: React.FC<GuestHouseDashboardProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<string>('accueil');
  const [rooms, setRooms] = useState<GuestRoom[]>(MOCK_GUEST_ROOMS);
  const [bookings, setBookings] = useState<GuestBooking[]>(MOCK_GUEST_BOOKINGS);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);

  // New booking form states
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('+229 97 00 00 00');
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]?.name || '');
  const [checkInDate, setCheckInDate] = useState('2026-09-05');
  const [checkOutDate, setCheckOutDate] = useState('2026-09-08');

  const navItems: SidebarNavItem[] = [
    { id: 'accueil', label: 'Accueil', icon: <Home className="w-4 h-4" /> },
    { id: 'reservations', label: 'Réservations', icon: <Calendar className="w-4 h-4" />, badge: bookings.length },
    { id: 'chambres', label: 'Chambres', icon: <Bed className="w-4 h-4" />, badge: rooms.length },
    { id: 'clients', label: 'Clients', icon: <Users className="w-4 h-4" /> },
    { id: 'disponibilites', label: 'Disponibilités', icon: <Clock className="w-4 h-4" /> },
    { id: 'checkin', label: 'Check-in', icon: <LogIn className="w-4 h-4 text-[#10D97F]" />, badge: '2' },
    { id: 'checkout', label: 'Check-out', icon: <LogOut className="w-4 h-4 text-[#FB8205]" />, badge: '1' },
    { id: 'paiements', label: 'Paiements', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'statistiques', label: 'Statistiques', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'parametres', label: 'Paramètres', icon: <Settings className="w-4 h-4" /> },
  ];

  const handlePerformCheckIn = (bookingId: string) => {
    setBookings(
      bookings.map((b) => (b.id === bookingId ? { ...b, status: 'Check-in fait' } : b))
    );
    onShowToast('Check-in effectué', 'Clé remise et statut chambre mis à jour.', 'success');
  };

  const handlePerformCheckOut = (bookingId: string) => {
    setBookings(
      bookings.map((b) => (b.id === bookingId ? { ...b, status: 'Check-out fait' } : b))
    );
    onShowToast('Check-out validé', 'La chambre passe en statut « Nettoyage » pour l’équipe.', 'info');
  };

  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const newB: GuestBooking = {
      id: `bk_${Date.now()}`,
      guestName: guestName || 'Nouveau Client',
      guestPhone: guestPhone,
      roomName: selectedRoom,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights: 3,
      totalAmount: 105000,
      status: 'Confirmée',
      paymentStatus: 'Acompte versé',
    };
    setBookings([newB, ...bookings]);
    setIsAddBookingOpen(false);
    onShowToast('Réservation enregistrée', `Séjour planifié pour ${newB.guestName}.`, 'success');
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-4rem)] text-left">
      <Sidebar
        items={navItems}
        activeItemId={activeTab}
        onSelectItem={setActiveTab}
        moduleCode="GUEST_HOUSE"
        moduleTitle="Gestion Guest House"
        businessName="Cocotiers Eco-Lodge"
      />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight capitalize">
              {navItems.find((n) => n.id === activeTab)?.label || 'Guest House'}
            </h1>
            <p className="text-xs text-gray-400">
              Module Métier Hôtelier • Cocotiers Eco-Lodge & Suites
            </p>
          </div>

          <Button
            size="sm"
            variant="cyan"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddBookingOpen(true)}
          >
            Nouvelle réservation
          </Button>
        </div>

        {/* 1. ACCUEIL */}
        {activeTab === 'accueil' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Taux d'occupation"
                value="75%"
                change={+10}
                changeLabel="ce week-end"
                icon={<Bed className="w-5 h-5" />}
                accentColor="#0BE9EF"
              />
              <MetricCard
                title="Arrivées prévues"
                value="2"
                subtitle="Aujourd'hui"
                icon={<LogIn className="w-5 h-5" />}
                accentColor="#10D97F"
              />
              <MetricCard
                title="Départs du jour"
                value="1"
                subtitle="Check-out midi"
                icon={<LogOut className="w-5 h-5" />}
                accentColor="#FB8205"
              />
              <MetricCard
                title="Revenus séjours"
                value="326 000 F"
                subtitle="Semaine en cours"
                icon={<CreditCard className="w-5 h-5" />}
                accentColor="#10D97F"
              />
            </div>

            {/* Room States Live Grid */}
            <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  État des Chambres en Temps Réel
                </h3>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('chambres')}>
                  Gérer les chambres
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {rooms.map((r) => (
                  <Card key={r.id} className="p-4 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-gray-400">{r.floor}</span>
                      <Badge
                        variant={
                          r.status === 'Disponible'
                            ? 'success'
                            : r.status === 'Occupée'
                            ? 'cyan'
                            : 'orange'
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-white text-sm truncate">{r.name}</h4>
                    <p className="text-xs text-[#0BE9EF] font-semibold">
                      {(r.pricePerNight ?? 0).toLocaleString()} FCFA / nuit
                    </p>
                    {r.currentGuest && (
                      <p className="text-[11px] text-gray-300 truncate bg-white/5 px-2 py-1 rounded">
                        Occupant : {r.currentGuest}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. RÉSERVATIONS */}
        {activeTab === 'reservations' && (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Chambre</TableHead>
                  <TableHead>Dates de Séjour</TableHead>
                  <TableHead>Montant Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-white text-xs">{b.guestName}</p>
                        <p className="text-[11px] text-gray-500">{b.guestPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-white">{b.roomName}</TableCell>
                    <TableCell className="text-xs text-gray-300">
                      {b.checkIn} → {b.checkOut} ({b.nights} nuits)
                    </TableCell>
                    <TableCell className="font-bold text-[#0BE9EF] text-xs">
                      {(b.totalAmount ?? 0).toLocaleString()} FCFA
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          b.status.includes('fait')
                            ? 'success'
                            : b.status === 'Confirmée'
                            ? 'cyan'
                            : 'orange'
                        }
                      >
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-[#10D97F] font-semibold">{b.paymentStatus}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* 3. CHAMBRES & CATALOGUE HÉBERGEMENT (SPRINT B11 + F11) */}
        {activeTab === 'chambres' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <BusinessCatalogManager
              businessId="biz-guesthouse-1"
              moduleCode="GUEST_HOUSE"
              defaultOfferType="CHAMBRE"
              onShowToast={onShowToast}
            />
          </div>
        )}

        {/* 4. CLIENTS */}
        {activeTab === 'clients' && (
          <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fichier Voyageurs & Fidélité</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voyageur</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Séjours effectués</TableHead>
                  <TableHead>Statut fidélité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold text-white">Mme. Sarah Dossou</TableCell>
                  <TableCell>+229 97 12 34 56</TableCell>
                  <TableCell>4 séjours</TableCell>
                  <TableCell><Badge variant="orange">VIP Or</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold text-white">Dr. Florent Amoussou</TableCell>
                  <TableCell>+229 97 88 55 22</TableCell>
                  <TableCell>7 séjours</TableCell>
                  <TableCell><Badge variant="cyan">Habitué Platine</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {/* 5. DISPONIBILITÉS */}
        {activeTab === 'disponibilites' && (
          <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Planning Calendrier du Mois
            </h3>
            <div className="p-6 bg-[#020919] rounded-xl border border-white/5 text-center text-xs text-gray-400">
              <p className="mb-3 font-semibold text-white">Semaine du 04 au 10 Septembre 2026</p>
              <div className="grid grid-cols-7 gap-2 font-mono">
                {['Ven 4', 'Sam 5', 'Dim 6', 'Lun 7', 'Mar 8', 'Mer 9', 'Jeu 10'].map((day, i) => (
                  <div key={i} className="p-3 bg-[#0A1428] rounded-lg border border-white/5">
                    <p className="text-white font-bold mb-1">{day}</p>
                    <span className="text-[10px] text-[#10D97F]">3 Dispo</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. CHECK-IN */}
        {activeTab === 'checkin' && (
          <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Arrivées Prévues & Enregistrement</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Chambre</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Action Réception</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.filter((b) => b.status === 'Confirmée' || b.status === 'En attente').map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-semibold text-white">{b.guestName}</TableCell>
                    <TableCell>{b.roomName}</TableCell>
                    <TableCell><Badge variant="cyan">{b.status}</Badge></TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="success"
                        leftIcon={<LogIn className="w-3.5 h-3.5" />}
                        onClick={() => handlePerformCheckIn(b.id)}
                      >
                        Valider Check-in
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* 7. CHECK-OUT */}
        {activeTab === 'checkout' && (
          <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Départs du Jour & Remise des Clés</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Chambre</TableHead>
                  <TableHead>Statut Actuel</TableHead>
                  <TableHead>Action Clôture</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.filter((b) => b.status === 'Check-in fait').map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-semibold text-white">{b.guestName}</TableCell>
                    <TableCell>{b.roomName}</TableCell>
                    <TableCell><Badge variant="orange">En séjour</Badge></TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<LogOut className="w-3.5 h-3.5" />}
                        onClick={() => handlePerformCheckOut(b.id)}
                      >
                        Enregistrer Check-out
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* 8. PAIEMENTS */}
        {activeTab === 'paiements' && (
          <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Folios & Encaissements de Séjours</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Séjour</TableHead>
                  <TableHead>Mode Règlement</TableHead>
                  <TableHead>Montant Encaissé</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold text-white">Mme. Sarah Dossou</TableCell>
                  <TableCell>Suite 201 (3 nuits)</TableCell>
                  <TableCell>MTN MoMo Bénin</TableCell>
                  <TableCell className="font-bold text-[#10D97F]">165 000 FCFA</TableCell>
                  <TableCell><Badge variant="success">Réglé 100%</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {/* 9. MESSAGES */}
        {activeTab === 'messages' && (
          <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Communications Voyageurs (WhatsApp)</h3>
            <div className="p-4 bg-[#020919] rounded-xl border border-white/5 flex items-start justify-between">
              <div>
                <p className="font-semibold text-white text-xs">M. David Lawson</p>
                <p className="text-xs text-gray-300 mt-1">
                  « Pouvez-vous prévoir le petit déjeuner continental pour 07h30 demain matin s'il vous plaît ? »
                </p>
              </div>
              <Button size="sm" variant="cyan">Répondre</Button>
            </div>
          </div>
        )}

        {/* 10. STATISTIQUES */}
        {activeTab === 'statistiques' && (
          <div className="space-y-6">
            <BarChartWidget
              title="Taux d'occupation par mois (%)"
              data={[
                { label: 'Mai', value: 65, formattedValue: '65%' },
                { label: 'Juin', value: 72, formattedValue: '72%' },
                { label: 'Juil', value: 85, formattedValue: '85%' },
                { label: 'Août', value: 90, formattedValue: '90%' },
                { label: 'Sept', value: 75, formattedValue: '75%' },
              ]}
              color="#0BE9EF"
            />
          </div>
        )}

        {/* 11. PARAMÈTRES */}
        {activeTab === 'parametres' && (
          <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Réglages Guest House</h3>
            <Input label="Heure standard d'arrivée (Check-in)" defaultValue="14:00" />
            <Input label="Heure limite de départ (Check-out)" defaultValue="12:00" />
            <Input label="Caution dégâts par chambre (FCFA)" defaultValue="25 000" />
            <Button
              variant="cyan"
              onClick={() => onShowToast('Réglages sauvegardés', 'Les horaires d’enregistrement ont été mis à jour.', 'success')}
            >
              Enregistrer
            </Button>
          </div>
        )}
      </main>

      {/* Modal Nouvelle Réservation */}
      <Modal
        isOpen={isAddBookingOpen}
        onClose={() => setIsAddBookingOpen(false)}
        title="Créer une réservation directe"
        description="Enregistrez un séjour pour un client à la réception ou par téléphone."
      >
        <form onSubmit={handleAddBooking} className="space-y-4">
          <Input
            label="Nom & Prénom du client"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Ex: David Lawson"
            required
          />
          <Input
            label="Numéro WhatsApp"
            type="tel"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            required
          />
          <Select
            label="Chambre allouée"
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            options={rooms.map((r) => ({ value: r.name, label: `${r.name} (${r.pricePerNight} F)` }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date d'arrivée"
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              required
            />
            <Input
              label="Date de départ"
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="cyan" className="w-full">
            Bloquer la chambre & confirmer
          </Button>
        </form>
      </Modal>
    </div>
  );
};
