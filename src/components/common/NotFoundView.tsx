import React from 'react';
import { HelpCircle, Home } from 'lucide-react';
import { Button } from '../design-system/Button';
import { UserProfile, RoleType } from '../../types';

export interface NotFoundViewProps {
  user: UserProfile | null;
  onReturnToAllowedSpace: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({
  user,
  onReturnToAllowedSpace,
}) => {
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
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-5 shadow-lg shadow-amber-500/10">
          <HelpCircle className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold mb-3 border border-amber-500/20">
          <span>Erreur 404</span>
          <span>•</span>
          <span>Page Introuvable</span>
        </div>

        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
          Page non trouvée
        </h1>

        <p className="text-gray-300 text-sm mb-6 leading-relaxed">
          L'adresse demandée n'existe pas ou a été déplacée. Veuillez retourner à votre espace de travail.
        </p>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Home className="w-4 h-4" />}
          onClick={onReturnToAllowedSpace}
          className="w-full justify-center"
        >
          Retourner à mon espace ({getAllowedSpaceName(user?.role)})
        </Button>
      </div>
    </div>
  );
};
