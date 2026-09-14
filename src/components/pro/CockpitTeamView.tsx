import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Clock, 
  Check, 
  X, 
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';
import { flowexaApi } from '../../services/api';
import type { BusinessTeamMember } from '../../types';

interface CockpitTeamViewProps {
  businessId: string;
  businessName: string;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const CockpitTeamView: React.FC<CockpitTeamViewProps> = ({
  businessId,
  businessName,
  onShowToast,
}) => {
  const [team, setTeam] = useState<BusinessTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('0154100617');
  const [role, setRole] = useState<'MANAGER' | 'EMPLOYEE'>('EMPLOYEE');
  const [permissions, setPermissions] = useState({
    canViewRequests: true,
    canManageAppointments: true,
    canViewClients: true,
    canViewStats: false,
    canManageCatalog: false,
  });

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await flowexaApi.getTeamMembers(businessId);
      if (res.success && Array.isArray(res.data)) {
        setTeam(res.data);
      }
    } catch (e) {
      console.error(e);
      onShowToast('Erreur', 'Impossible de charger les collaborateurs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [businessId]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      onShowToast('Validation', 'Nom et adresse email requis.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await flowexaApi.addTeamMember(businessId, {
        name,
        email,
        phone,
        role,
        permissions,
      });

      if (res.success) {
        onShowToast('Succès', `Collaborateur ${name} ajouté avec succès.`, 'success');
        setIsInviteModalOpen(false);
        setName('');
        setEmail('');
        fetchTeam();
      } else {
        onShowToast('Erreur', res.message || 'Échec de l’ajout.', 'error');
      }
    } catch (e) {
      console.error(e);
      onShowToast('Erreur', 'Une erreur est survenue lors de l’invitation.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: BusinessTeamMember) => {
    const newStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await flowexaApi.updateTeamMember(businessId, member.id, {
        status: newStatus,
      });
      if (res.success) {
        onShowToast(
          'Statut modifié',
          `${member.name} est maintenant ${newStatus === 'ACTIVE' ? 'Actif' : 'Inactif'}.`,
          'info'
        );
        fetchTeam();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMember = async (id: string, memberName: string) => {
    if (!window.confirm(`Confirmer le retrait de ${memberName} de l'équipe ?`)) return;

    try {
      const res = await flowexaApi.deleteTeamMember(businessId, id);
      if (res.success) {
        onShowToast('Collaborateur retiré', `${memberName} a été retiré de l’équipe.`, 'info');
        fetchTeam();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-[#0A1428] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="orange" dot>
              Équipe & Rôles
            </Badge>
            <span className="text-xs text-gray-400">Entreprise : {businessName}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Gestion des Collaborateurs & Employés</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Contrôlez les accès opérationnels de votre personnel sans jamais exposer les droits système.
          </p>
        </div>

        <Button
          size="md"
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsInviteModalOpen(true)}
        >
          Ajouter un collaborateur
        </Button>
      </div>

      {/* Security notice */}
      <div className="p-4 rounded-xl bg-[#020919] border border-emerald-500/20 flex items-center gap-3 text-xs text-gray-400">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <span>
          <strong>Isolation Stricte :</strong> Les collaborateurs ajoutés ne peuvent consulter que les données de cet établissement (<strong className="text-white">{businessId}</strong>). L'attribution de privilèges Super Admin est strictement verrouillée par le système.
        </span>
      </div>

      {/* Team members grid */}
      {loading ? (
        <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-12 text-center text-gray-400 text-sm">
          <Clock className="w-6 h-6 text-[#FB8205] animate-spin mx-auto mb-2" />
          Chargement des membres de l’équipe...
        </div>
      ) : team.length === 0 ? (
        <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-12 text-center text-gray-400">
          <UserCheck className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="font-semibold text-white">Aucun collaborateur enregistré</p>
          <p className="text-xs text-gray-500 mt-1">
            Ajoutez votre premier employé ou gérant adjoint pour lui déléguer des tâches.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map((member) => (
            <div
              key={member.id}
              className="p-5 rounded-2xl bg-[#0A1428] border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white text-sm">
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{member.name}</h4>
                      <p className="text-xs text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        {member.phone}
                      </p>
                    </div>
                  </div>

                  <Badge variant={member.role === 'MANAGER' ? 'orange' : 'cyan'}>
                    {member.role === 'MANAGER' ? 'Gérant / Manager' : 'Employé'}
                  </Badge>
                </div>

                <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5" />
                  {member.email}
                </p>

                {/* Permissions pills */}
                <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px]">
                  <span className="text-gray-500 block font-semibold">Droits d'accès :</span>
                  <div className="flex flex-wrap gap-1">
                    {member.permissions.canViewRequests && (
                      <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300">Demandes</span>
                    )}
                    {member.permissions.canManageAppointments && (
                      <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300">Rdv & Agenda</span>
                    )}
                    {member.permissions.canViewClients && (
                      <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300">Portefeuille clients</span>
                    )}
                    {member.permissions.canViewStats && (
                      <span className="px-2 py-0.5 rounded bg-[#FB8205]/20 text-[#FB8205]">Statistiques & CA</span>
                    )}
                    {member.permissions.canManageCatalog && (
                      <span className="px-2 py-0.5 rounded bg-[#0BE9EF]/20 text-[#0BE9EF]">Édition Catalogue</span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 bg-[#020919] rounded-xl border border-white/5 flex items-center justify-between text-xs text-gray-400">
                  <span>Prestations assignées :</span>
                  <strong className="text-white font-bold">{member.assignedCount}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5 gap-2">
                <button
                  onClick={() => handleToggleStatus(member)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    member.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  }`}
                >
                  {member.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                </button>

                <button
                  onClick={() => handleDeleteMember(member.id, member.name)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                  title="Supprimer collaborateur"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1428] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-5 text-left shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#FB8205]" />
                <span>Nouveau Collaborateur</span>
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Nom & Prénom *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Christian Koudjo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#020919] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8205]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Adresse Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="collaborateur@flowexa.bj"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#020919] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8205]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Numéro de téléphone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#020919] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#FB8205]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Rôle au sein de l'entreprise
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('EMPLOYEE');
                      setPermissions({
                        canViewRequests: true,
                        canManageAppointments: true,
                        canViewClients: true,
                        canViewStats: false,
                        canManageCatalog: false,
                      });
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                      role === 'EMPLOYEE'
                        ? 'bg-[#0BE9EF]/10 border-[#0BE9EF] text-white'
                        : 'bg-[#020919] border-white/10 text-gray-400'
                    }`}
                  >
                    <p className="font-bold">Employé / Opérateur</p>
                    <span className="text-[10px] text-gray-500 font-normal">
                      Traitement des demandes et rdv
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole('MANAGER');
                      setPermissions({
                        canViewRequests: true,
                        canManageAppointments: true,
                        canViewClients: true,
                        canViewStats: true,
                        canManageCatalog: true,
                      });
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                      role === 'MANAGER'
                        ? 'bg-[#FB8205]/10 border-[#FB8205] text-white'
                        : 'bg-[#020919] border-white/10 text-gray-400'
                    }`}
                  >
                    <p className="font-bold">Gérant / Manager</p>
                    <span className="text-[10px] text-gray-500 font-normal">
                      Accès complet + stats et catalogue
                    </span>
                  </button>
                </div>
              </div>

              {/* Granular permissions */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="block text-xs font-semibold text-gray-300">
                  Permissions individuelles
                </label>
                <div className="space-y-1.5 text-xs text-gray-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canViewRequests}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canViewRequests: e.target.checked })
                      }
                      className="rounded bg-[#020919] border-white/20 text-[#FB8205]"
                    />
                    <span>Consulter les demandes et réservations</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canManageAppointments}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canManageAppointments: e.target.checked })
                      }
                      className="rounded bg-[#020919] border-white/20 text-[#FB8205]"
                    />
                    <span>Gérer le calendrier et les rendez-vous</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canViewClients}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canViewClients: e.target.checked })
                      }
                      className="rounded bg-[#020919] border-white/20 text-[#FB8205]"
                    />
                    <span>Accéder aux fiches clients</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canViewStats}
                      onChange={(e) =>
                        setPermissions({ ...permissions, canViewStats: e.target.checked })
                      }
                      className="rounded bg-[#020919] border-white/20 text-[#FB8205]"
                    />
                    <span>Voir les statistiques et le chiffre d'affaires</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={submitting}
                >
                  Confirmer l'ajout
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
