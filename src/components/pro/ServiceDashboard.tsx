import React, { useState } from 'react';
import {
  Scissors,
  Sparkles,
  HeartHandshake,
  Activity,
  Camera,
  Palette,
  Wrench,
  ShieldCheck,
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Package,
} from 'lucide-react';
import { BusinessModuleCode, ServiceRecord } from '../../types';
import { FLOWEXA_MODULES, MOCK_SERVICE_RECORDS } from '../../data/mockData';
import { Sidebar, SidebarNavItem } from '../design-system/Sidebar';
import { Card, MetricCard } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../design-system/Table';
import { Modal } from '../design-system/Modal';
import { Input, Select } from '../design-system/Input';
import { BarChartWidget } from '../design-system/ChartWidget';
import { BusinessCatalogManager } from './BusinessCatalogManager';

export interface ServiceDashboardProps {
  moduleCode: BusinessModuleCode;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ServiceDashboard: React.FC<ServiceDashboardProps> = ({
  moduleCode,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<string>('accueil');
  const moduleInfo = FLOWEXA_MODULES.find((m) => m.code === moduleCode) || FLOWEXA_MODULES[2];

  // Specific service records
  const initialRecords = MOCK_SERVICE_RECORDS[moduleCode] || [
    {
      id: 'srv_def',
      clientName: 'M. Rodrigue Hounkpe',
      clientPhone: '+229 97 11 22 33',
      serviceTitle: `Prestation ${moduleInfo.name} Standard`,
      practitionerOrStaff: 'Équipe en service',
      dateTime: "Aujourd'hui, 11:00",
      durationMinutes: 60,
      price: 15000,
      status: 'Confirmé' as const,
    },
  ];

  const [records, setRecords] = useState<ServiceRecord[]>(initialRecords);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);

  // Form states
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('+229 97 00 00 00');
  const [serviceTitle, setServiceTitle] = useState('');
  const [staffMember, setStaffMember] = useState('Équipe Spécialisée');
  const [price, setPrice] = useState('15000');

  // Sector-specific vocabulary
  const sectorVocabulary: Record<
    string,
    { planningLabel: string; catalogLabel: string; staffLabel: string; unitName: string }
  > = {
    COIFFURE: { planningLabel: 'Agenda & Créneaux', catalogLabel: 'Coiffures & Tarifs', staffLabel: 'Coiffeurs', unitName: 'Prestations' },
    BARBIER: { planningLabel: 'Sièges & Rendez-vous', catalogLabel: 'Soins Barbe & Coupe', staffLabel: 'Barbiers', unitName: 'Clients' },
    INSTITUT_COSMETIQUE: { planningLabel: 'Cabines & Séances', catalogLabel: 'Soins & Produits', staffLabel: 'Esthéticiennes', unitName: 'Séances' },
    SPA_MASSAGE: { planningLabel: 'Cabines & Rituels', catalogLabel: 'Massages & Hammam', staffLabel: 'Praticiennes Spa', unitName: 'Massages' },
    PHOTOGRAPHE: { planningLabel: 'Séances & Shootings', catalogLabel: 'Formules & Tirages', staffLabel: 'Photographes', unitName: 'Shootings' },
    BRODERIE_IMPRESSION: { planningLabel: 'Commandes & Essayages', catalogLabel: 'Modèles & Tissus', staffLabel: 'Maîtres Tailleurs', unitName: 'Confections' },
    GARAGE: { planningLabel: 'Ordres Réparation (OR)', catalogLabel: 'Forfaits & Pièces', staffLabel: 'Mécaniciens', unitName: 'Véhicules' },
    PHARMACIE: { planningLabel: 'Ordonnances & Délivrances', catalogLabel: 'Médicaments & Stocks', staffLabel: 'Pharmaciens', unitName: 'Ventes' },
  };

  const vocab = sectorVocabulary[moduleCode] || {
    planningLabel: 'Rendez-vous & Commandes',
    catalogLabel: 'Prestations & Tarifs',
    staffLabel: 'Collaborateurs',
    unitName: 'Dossiers',
  };

  const navItems: SidebarNavItem[] = [
    { id: 'accueil', label: 'Accueil', icon: <Scissors className="w-4 h-4" /> },
    { id: 'planning', label: vocab.planningLabel, icon: <Calendar className="w-4 h-4" />, badge: records.length },
    { id: 'catalogue', label: vocab.catalogLabel, icon: <Package className="w-4 h-4" /> },
    { id: 'equipe', label: vocab.staffLabel, icon: <Users className="w-4 h-4" /> },
    { id: 'paiements', label: 'Encaissements', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'statistiques', label: 'Statistiques', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'parametres', label: 'Paramètres', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const newRec: ServiceRecord = {
      id: `srv_${Date.now()}`,
      clientName: clientName || 'Client Rendez-vous',
      clientPhone: clientPhone,
      serviceTitle: serviceTitle || `${moduleInfo.name} - Rendez-vous express`,
      practitionerOrStaff: staffMember,
      dateTime: "Aujourd'hui, 16:00",
      durationMinutes: 45,
      price: Number(price) || 12000,
      status: 'Confirmé',
    };
    setRecords([newRec, ...records]);
    setIsAddRecordOpen(false);
    onShowToast('Rendez-vous planifié', `Enregistré avec succès pour ${newRec.clientName}.`, 'success');
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-4rem)] text-left">
      {/* Reusable Pro Sidebar */}
      <Sidebar
        items={navItems}
        activeItemId={activeTab}
        onSelectItem={setActiveTab}
        moduleCode={moduleCode}
        moduleTitle={moduleInfo.name}
        businessName={`Flowexa • ${moduleInfo.subtitle}`}
      />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="orange" dot>
                {moduleInfo.number} {moduleInfo.name}
              </Badge>
              <span className="text-xs text-gray-400">{moduleInfo.category}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {navItems.find((n) => n.id === activeTab)?.label || moduleInfo.name}
            </h1>
          </div>

          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddRecordOpen(true)}
          >
            Nouveau {vocab.unitName.toLowerCase()}
          </Button>
        </div>

        {/* 1. ACCUEIL */}
        {activeTab === 'accueil' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title={`${vocab.unitName} aujourd'hui`}
                value={records.length}
                subtitle="En cours ou planifiés"
                icon={<Clock className="w-5 h-5" />}
                accentColor="#FB8205"
              />
              <MetricCard
                title="Panier moyen"
                value="24 500 F"
                change={+8.2}
                changeLabel="vs semaine passée"
                icon={<CreditCard className="w-5 h-5" />}
                accentColor="#10D97F"
              />
              <MetricCard
                title="Taux de satisfaction"
                value="4.9 / 5"
                subtitle="Sur 94 avis vérifiés"
                icon={<CheckCircle2 className="w-5 h-5" />}
                accentColor="#0BE9EF"
              />
              <MetricCard
                title="Recette prévisionnelle"
                value="142 000 F"
                subtitle="Journée en cours"
                icon={<BarChart3 className="w-5 h-5" />}
                accentColor="#10D97F"
              />
            </div>

            {/* Service Live Queue */}
            <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  File Active & Prochains Rendez-vous
                </h3>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('planning')}>
                  Voir tout le planning
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client & Contact</TableHead>
                    <TableHead>Prestation demandée</TableHead>
                    <TableHead>Prise en charge / Affectation</TableHead>
                    <TableHead>Heure</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="font-semibold text-white text-xs">{r.clientName}</p>
                        <p className="text-[11px] text-gray-500">{r.clientPhone}</p>
                      </TableCell>
                      <TableCell className="text-xs text-white font-medium">{r.serviceTitle}</TableCell>
                      <TableCell className="text-xs text-gray-300">{r.practitionerOrStaff}</TableCell>
                      <TableCell className="text-xs font-mono text-[#0BE9EF]">{r.dateTime}</TableCell>
                      <TableCell className="font-bold text-[#FB8205] text-xs">
                        {(r.price ?? 0).toLocaleString()} FCFA
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === 'Terminé'
                              ? 'success'
                              : r.status === 'En cours'
                              ? 'orange'
                              : 'cyan'
                          }
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* 2. PLANNING */}
        {activeTab === 'planning' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {records.length} créneaux enregistrés pour {moduleInfo.name}
              </p>
              <Button size="sm" variant="primary" onClick={() => setIsAddRecordOpen(true)}>
                + Ajouter un créneau
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Détails de la prestation</TableHead>
                  <TableHead>Assignation</TableHead>
                  <TableHead>Durée estimée</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold text-white">{r.clientName}</TableCell>
                    <TableCell className="text-xs">{r.serviceTitle}</TableCell>
                    <TableCell className="text-xs text-gray-300">{r.practitionerOrStaff}</TableCell>
                    <TableCell className="text-xs font-mono">{r.durationMinutes} min</TableCell>
                    <TableCell className="font-bold text-white text-xs">
                      {(r.price ?? 0).toLocaleString()} FCFA
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onShowToast('WhatsApp envoyé', 'Rappel automatique transmis au client.', 'info')}
                      >
                        Rappel WhatsApp
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* 3. CATALOGUE & PUBLICATION (SPRINT B11 + F11) */}
        {activeTab === 'catalogue' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <BusinessCatalogManager
              businessId={
                moduleCode === 'GARAGE'
                  ? 'biz-garage-1'
                  : moduleCode === 'COIFFURE'
                  ? 'biz-coiffure-1'
                  : 'biz-default-1'
              }
              moduleCode={moduleCode}
              defaultOfferType={
                moduleCode === 'GARAGE'
                  ? 'VEHICULE_INTERVENTION'
                  : ['INSTITUT_COSMETIQUE', 'PHARMACIE', 'BRODERIE_IMPRESSION'].includes(moduleCode)
                  ? 'PRODUIT'
                  : 'PRESTATION'
              }
              onShowToast={onShowToast}
            />
          </div>
        )}

        {/* 4. EQUIPE */}
        {activeTab === 'equipe' && (
          <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {vocab.staffLabel} & Postes de travail
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collaborateur</TableHead>
                  <TableHead>Rôle / Spécialité</TableHead>
                  <TableHead>Créneaux du jour</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold text-white">Chef d'équipe Principal</TableCell>
                  <TableCell>Responsable technique</TableCell>
                  <TableCell>4 rendez-vous</TableCell>
                  <TableCell><Badge variant="success">Disponible</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold text-white">Opérateur Senior</TableCell>
                  <TableCell>Praticien certifié Flowexa</TableCell>
                  <TableCell>3 rendez-vous</TableCell>
                  <TableCell><Badge variant="orange">En prestation</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {/* 5. ENCAISSEMENTS */}
        {activeTab === 'paiements' && (
          <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Historique des Encaissements
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Prestation</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Paiement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold text-white">{r.clientName}</TableCell>
                    <TableCell>{r.serviceTitle}</TableCell>
                    <TableCell className="font-bold text-[#10D97F]">{(r.price ?? 0).toLocaleString()} FCFA</TableCell>
                    <TableCell><Badge variant="success">Payé (MoMo / Espèces)</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* 6. STATISTIQUES */}
        {activeTab === 'statistiques' && (
          <div className="space-y-6">
            <BarChartWidget
              title={`Évolution des réservations hebdomadaires (${vocab.unitName})`}
              data={[
                { label: 'Lun', value: 8, formattedValue: '8' },
                { label: 'Mar', value: 12, formattedValue: '12' },
                { label: 'Mer', value: 9, formattedValue: '9' },
                { label: 'Jeu', value: 15, formattedValue: '15' },
                { label: 'Ven', value: 22, formattedValue: '22' },
                { label: 'Sam', value: 28, formattedValue: '28' },
                { label: 'Dim', value: 14, formattedValue: '14' },
              ]}
              color="#FB8205"
            />
          </div>
        )}

        {/* 7. PARAMETRES */}
        {activeTab === 'parametres' && (
          <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Configuration de l'Établissement</h3>
            <Input label="Nom de l'établissement" defaultValue={`Salon / Établissement ${moduleInfo.name}`} />
            <Input label="Durée moyenne d'un créneau (minutes)" defaultValue="45" />
            <Input label="Délai d'annulation autorisé (heures)" defaultValue="2" />
            <Button
              variant="primary"
              onClick={() => onShowToast('Paramètres mis à jour', 'Configuration enregistrée.', 'success')}
            >
              Sauvegarder
            </Button>
          </div>
        )}
      </main>

      {/* Modal Nouveau Rendez-vous */}
      <Modal
        isOpen={isAddRecordOpen}
        onClose={() => setIsAddRecordOpen(false)}
        title={`Nouveau ${vocab.unitName.toLowerCase()} : ${moduleInfo.name}`}
        description="Enregistrez une prestation ou une commande client."
      >
        <form onSubmit={handleAddRecord} className="space-y-4">
          <Input
            label="Nom & Prénom du client"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ex: Sylvie Mensah"
            required
          />
          <Input
            label="Téléphone (WhatsApp)"
            type="tel"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            required
          />
          <Input
            label="Intitulé de la prestation / commande"
            value={serviceTitle}
            onChange={(e) => setServiceTitle(e.target.value)}
            placeholder={`Ex: Formule VIP ${moduleInfo.name}`}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Collaborateur / Siège assigné"
              value={staffMember}
              onChange={(e) => setStaffMember(e.target.value)}
            />
            <Input
              label="Tarif convenu (FCFA)"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="primary" className="w-full">
            Confirmer l'enregistrement
          </Button>
        </form>
      </Modal>
    </div>
  );
};
