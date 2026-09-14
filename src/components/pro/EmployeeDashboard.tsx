import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  Calendar,
  Clock,
  User,
  Users,
  MessageSquare,
  Bell,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { UserProfile, BusinessTaskItem, FlowexaRequestItem } from '../../types';
import { Card } from '../design-system/Card';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';
import { MessagingCenter } from '../messaging/MessagingCenter';

export interface EmployeeDashboardProps {
  user: UserProfile;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  onOpenAccount?: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  user,
  onShowToast,
  onOpenAccount,
}) => {
  const [activeTab, setActiveTab] = useState<
    'tasks' | 'appointments' | 'bookings' | 'clients' | 'messages' | 'profile'
  >('tasks');

  const [tasks, setTasks] = useState<BusinessTaskItem[]>([]);
  const [requests, setRequests] = useState<FlowexaRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'PENDING' | 'DONE'>('ALL');

  const businessId = user.businessId || 'biz-immo-1';

  // Fetch tasks and assigned requests for this employee
  const fetchEmployeeData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch tasks
      const resTasks = await fetch(`/api/v1/businesses/${businessId}/tasks`, {
        headers: {
          'x-user-role': 'EMPLOYEE',
          'x-user-id': user.id,
          'x-business-id': businessId,
        },
      });
      if (resTasks.ok) {
        const dataTasks = await resTasks.json();
        if (dataTasks.success && Array.isArray(dataTasks.data)) {
          // Filter tasks assigned to this employee if assignedTo is set, or all tasks of business
          const empTasks = dataTasks.data.filter(
            (t: BusinessTaskItem) => !t.assignedTo || t.assignedTo === user.id || t.assignedToName?.includes(user.name)
          );
          setTasks(empTasks.length > 0 ? empTasks : dataTasks.data);
        }
      }

      // Fetch requests assigned or relevant to employee
      const resReq = await fetch(`/api/v1/requests?business_id=${businessId}&assigned_employee_id=${user.id}`, {
        headers: {
          'x-user-role': 'EMPLOYEE',
          'x-user-id': user.id,
          'x-business-id': businessId,
        },
      });
      if (resReq.ok) {
        const dataReq = await resReq.json();
        if (dataReq.success && Array.isArray(dataReq.data)) {
          setRequests(dataReq.data);
        }
      }
    } catch (err) {
      console.error('Erreur chargement espace employé:', err);
    } finally {
      setIsLoading(false);
    }
  }, [businessId, user.id, user.name]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  // Toggle task status
  const handleToggleTaskStatus = async (task: BusinessTaskItem) => {
    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    try {
      const res = await fetch(`/api/v1/businesses/${businessId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'EMPLOYEE',
          'x-user-id': user.id,
          'x-business-id': businessId,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
        );
        onShowToast(
          'Tâche mise à jour',
          `Statut : ${newStatus === 'DONE' ? 'Terminée' : 'À faire'}`,
          'success'
        );
      }
    } catch {
      onShowToast('Erreur', 'Impossible de mettre à jour la tâche.', 'error');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'PENDING') return t.status !== 'DONE';
    if (taskFilter === 'DONE') return t.status === 'DONE';
    return true;
  });

  const appointmentsList = requests.filter(
    (r) => r.interactionType === 'VISITE_RDV' || r.interactionType === 'DEVIS'
  );

  const bookingsList = requests.filter(
    (r) => r.interactionType === 'RESERVATION_SEJOUR'
  );

  return (
    <div className="w-full flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Contextuel Espace Employé */}
      <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="orange" dot>
              Espace Collaborateur & Opérations
            </Badge>
            <span className="text-xs text-gray-400">
              Établissement : <strong className="text-white">{user.businessName || user.tenantName}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Bonjour, {user.name}</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
              Rôle : Employé Terrain & Suivi
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Retrouvez vos missions, rendez-vous clients et tâches opérationnelles du jour.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchEmployeeData}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            className="border-white/10"
          >
            Actualiser
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={onOpenAccount}
            leftIcon={<User className="w-3.5 h-3.5" />}
          >
            Mon Profil
          </Button>
        </div>
      </div>

      {/* Navigation tabs spécifiques à l'employé */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-white/10 pb-3 mb-6">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-[#FB8205] text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Mes Tâches</span>
          {tasks.filter((t) => t.status !== 'DONE').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white text-[#FB8205] font-extrabold">
              {tasks.filter((t) => t.status !== 'DONE').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'appointments'
              ? 'bg-[#FB8205] text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Mes Rendez-vous</span>
          {appointmentsList.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-400 text-black font-extrabold">
              {appointmentsList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'bookings'
              ? 'bg-[#FB8205] text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Mes Réservations</span>
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'clients'
              ? 'bg-[#FB8205] text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Mes Contacts Clients</span>
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'messages'
              ? 'bg-[#FB8205] text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Messagerie Directe</span>
        </button>
      </div>

      {/* SECTION 1 : MES TÂCHES */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">Missions & Tâches assignées</h2>
              <p className="text-xs text-gray-400">
                Cochez vos tâches au fur et à mesure de leur réalisation.
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0A1428] border border-white/10 rounded-xl p-1 text-xs">
              <button
                onClick={() => setTaskFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition ${
                  taskFilter === 'ALL' ? 'bg-[#FB8205] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Toutes ({tasks.length})
              </button>
              <button
                onClick={() => setTaskFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition ${
                  taskFilter === 'PENDING' ? 'bg-[#FB8205] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                En cours ({tasks.filter((t) => t.status !== 'DONE').length})
              </button>
              <button
                onClick={() => setTaskFilter('DONE')}
                className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition ${
                  taskFilter === 'DONE' ? 'bg-[#FB8205] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Terminées ({tasks.filter((t) => t.status === 'DONE').length})
              </button>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">Aucune tâche en attente</h3>
              <p className="text-xs text-gray-400">Toutes vos missions sont à jour pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-[#0A1428] border rounded-xl p-4 flex items-start justify-between gap-3 transition-all ${
                    task.status === 'DONE'
                      ? 'border-emerald-500/20 bg-emerald-950/10 opacity-75'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => handleToggleTaskStatus(task)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 cursor-pointer transition ${
                        task.status === 'DONE'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-white/30 hover:border-[#FB8205]'
                      }`}
                    >
                      {task.status === 'DONE' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                      <h4
                        className={`text-sm font-bold ${
                          task.status === 'DONE' ? 'line-through text-gray-400' : 'text-white'
                        }`}
                      >
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-gray-400 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            Échéance : {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        {task.priority && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              task.priority === 'HIGH' || task.priority === 'URGENT'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-white/10 text-gray-300'
                            }`}
                          >
                            {task.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={task.status === 'DONE' ? 'outline' : 'primary'}
                    onClick={() => handleToggleTaskStatus(task)}
                    className="text-xs py-1 h-auto"
                  >
                    {task.status === 'DONE' ? 'Rouvrir' : 'Terminer'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2 : MES RENDEZ-VOUS */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">Rendez-vous & Visites Assignés</h2>
            <p className="text-xs text-gray-400">
              Planning des visites et entretiens clients sous votre responsabilité.
            </p>
          </div>

          {appointmentsList.length === 0 ? (
            <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-10 text-center">
              <Calendar className="w-10 h-10 text-gray-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">Aucun rendez-vous assigné</h3>
              <p className="text-xs text-gray-400">Les nouvelles visites apparaîtront ici.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointmentsList.map((app) => (
                <div
                  key={app.id}
                  className="bg-[#0A1428] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FB8205]/10 border border-[#FB8205]/20 text-[#FB8205] flex items-center justify-center font-bold shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white">
                          {app.metadata?.desired_date || 'Date à confirmer'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-gray-300">
                          {app.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        {app.metadata?.item_title || 'Prestation / Visite'}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Client : <strong className="text-white">{app.clientName}</strong> • {app.clientPhone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {app.clientPhone && (
                      <a
                        href={`tel:${app.clientPhone}`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Appeler</span>
                      </a>
                    )}
                    <button
                      onClick={() => setActiveTab('messages')}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3 : MES RÉSERVATIONS */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">Réservations d'Hébergement & Séjours</h2>
            <p className="text-xs text-gray-400">
              Check-in, check-out et accueil des clients pour les chambres et villas.
            </p>
          </div>

          {bookingsList.length === 0 ? (
            <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-10 text-center">
              <Clock className="w-10 h-10 text-gray-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">Aucune réservation en cours</h3>
              <p className="text-xs text-gray-400">Vos réservations attribuées s'afficheront ici.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookingsList.map((b) => (
                <div
                  key={b.id}
                  className="bg-[#0A1428] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white">{b.metadata?.item_title || 'Hébergement'}</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Client : <strong className="text-white">{b.clientName}</strong> • {b.clientPhone}
                    </p>
                  </div>
                  <Badge variant="cyan">{b.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4 : MES CONTACTS CLIENTS */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">Contacts Clients Directs</h2>
            <p className="text-xs text-gray-400">
              Coordonnées des clients suivis dans le cadre de vos missions actives.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {requests.map((r) => (
              <div key={r.id} className="bg-[#0A1428] border border-white/10 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white text-xs">
                    {r.clientName ? r.clientName.substring(0, 2).toUpperCase() : 'CL'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{r.clientName}</h4>
                    <span className="text-[10px] text-gray-400">{r.clientPhone}</span>
                  </div>
                </div>
                <div className="text-[11px] text-gray-300 bg-[#020919] p-2 rounded-lg truncate">
                  Mission : {r.metadata?.item_title || r.interactionType}
                </div>
                {r.clientPhone && (
                  <a
                    href={`tel:${r.clientPhone}`}
                    className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-center block text-white transition"
                  >
                    Appeler {r.clientPhone}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5 : MESSAGERIE */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div className="mb-2">
            <h2 className="text-xl font-bold text-white">Messagerie Collaborateur</h2>
            <p className="text-xs text-gray-400">
              Échangez avec les clients et les responsables d'équipe en direct.
            </p>
          </div>
          <MessagingCenter
            userRole="EMPLOYEE"
            userId={user.id}
            businessId={businessId}
            onShowToast={onShowToast}
          />
        </div>
      )}
    </div>
  );
};
