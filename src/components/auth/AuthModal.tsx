import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  Building,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  KeyRound,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  Briefcase,
  AlertCircle,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { AuthViewMode, UserProfile, BusinessModuleCode } from '../../types';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Input, Select } from '../design-system/Input';
import { Badge } from '../design-system/Badge';
import { FLOWEXA_MODULES } from '../../data/mockData';
import { authApi } from '../../services/authApi';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthViewMode;
  onLoginSuccess: (user: UserProfile) => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'LOGIN',
  onLoginSuccess,
  onShowToast,
}) => {
  const [mode, setMode] = useState<AuthViewMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form states - Login
  const [identifier, setIdentifier] = useState('pro@flowexa.com');
  const [password, setPassword] = useState('Flowexa2026!');

  // Form states - Client Registration
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientPhone, setClientPhone] = useState('+229 01 ');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [clientTerms, setClientTerms] = useState(true);

  // Form states - Business Registration
  const [bizFirstName, setBizFirstName] = useState('');
  const [bizLastName, setBizLastName] = useState('');
  const [bizName, setBizName] = useState('');
  const [bizModule, setBizModule] = useState<BusinessModuleCode>('IMMOBILIER');
  const [bizCity, setBizCity] = useState('Cotonou');
  const [bizDistrict, setBizDistrict] = useState('Haie Vive');
  const [bizPhone, setBizPhone] = useState('+229 01 ');
  const [bizEmail, setBizEmail] = useState('');
  const [bizPassword, setBizPassword] = useState('');
  const [bizTerms, setBizTerms] = useState(true);

  // Form states - Password recovery
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sync mode with props
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
    }
  }, [isOpen, initialMode]);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await authApi.login(identifier.trim(), password);
      if (response.user) {
        onLoginSuccess(response.user);
        onShowToast(
          'Connexion réussie',
          `Bienvenue sur Flowexa, ${response.user.name} (${response.user.role})`,
          'success'
        );
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Identifiants invalides');
      onShowToast('Erreur de connexion', err.message || 'Identifiants invalides', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Client Registration
  const handleClientRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientTerms) {
      setErrorMessage('Veuillez accepter les conditions d’utilisation.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await authApi.registerClient({
        firstName: clientFirstName.trim(),
        lastName: clientLastName.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim() || undefined,
        password: clientPassword,
        acceptTerms: clientTerms,
      });

      if (response.user) {
        onLoginSuccess(response.user);
        onShowToast(
          'Compte Client créé',
          `Bienvenue ${response.user.name} ! Votre compte client est activé.`,
          'success'
        );
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de l’inscription client');
      onShowToast('Inscription impossible', err.message || 'Erreur inconnue', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Business Registration
  const handleBusinessRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizTerms) {
      setErrorMessage('Veuillez accepter la charte et les conditions.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await authApi.registerBusiness({
        firstName: bizFirstName.trim(),
        lastName: bizLastName.trim(),
        businessName: bizName.trim(),
        moduleCode: bizModule,
        city: bizCity.trim(),
        district: bizDistrict.trim() || undefined,
        phone: bizPhone.trim(),
        email: bizEmail.trim(),
        password: bizPassword,
        acceptTerms: bizTerms,
      });

      if (response.user) {
        onLoginSuccess(response.user);
        onShowToast(
          'Organisation créée',
          `Félicitations ! L’espace pour ${bizName} est créé et opérationnel.`,
          'success'
        );
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la création de l’entreprise');
      onShowToast('Création impossible', err.message || 'Erreur inconnue', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await authApi.forgotPassword(recoveryIdentifier.trim());
      if (res.testCode) {
        setGeneratedCode(res.testCode);
        setResetCode(res.testCode);
      }
      setMode('RESET_PASSWORD');
      onShowToast(
        'Code de sécurité émis',
        'Un code à 6 chiffres a été généré pour réinitialiser votre accès.',
        'info'
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Compte introuvable');
      onShowToast('Erreur', err.message || 'Compte introuvable', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await authApi.resetPassword(resetCode.trim(), newPassword);
      onShowToast(
        'Mot de passe réinitialisé',
        'Votre mot de passe a été mis à jour avec succès. Vous pouvez vous connecter.',
        'success'
      );
      setIdentifier(recoveryIdentifier || identifier);
      setPassword(newPassword);
      setMode('LOGIN');
    } catch (err: any) {
      setErrorMessage(err.message || 'Échec de la réinitialisation');
      onShowToast('Erreur', err.message || 'Échec de la réinitialisation', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Account Selection
  const setQuickDemoAccount = (
    role: 'CLIENT' | 'BUSINESS_OWNER' | 'MANAGER' | 'EMPLOYEE' | 'SUPER_ADMIN'
  ) => {
    setErrorMessage(null);
    setMode('LOGIN');
    switch (role) {
      case 'CLIENT':
        setIdentifier('client@flowexa.bj');
        setPassword('ClientFlowexa2026!');
        break;
      case 'BUSINESS_OWNER':
        setIdentifier('pro@flowexa.com');
        setPassword('Flowexa2026!');
        break;
      case 'MANAGER':
        setIdentifier('christian.koudjo@prestige-immo.bj');
        setPassword('Flowexa2026!');
        break;
      case 'EMPLOYEE':
        setIdentifier('blandine.alapini@prestige-immo.bj');
        setPassword('Flowexa2026!');
        break;
      case 'SUPER_ADMIN':
        setIdentifier('admin@flowexa.com');
        setPassword('AdminFlowexa2026!');
        break;
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'LOGIN':
        return {
          title: 'Connexion à Flowexa',
          desc: 'Identifiez-vous pour accéder à vos services, vos demandes ou votre cockpit professionnel.',
        };
      case 'REGISTER':
      case 'REGISTER_CLIENT':
        return {
          title: 'Créer un Compte Client',
          desc: 'Recherchez, contactez des entreprises certifiées, réservez et suivez vos demandes.',
        };
      case 'REGISTER_BUSINESS':
        return {
          title: 'Enregistrer votre Entreprise',
          desc: 'Rejoignez le réseau professionnel certifié Flowexa Bénin sur les 10 modules officiels.',
        };
      case 'FORGOT_PASSWORD':
        return {
          title: 'Mot de passe oublié',
          desc: 'Saisissez votre numéro de téléphone ou votre adresse email pour recevoir un code.',
        };
      case 'RESET_PASSWORD':
        return {
          title: 'Nouveau mot de passe',
          desc: 'Définissez votre nouveau mot de passe sécurisé.',
        };
      default:
        return {
          title: 'Authentification Flowexa',
          desc: 'Plateforme multi-tenant Bénin certifiée.',
        };
    }
  };

  const { title, desc } = getModalTitle();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={desc} size="md">
      <div className="space-y-4">
        {/* Navigation tabs between Login, Register Client, Register Pro */}
        {(mode === 'LOGIN' ||
          mode === 'REGISTER' ||
          mode === 'REGISTER_CLIENT' ||
          mode === 'REGISTER_BUSINESS') && (
          <div className="grid grid-cols-3 gap-1 bg-[#0A1428] p-1 rounded-xl border border-white/5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'LOGIN'
                  ? 'bg-[#FB8205] text-white shadow-md font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Connexion</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER_CLIENT');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'REGISTER_CLIENT' || mode === 'REGISTER'
                  ? 'bg-[#0BE9EF] text-[#020919] shadow-md font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Client</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER_BUSINESS');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'REGISTER_BUSINESS'
                  ? 'bg-white/20 text-white shadow-md font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Entreprise</span>
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <Input
              label="Email ou Téléphone béninois"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              placeholder="ex: 0154100617 ou pro@flowexa.com"
              required
            />

            <div className="relative">
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                placeholder="Votre mot de passe"
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

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-[#020919] border-white/10 text-[#FB8205]"
                />
                <span>Rester connecté</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setMode('FORGOT_PASSWORD');
                  setRecoveryIdentifier(identifier);
                  setErrorMessage(null);
                }}
                className="text-[#0BE9EF] hover:underline cursor-pointer font-medium"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Se connecter à Flowexa
            </Button>

            {/* Quick Demo Switcher */}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#FB8205]" />
                  Comptes Démo Instantanés (Sprint B24)
                </span>
                <span className="text-[10px] text-[#0BE9EF]">Cliquez pour préremplir</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setQuickDemoAccount('CLIENT')}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-all cursor-pointer group"
                >
                  <div className="font-bold text-white group-hover:text-[#0BE9EF] flex items-center gap-1">
                    👤 Client
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">client@flowexa.bj</div>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDemoAccount('BUSINESS_OWNER')}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-all cursor-pointer group"
                >
                  <div className="font-bold text-white group-hover:text-[#FB8205] flex items-center gap-1">
                    🏢 Gérant Pro
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">pro@flowexa.com</div>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDemoAccount('MANAGER')}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-all cursor-pointer group"
                >
                  <div className="font-bold text-white group-hover:text-[#10D97F] flex items-center gap-1">
                    📋 Manager
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">christian.k@immo</div>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDemoAccount('EMPLOYEE')}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-all cursor-pointer group"
                >
                  <div className="font-bold text-white group-hover:text-amber-400 flex items-center gap-1">
                    🛠️ Employé
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">blandine.a@immo</div>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDemoAccount('SUPER_ADMIN')}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-all cursor-pointer group col-span-2 sm:col-span-1"
                >
                  <div className="font-bold text-white group-hover:text-purple-400 flex items-center gap-1">
                    🛡️ Super Admin
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">admin@flowexa.com</div>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 2. REGISTER CLIENT FORM */}
        {(mode === 'REGISTER' || mode === 'REGISTER_CLIENT') && (
          <form onSubmit={handleClientRegisterSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Prénom"
                type="text"
                value={clientFirstName}
                onChange={(e) => setClientFirstName(e.target.value)}
                placeholder="Ex: Bio"
                required
              />
              <Input
                label="Nom de famille"
                type="text"
                value={clientLastName}
                onChange={(e) => setClientLastName(e.target.value)}
                placeholder="Ex: Guerguis"
                required
              />
            </div>

            <Input
              label="Numéro de Téléphone (Bénin)"
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
              placeholder="+229 01 97 00 00 00"
              required
            />

            <Input
              label="Adresse Email (optionnelle)"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              placeholder="votre.email@domaine.bj"
            />

            <Input
              label="Mot de passe sécurisé (min. 6 car.)"
              type="password"
              value={clientPassword}
              onChange={(e) => setClientPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              placeholder="••••••••"
              required
            />

            <label className="flex items-start gap-2.5 text-xs text-gray-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={clientTerms}
                onChange={(e) => setClientTerms(e.target.checked)}
                className="mt-0.5 rounded bg-[#020919] border-white/10 text-[#0BE9EF]"
              />
              <span>
                J'accepte les{' '}
                <span className="text-[#0BE9EF] underline">Conditions Générales d'Utilisation</span>{' '}
                et la politique de confidentialité de Flowexa.
              </span>
            </label>

            <Button type="submit" variant="secondary" className="w-full mt-2" isLoading={isLoading}>
              Créer mon Compte Client
            </Button>
          </form>
        )}

        {/* 3. REGISTER BUSINESS FORM */}
        {mode === 'REGISTER_BUSINESS' && (
          <form onSubmit={handleBusinessRegisterSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <Input
                label="Prénom du responsable"
                type="text"
                value={bizFirstName}
                onChange={(e) => setBizFirstName(e.target.value)}
                placeholder="Ex: Alain"
                required
              />
              <Input
                label="Nom du responsable"
                type="text"
                value={bizLastName}
                onChange={(e) => setBizLastName(e.target.value)}
                placeholder="Ex: Kpodji"
                required
              />
            </div>

            <Input
              label="Nom officiel de l'entreprise"
              type="text"
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
              leftIcon={<Building className="w-4 h-4" />}
              placeholder="Ex: Bénin Prestige Immo"
              required
            />

            <Select
              label="Métier officiel Flowexa (10 Métiers certifiés)"
              value={bizModule}
              onChange={(e) => setBizModule(e.target.value as BusinessModuleCode)}
              options={FLOWEXA_MODULES.map((m) => ({
                value: m.code,
                label: `${m.number} ${m.name} (${m.subtitle})`,
              }))}
            />

            <div className="grid grid-cols-2 gap-2.5">
              <Input
                label="Ville"
                type="text"
                value={bizCity}
                onChange={(e) => setBizCity(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
                placeholder="Ex: Cotonou"
                required
              />
              <Input
                label="Quartier"
                type="text"
                value={bizDistrict}
                onChange={(e) => setBizDistrict(e.target.value)}
                placeholder="Ex: Haie Vive"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Input
                label="Téléphone officiel (WhatsApp)"
                type="tel"
                value={bizPhone}
                onChange={(e) => setBizPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
                placeholder="+229 01 97 00 00 00"
                required
              />
              <Input
                label="Email professionnel"
                type="email"
                value={bizEmail}
                onChange={(e) => setBizEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                placeholder="contact@entreprise.bj"
                required
              />
            </div>

            <Input
              label="Mot de passe principal du compte"
              type="password"
              value={bizPassword}
              onChange={(e) => setBizPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              placeholder="••••••••"
              required
            />

            <label className="flex items-start gap-2.5 text-xs text-gray-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={bizTerms}
                onChange={(e) => setBizTerms(e.target.checked)}
                className="mt-0.5 rounded bg-[#020919] border-white/10 text-[#FB8205]"
              />
              <span>
                J'accepte la{' '}
                <span className="text-[#FB8205] underline">Charte des Professionnels Certifiés</span> et
                les conditions de souscription Flowexa Multi-Tenant.
              </span>
            </label>

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
              Enregistrer mon Entreprise
            </Button>
          </form>
        )}

        {/* 4. FORGOT PASSWORD FORM */}
        {mode === 'FORGOT_PASSWORD' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <Input
              label="Email ou Numéro de Téléphone"
              type="text"
              value={recoveryIdentifier}
              onChange={(e) => setRecoveryIdentifier(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              placeholder="Entrez votre identifiant"
              required
            />

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0BE9EF]" />
                Procédure de récupération sécurisée
              </div>
              <p>
                Un code de vérification à 6 chiffres vous sera instantanément généré pour réinitialiser
                votre accès.
              </p>
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Générer le code de sécurité
            </Button>

            <button
              type="button"
              onClick={() => setMode('LOGIN')}
              className="w-full text-center text-xs text-gray-400 hover:text-white cursor-pointer py-1"
            >
              Retour à la connexion
            </button>
          </form>
        )}

        {/* 5. RESET PASSWORD FORM */}
        {mode === 'RESET_PASSWORD' && (
          <form onSubmit={handleResetSubmit} className="space-y-3.5">
            {generatedCode && (
              <div className="p-3.5 rounded-xl bg-[#10D97F]/10 border border-[#10D97F]/30 text-xs space-y-1">
                <span className="text-gray-400">Code de sécurité généré :</span>
                <div className="text-lg font-mono font-black text-[#10D97F] tracking-widest">
                  {generatedCode}
                </div>
              </div>
            )}

            <Input
              label="Code à 6 chiffres"
              type="text"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              placeholder="Ex: 123456"
              required
            />

            <Input
              label="Nouveau mot de passe"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              placeholder="••••••••"
              required
            />

            <Input
              label="Confirmer le nouveau mot de passe"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              placeholder="••••••••"
              required
            />

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Confirmer le nouveau mot de passe
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
};
