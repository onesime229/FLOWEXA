import React from 'react';
import { ShieldAlert, ArrowLeft, LogIn, Home } from 'lucide-react';
import { Button } from '../design-system/Button';
import { UserProfile, RoleType } from '../../types';

export interface ForbiddenAccessViewProps {
  user: UserProfile | null;
  targetSpaceName?: string;
  onReturnToAllowedSpace: () => void;
  onOpenAuth?: () => void;
}

export const ForbiddenAccessView: React.FC<ForbiddenAccessViewProps> = ({
  user,
  targetSpaceName = 'cet espace',
  onReturnToAllowedSpace,
  onOpenAuth,
}) => {
  const getRoleLabel = (role?: RoleType) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Administrateur';
      case 'BUSINESS_OWNER':
        return 'Gérant d’Entreprise (Business Owner)';
      case 'MANAGER':
        return 'Manager Opérationnel';
      case 'EMPLOYEE':
        return 'Employé';
      case 'CLIENT':
        return 'Client';
      default:
        return 'Visiteur invité (Non connecté)';
    }
  };

  const getAllowedSpaceName = (role?: RoleType) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Console Super Admin';
      case 'BUSINESS_OWNER':
      case 'MANAGER':
        return 'Espace Entreprise';
      case 'EMPLOYEE':
        return 'Espace Employé';
      case 'CLIENT':
      default:
        return 'Espace Client';
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 min-h-[70vh]">
      <div className="max-w-md w-full bg-[#0A1428] border border-white/10 rounded-2xl p-6 sm:p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-5 shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold mb-3 border border-rose-500/20">
          <span>Erreur 403</span>
          <span>•</span>
          <span>Accès Refusé</span>
        </div>

        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
          Permissions insuffisantes
        </h1>

        <p className="text-gray-300 text-sm mb-4 leading-relaxed">
          Vous tentez d'accéder à <strong className="text-white">{targetSpaceName}</strong>, mais vos droits actuels ne vous y autorisent pas.
        </p>

        <div className="bg-[#020919] border border-white/5 rounded-xl p-3.5 mb-6 text-left text-xs">
          <div className="text-gray-400 mb-1">Profil actif :</div>
          <div className="text-white font-bold flex items-center justify-between">
            <span>{user ? user.name : 'Visiteur non identifié'}</span>
            <span className="text-[#FB8205] font-mono text-[11px] uppercase">
              {getRoleLabel(user?.role)}
            </span>
          </div>
          {user?.tenantName && (
            <div className="text-gray-500 text-[11px] mt-1 truncate">
              Organisation : {user.tenantName}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Home className="w-4 h-4" />}
            onClick={onReturnToAllowedSpace}
            className="w-full justify-center"
          >
            Retourner à mon espace ({getAllowedSpaceName(user?.role)})
          </Button>

          {onOpenAuth && (
            <Button
              variant="outline"
              size="md"
              leftIcon={<LogIn className="w-4 h-4" />}
              onClick={onOpenAuth}
              className="w-full justify-center border-white/10"
            >
              Changer de compte
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
