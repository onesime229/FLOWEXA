import React, { useState } from 'react';
import {
  Building2,
  Home,
  Users,
  UserCheck,
  CalendarCheck,
  FileText,
  CreditCard,
  MessageSquare,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Eye,
} from 'lucide-react';
import { PropertyItem } from '../../types';
import { MOCK_PROPERTIES } from '../../data/mockData';
import { Sidebar, SidebarNavItem } from '../design-system/Sidebar';
import { Card, MetricCard } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../design-system/Table';
import { Modal } from '../design-system/Modal';
import { Input, Select } from '../design-system/Input';
import { BarChartWidget } from '../design-system/ChartWidget';
import { BusinessCatalogManager } from './BusinessCatalogManager';

export interface ImmobilierDashboardProps {
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ImmobilierDashboard: React.FC<ImmobilierDashboardProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<string>('accueil');
  const [properties, setProperties] = useState<PropertyItem[]>(MOCK_PROPERTIES);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);

  // Form states for new property
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'Appartement' | 'Villa' | 'Bureau' | 'Studio' | 'Terrain'>('Appartement');
  const [newPrice, setNewPrice] = useState('150000');
  const [newLocation, setNewLocation] = useState('Cotonou, Haie Vive');
  const [newSurface, setNewSurface] = useState('110');
  const [newRooms, setNewRooms] = useState('3');

  const navItems: SidebarNavItem[] = [
    { id: 'accueil', label: 'Accueil', icon: <Home className="w-4 h-4" /> },
    { id: 'biens', label: 'Biens', icon: <Building2 className="w-4 h-4" />, badge: properties.length },
    { id: 'prospects', label: 'Prospects', icon: <UserCheck className="w-4 h-4" />, badge: '6' },
    { id: 'clients', label: 'Clients', icon: <Users className="w-4 h-4" />, badge: '18' },
    { id: 'visites', label: 'Visites', icon: <CalendarCheck className="w-4 h-4" />, badge: '4' },
    { id: 'contrats', label: 'Contrats', icon: <FileText className="w-4 h-4" /> },
    { id: 'paiements', label: 'Paiements', icon: <CreditCard className="w-4 h-4" />, badge: '1 retard' },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'statistiques', label: 'Statistiques', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'parametres', label: 'Paramètres', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    const newProp: PropertyItem = {
      id: `prop_${Date.now()}`,
      title: newTitle || 'Nouvel Appartement',
      type: newType,
      transaction: 'Location',
      price: Number(newPrice) || 100000,
      location: newLocation,
      surface: Number(newSurface) || 90,
      rooms: Number(newRooms) || 3,
      status: 'Disponible',
      imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&auto=format&fit=crop&q=80',
    };
    setProperties([newProp, ...properties]);
    setIsAddPropertyOpen(false);
    onShowToast('Bien immobilier ajouté', `${newProp.title} a été enregistré dans votre catalogue.`, 'success');
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-4rem)] text-left">
      {/* Dedicated Pro Sidebar */}
      <Sidebar
        items={navItems}
        activeItemId={activeTab}
        onSelectItem={setActiveTab}
        moduleCode="IMMOBILIER"
        moduleTitle="Gestion Immobilière"
        businessName="Agence Littoral & Prestige"
      />

      {/* Main Tab Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
        {/* Header with quick action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight capitalize">
              {navItems.find((n) => n.id === activeTab)?.label || 'Immobilier'}
            </h1>
            <p className="text-xs text-gray-400">
              Module Métier Immobilière • Agence Littoral Prestige Bénin
            </p>
          </div>

          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddPropertyOpen(true)}
          >
            Nouveau bien immobilier
          </Button>
        </div>

        {/* 1. ACCUEIL */}
        {activeTab === 'accueil' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Biens gérés"
                value={properties.length}
                subtitle="Dans le catalogue"
                icon={<Building2 className="w-5 h-5" />}
                accentColor="#FB8205"
              />
              <MetricCard
                title="Taux d'occupation"
                value="92%"
                change={+4.5}
                changeLabel="vs mois passé"
                icon={<CheckCircle className="w-5 h-5" />}
                accentColor="#10D97F"
              />
              <MetricCard
                title="Loyers encaissés"
                value="1 450 000 F"
                subtitle="Septembre 2026"
                icon={<CreditCard className="w-5 h-5" />}
                accentColor="#0BE9EF"
              />
              <MetricCard
                title="Visites programmées"
                value="4"
                subtitle="Cette semaine"
                icon={<CalendarCheck className="w-5 h-5" />}
                accentColor="#FB8205"
              />
            </div>

            {/* Recent Properties Overview */}
            <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Derniers Biens Ajoutés
                </h3>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('biens')}>
                  Voir tout le catalogue
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {properties.slice(0, 4).map((p) => (
                  <Card key={p.id} className="overflow-hidden border border-white/5">
                    <img src={p.imageUrl} alt={p.title} className="h-32 w-full object-cover" />
                    <div className="p-4 space-y-1.5">
                      <Badge variant={p.status === 'Disponible' ? 'success' : 'orange'}>
                        {p.status}
                      </Badge>
                      <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                      <p className="text-xs text-[#FB8205] font-black">
                        {(p.price ?? 0).toLocaleString()} FCFA / mois
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{p.location}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. BIENS & CATALOGUE IMMOBILIER (SPRINT B11 + F11) */}
        {activeTab === 'biens' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <BusinessCatalogManager
              businessId="biz-immo-1"
              moduleCode="IMMOBILIER"
              defaultOfferType="BIEN"
              onShowToast={onShowToast}
            />
          </div>
        )}

        {/* 3. PROSPECTS */}
        {activeTab === 'prospects' && (
          <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Prospects Acquéreurs & Locataires</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prospect</TableHead>
                  <TableHead>Recherche</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Zone souhaitée</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold text-white">Éric Gbédji</TableCell>
                  <TableCell>Appartement 3 pièces</TableCell>
                  <TableCell className="text-[#FB8205] font-bold">130 000 FCFA</TableCell>
                  <TableCell>Haie Vive / Ganhi</TableCell>
                  <TableCell><Badge variant="orange">Visite prévue</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold text-white">Mariam Alao</TableCell>
                  <TableCell>Villa 4 chambres avec cour</TableCell>
                  <TableCell className="text-[#FB8205] font-bold">300 000 FCFA</TableCell>
                  <TableCell>Fidjrossè</TableCell>
                  <TableCell><Badge variant="cyan">Besoin qualifié</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {/* 4. CLIENTS */}
        {activeTab === 'clients' && (
          <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Locataires Actifs & Bailleurs</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom du Client</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Bien Rattaché</TableHead>
                  <TableHead>Loyer</TableHead>
                  <TableHead>Dernier Paiement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold text-white">M. Rodrigue Zinsou</TableCell>
                  <TableCell><Badge variant="neutral">Locataire</Badge></TableCell>
                  <TableCell>Villa Duplex Fidjrossè</TableCell>
                  <TableCell className="text-white font-bold">350 000 FCFA</TableCell>
                  <TableCell className="text-[#10D97F]">01 Sept 2026 (À jour)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold text-white">Mme. Viviane Dossou</TableCell>
                  <TableCell><Badge variant="cyan">Propriétaire Bailleur</Badge></TableCell>
                  <TableCell>3 Appartements Haie Vive</TableCell>
                  <TableCell className="text-white font-bold">360 000 FCFA</TableCell>
                  <TableCell className="text-[#10D97F]">Reversé</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {/* 5. VISITES */}
        {activeTab === 'visites' && (
          <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Planning des Visites Immobilières</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Bien à visiter</TableHead>
                  <TableHead>Visiteur / Prospect</TableHead>
                  <TableHead>Agent responsable</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-xs font-mono text-white">05 Sept, 15h00</TableCell>
                  <TableCell className="font-semibold text-white">Appartement 3 pièces Haie Vive</TableCell>
                  <TableCell>Éric Gbédji (+229 95 33 11 77)</TableCell>
                  <TableCell>Marc Kojo</TableCell>
                  <TableCell><Badge variant="orange">Confirmée</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs font-mono text-white">06 Sept, 10h30</TableCell>
                  <TableCell className="font-semibold text-white">Villa Duplex Fidjrossè</TableCell>
                  <TableCell>Mme. Mariam Alao</TableCell>
                  <TableCell>Amina Agent</TableCell>
                  <TableCell><Badge variant="cyan">En attente confirmation</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {/* 6. CONTRATS */}
        {activeTab === 'contrats' && (
          <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Baux Locatifs & Mandats de Gestion</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Réf. Contrat</TableHead>
                  <TableHead>Locataire / Signataire</TableHead>
                  <TableHead>Début - Fin</TableHead>
                  <TableHead>Loyer mensuel</TableHead>
                  <TableHead>Caution versée</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs text-[#0BE9EF]">BAIL-2025-042</TableCell>
                  <TableCell className="font-semibold text-white">Rodrigue Zinsou</TableCell>
                  <TableCell className="text-xs text-gray-400">01/01/2025 - 31/12/2026</TableCell>
                  <TableCell className="font-bold text-white">350 000 FCFA</TableCell>
                  <TableCell className="text-[#10D97F]">700 000 FCFA (2 mois)</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" leftIcon={<Download className="w-3.5 h-3.5" />}>
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {/* 7. PAIEMENTS */}
        {activeTab === 'paiements' && (
          <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quittances & Suivi des Loyers</h3>
              <Badge variant="danger" dot>1 loyer en retard</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mois</TableHead>
                  <TableHead>Locataire</TableHead>
                  <TableHead>Bien</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Quittance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs text-white">Septembre 2026</TableCell>
                  <TableCell className="font-semibold text-white">Rodrigue Zinsou</TableCell>
                  <TableCell>Villa Fidjrossè</TableCell>
                  <TableCell className="font-bold text-[#10D97F]">350 000 FCFA</TableCell>
                  <TableCell><Badge variant="success">Encaissé</Badge></TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" leftIcon={<Download className="w-3 h-3" />}>
                      Générer
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs text-white">Septembre 2026</TableCell>
                  <TableCell className="font-semibold text-white">Alphonse Agbo</TableCell>
                  <TableCell>Studio Ganhi</TableCell>
                  <TableCell className="font-bold text-rose-400">85 000 FCFA</TableCell>
                  <TableCell><Badge variant="danger">Retard 4 jours</Badge></TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onShowToast('Relance WhatsApp', 'Rappel automatique transmis au locataire.', 'info')}
                    >
                      Relancer WhatsApp
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {/* 8. MESSAGES */}
        {activeTab === 'messages' && (
          <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Historique des Échanges & Notifications</h3>
            <div className="space-y-3">
              <div className="p-4 bg-[#020919] rounded-xl border border-white/5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs">Éric Gbédji</span>
                    <Badge variant="cyan">WhatsApp</Badge>
                    <span className="text-[10px] text-gray-500">Hier à 16:40</span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">
                    « Bonjour, nous serons 2 personnes pour la visite de demain à 15h à la Haie Vive. »
                  </p>
                </div>
                <Button size="sm" variant="cyan">Répondre</Button>
              </div>
            </div>
          </div>
        )}

        {/* 9. STATISTIQUES */}
        {activeTab === 'statistiques' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BarChartWidget
                title="Revenus Locatifs Mensuels Encaissés (FCFA)"
                data={[
                  { label: 'Mai', value: 1200, formattedValue: '1 200 000 F' },
                  { label: 'Juin', value: 1350, formattedValue: '1 350 000 F' },
                  { label: 'Juil', value: 1400, formattedValue: '1 400 000 F' },
                  { label: 'Août', value: 1450, formattedValue: '1 450 000 F' },
                  { label: 'Sept', value: 1450, formattedValue: '1 450 000 F' },
                ]}
              />
              <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Indicateurs Métier Clés</h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">Délai moyen de relocation :</span>
                    <span className="font-bold text-white">14 jours</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">Rendement locatif moyen :</span>
                    <span className="font-bold text-[#10D97F]">9.2% net</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">Commissions d'agence ce mois :</span>
                    <span className="font-bold text-[#FB8205]">290 000 FCFA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. PARAMÈTRES */}
        {activeTab === 'parametres' && (
          <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Paramètres de l'Agence Immobilière</h3>
            <Input label="Nom commercial de l'agence" defaultValue="Agence Immobilière Littoral & Prestige" />
            <Input label="Numéro IFU / Registre du Commerce" defaultValue="0201948572849 Bénin" />
            <Input label="Commission standard sur location" defaultValue="1 mois de loyer" />
            <Input label="Taux de gestion locative mensuel (%)" defaultValue="8%" />
            <Button
              variant="primary"
              onClick={() => onShowToast('Paramètres enregistrés', 'Configuration de l’agence mise à jour.', 'success')}
            >
              Sauvegarder les modifications
            </Button>
          </div>
        )}
      </main>

      {/* Modal Ajouter un Bien */}
      <Modal
        isOpen={isAddPropertyOpen}
        onClose={() => setIsAddPropertyOpen(false)}
        title="Enregistrer un nouveau bien immobilier"
        description="Ajoutez une maison, un appartement ou un local dans votre portefeuille d'agence."
      >
        <form onSubmit={handleAddProperty} className="space-y-4">
          <Input
            label="Titre du bien"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ex: Appartement meublé 3 pièces avec balcon"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type de bien"
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              options={[
                { value: 'Appartement', label: 'Appartement' },
                { value: 'Villa', label: 'Villa' },
                { value: 'Studio', label: 'Studio' },
                { value: 'Bureau', label: 'Bureau' },
                { value: 'Terrain', label: 'Terrain' },
              ]}
            />
            <Input
              label="Loyer mensuel (FCFA)"
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              required
            />
          </div>

          <Input
            label="Localisation précise"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            placeholder="Ex: Cotonou, Haie Vive, Rue 412"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Surface habitable (m²)"
              type="number"
              value={newSurface}
              onChange={(e) => setNewSurface(e.target.value)}
            />
            <Input
              label="Nombre de pièces"
              type="number"
              value={newRooms}
              onChange={(e) => setNewRooms(e.target.value)}
            />
          </div>

          <Button type="submit" variant="primary" className="w-full">
            Publier le bien dans le catalogue
          </Button>
        </form>
      </Modal>
    </div>
  );
};
