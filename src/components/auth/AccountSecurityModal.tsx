import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  KeyRound,
  Lock,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Building,
  Bell,
  Clock,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { UserProfile, RoleType } from '../../types';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Input } from '../design-system/Input';
import { Badge } from '../design-system/Badge';
import { authApi } from '../../services/authApi';

export interface AccountSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUserUpdated: (updatedUser: UserProfile) => void;
  onLogout: () => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

type TabType = 'profile' | 'security' | 'permissions';

export const AccountSecurityModal: React.FC<AccountSecurityModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  onLogout,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isLoading, setIsLoading] = useState(false);

  // Profile form
  const [firstName, setFirstName] = useState(user.firstName || user.name.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user.lastName || user.name.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [email, setEmail] = useState(user.email || '');
  const [birthDate, setBirthDate] = useState(user.birthDate || '');
  const [notifEmail, setNotifEmail] = useState(user.notificationPreferences?.email ?? true);
  const [notifSms, setNotifSms] = useState(user.notificationPreferences?.sms ?? true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(user.notificationPreferences?.whatsapp ?? true);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Security overview data
  const [twoFactor, setTwoFactor] = useState(!!user.twoFactorEnabled);
  const [activeSessions, setActiveSessions] = useState(1);
  const [recentLogins, setRecentLogins] = useState<
    Array<{ id: string; timestamp: string; ip: string; action: string; device: string }>
  >([]);

  useEffect(() => {
    if (isOpen) {
      setFirstName(user.firstName || user.name.split(' ')[0] || '');
      setLastName(user.lastName || user.name.split(' ').slice(1).join(' ') || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setBirthDate(user.birthDate || '');
      setTwoFactor(!!user.twoFactorEnabled);

      // Fetch fresh security overview
      authApi
        .getSecurityOverview()
        .then((sec) => {
          setActiveSessions(sec.activeSessionsCount);
          setTwoFactor(sec.twoFactorEnabled);
          setRecentLogins(sec.recentLogins);
        })
        .catch(() => {
          // fallback
        });
    }
  }, [isOpen, user]);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updated = await authApi.updateMe({
        firstName,
        lastName,
        phone,
        email,
        birthDate,
        notificationPreferences: {
          email: notifEmail,
          sms: notifSms,
          whatsapp: notifWhatsapp,
          marketing: false,
        },
      });
      onUserUpdated(updated);
      onShowToast('Profil mis à jour', 'Vos informations ont été enregistrées avec succès.', 'success');
    } catch (err: any) {
      onShowToast('Erreur de mise à jour', err.message || 'Impossible de sauvegarder', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      onShowToast('Erreur', 'Les mots de passe ne correspondent pas.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      onShowToast('Erreur', 'Le mot de passe doit faire au moins 6 caractères.', 'error');
      return;
    }
    setIsLoading(true);

    try {
      await authApi.changePassword(currentPassword, newPassword);
      onShowToast(
        'Mot de passe modifié',
        'Votre mot de passe a été mis à jour avec succès.',
        'success'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      onShowToast('Erreur', err.message || 'Ancien mot de passe incorrect', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle 2FA
  const handleToggle2fa = async () => {
    try {
      const newState = await authApi.toggle2fa();
      setTwoFactor(newState);
      onShowToast(
        'Double facteur 2FA',
        newState ? 'Vérification en deux étapes activée.' : 'Double facteur désactivé.',
        'info'
      );
      onUserUpdated({ ...user, twoFactorEnabled: newState });
    } catch (err: any) {
      onShowToast('Erreur', err.message, 'error');
    }
  };

  const getRoleBadgeVariant = (role: RoleType) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'danger';
      case 'BUSINESS_OWNER':
        return 'primary';
      case 'MANAGER':
        return 'info';
      case 'EMPLOYEE':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: RoleType) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Administrateur Global';
      case 'BUSINESS_OWNER':
        return 'Gérant / Propriétaire d’Entreprise';
      case 'MANAGER':
        return 'Manager Opérationnel';
      case 'EMPLOYEE':
        return 'Employé & Intervenant Métier';
      default:
        return 'Client Flowexa';
    }
  };

  const permissionsList = {
    SUPER_ADMIN: [
      'Accès complet à la plateforme multi-tenant',
      'Supervision de toutes les entreprises et modules',
      'Gestion des comptes et modification des rôles',
      'Suspension et réactivation d’entreprises / utilisateurs',
      'Visualisation des flux financiers globaux (MRR, forfaits)',
      'Accès au moteur d’intelligence artificielle et logs globaux',
    ],
    BUSINESS_OWNER: [
      'Gestion complète de son entreprise (catalogue, offres, tarifs)',
      'Visualisation du chiffre d’affaires et transactions propres',
      'Gestion des membres de son équipe (Managers, Employés)',
      'Configuration des moyens de paiement (Kkiapay, MoMo, etc.)',
      'Modification du profil et horaires d’ouverture',
      'Gestion des réservations, demandes et rendez-vous',
    ],
    MANAGER: [
      'Traitement opérationnel des demandes clients',
      'Gestion et validation des rendez-vous et réservations',
      'Attribution des interventions aux employés',
      'Messagerie et réponses aux avis clients',
      'Consultation des statistiques opérationnelles (sans accès bancaire)',
    ],
    EMPLOYEE: [
      'Visualisation de son planning et des rendez-vous assignés',
      'Mise à jour du statut des interventions en temps réel',
      'Messagerie directe avec les clients pour ses tâches',
      'Consultation de son historique d’activité',
    ],
    CLIENT: [
      'Recherche géolocalisée et filtrage parmi les 10 métiers',
      'Envoi de demandes personnalisées et demande de devis',
      'Prise de rendez-vous en ligne instantanée',
      'Gestion de ses favoris et historique',
      'Paiement en ligne sécurisé (Mobile Money Bénin)',
      'Rédaction d’avis et notation certifiés',
    ],
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mon Compte & Sécurité"
      description={`Connecté en tant que ${user.name} (${getRoleLabel(user.role)})`}
      size="lg"
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'text-[#FB8205] border-b-2 border-[#FB8205]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profil & Identité</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'security'
                ? 'text-[#0BE9EF] border-b-2 border-[#0BE9EF]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Sécurité & Sessions</span>
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'permissions'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Rôle & Permissions</span>
          </button>
        </div>

        {/* TAB 1: PROFIL & IDENTITÉ */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FB8205] to-[#E06900] flex items-center justify-center text-white font-black text-lg shadow-md">
                {user.initials || 'FX'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{user.name}</span>
                  <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                  {user.verificationStatus === 'VERIFIE' && (
                    <span className="text-[10px] text-[#10D97F] font-bold bg-[#10D97F]/10 px-2 py-0.5 rounded-full border border-[#10D97F]/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Vérifié
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {user.businessName ? `Rattaché à : ${user.businessName}` : user.tenantName}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Prénom"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Nom"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Numéro de Téléphone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+229 01 97 00 00 00"
              />
              <Input
                label="Adresse Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Input
              label="Date de naissance (optionnelle)"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />

            {/* Notifications channels */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[#FB8205]" />
                Canaux de notifications préférés
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifEmail}
                    onChange={(e) => setNotifEmail(e.target.checked)}
                    className="rounded text-[#FB8205]"
                  />
                  <span>Email</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifSms}
                    onChange={(e) => setNotifSms(e.target.checked)}
                    className="rounded text-[#FB8205]"
                  />
                  <span>SMS</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifWhatsapp}
                    onChange={(e) => setNotifWhatsapp(e.target.checked)}
                    className="rounded text-[#0BE9EF]"
                  />
                  <span className="text-[#0BE9EF] font-bold">WhatsApp</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Fermer
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading}>
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        )}

        {/* TAB 2: SÉCURITÉ & SESSIONS */}
        {activeTab === 'security' && (
          <div className="space-y-5">
            {/* 2FA Toggle */}
            <div className="p-4 rounded-xl bg-[#0A1428] border border-white/10 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#0BE9EF]" />
                  Authentification à deux facteurs (2FA)
                </div>
                <p className="text-[11px] text-gray-400">
                  Exige un code de validation à chaque nouvelle connexion sur un appareil inconnu.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggle2fa}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  twoFactor
                    ? 'bg-[#10D97F]/20 text-[#10D97F] border border-[#10D97F]/40'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {twoFactor ? 'Activé' : 'Désactivé'}
              </button>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handleChangePassword} className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#FB8205]" />
                Modifier mon mot de passe
              </h4>

              <div className="relative">
                <Input
                  label="Mot de passe actuel"
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-white cursor-pointer"
                  aria-label="Afficher le mot de passe"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <Input
                  label="Confirmer le nouveau mot de passe"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" variant="secondary" className="w-full mt-2" isLoading={isLoading}>
                Mettre à jour le mot de passe
              </Button>
            </form>

            {/* Active Sessions & History */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  Sessions & Journal de sécurité
                </span>
                <span className="text-[11px] text-[#10D97F] font-semibold">
                  {activeSessions} session(s) active(s)
                </span>
              </div>

              {recentLogins.length > 0 ? (
                <div className="divide-y divide-white/5 rounded-xl border border-white/5 bg-[#020919] max-h-40 overflow-y-auto text-xs">
                  {recentLogins.map((item) => (
                    <div key={item.id} className="p-2.5 flex items-center justify-between text-gray-300">
                      <div>
                        <div className="font-medium text-white">{item.action}</div>
                        <div className="text-[10px] text-gray-500">
                          IP: {item.ip} • {item.device}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-white/5 text-[11px] text-gray-400 text-center">
                  Aucun incident de sécurité détecté. Vos connexions sont vérifiées.
                </div>
              )}
            </div>

            {/* Logout button */}
            <div className="pt-2 border-t border-white/5 flex justify-between items-center">
              <span className="text-xs text-gray-400">Fin de session de travail</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Se déconnecter de Flowexa</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: RÔLE & PERMISSIONS */}
        {activeTab === 'permissions' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#0A1428] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Matrice des Droits et Habilitations
                </span>
                <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
              </div>
              <p className="text-xs text-gray-300">
                Dans l’architecture multi-tenant Flowexa, chaque compte est isolé. Vous possédez le profil{' '}
                <strong className="text-white">{getRoleLabel(user.role)}</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Vos permissions actives :
              </h4>
              <ul className="space-y-2">
                {(permissionsList[user.role] || permissionsList.CLIENT).map((perm, i) => (
                  <li
                    key={i}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-200 flex items-start gap-2.5"
                  >
                    <Check className="w-4 h-4 text-[#10D97F] shrink-0 mt-0.5" />
                    <span>{perm}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
