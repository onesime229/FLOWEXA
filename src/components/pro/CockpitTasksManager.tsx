import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, Clock, Check, AlertCircle } from 'lucide-react';
import { Button } from '../design-system/Button';
import { flowexaApi } from '../../services/api';
import type { BusinessTask } from '../../types';

interface CockpitTasksManagerProps {
  businessId: string;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const CockpitTasksManager: React.FC<CockpitTasksManagerProps> = ({
  businessId,
  onShowToast,
}) => {
  const [tasks, setTasks] = useState<BusinessTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('12:00');
  const [newPriority, setNewPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [isAdding, setIsAdding] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await flowexaApi.getBusinessTasks(businessId);
      if (res.success && Array.isArray(res.data)) {
        setTasks(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [businessId]);

  const handleToggleTask = async (task: BusinessTask) => {
    const nextDone = !task.done;
    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, done: nextDone } : t)));
    try {
      await flowexaApi.updateBusinessTask(businessId, task.id, { done: nextDone });
      onShowToast('Tâche mise à jour', nextDone ? 'Tâche marquée comme terminée !' : 'Tâche réactivée.', 'info');
    } catch (e) {
      console.error(e);
      fetchTasks();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await flowexaApi.addBusinessTask(businessId, {
        title: newTitle.trim(),
        dueTime: newTime,
        priority: newPriority,
      });

      if (res.success && res.data) {
        setTasks([...tasks, res.data]);
        setNewTitle('');
        setIsAdding(false);
        onShowToast('Tâche créée', 'Nouvelle tâche ajoutée à votre liste du jour.', 'success');
      }
    } catch (e) {
      console.error(e);
      onShowToast('Erreur', 'Impossible de créer la tâche.', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await flowexaApi.deleteBusinessTask(businessId, taskId);
      setTasks(tasks.filter((t) => t.id !== taskId));
      onShowToast('Tâche supprimée', 'Tâche retirée de la liste.', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  const completedCount = tasks.filter((t) => t.done).length;

  return (
    <div className="bg-[#0A1428] border border-white/5 rounded-2xl p-6 space-y-4 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Tâches Opérationnelles</span>
            <span className="text-xs text-[#FB8205] font-semibold">
              ({completedCount}/{tasks.length})
            </span>
          </h3>
          <p className="text-xs text-gray-400">Suivi des actions journalières de l'équipe</p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-[#FB8205]" />
          <span>Ajouter</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreateTask} className="p-3 bg-[#020919] rounded-xl border border-white/10 space-y-2">
          <input
            type="text"
            placeholder="Libellé de la tâche..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8205]"
            autoFocus
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                aria-label="Priorité de la tâche"
                className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white"
              >
                <option value="LOW">Normale</option>
                <option value="MEDIUM">Importante</option>
                <option value="HIGH">Urgente</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1 text-xs text-gray-400 hover:text-white"
              >
                Annuler
              </button>
              <Button size="sm" variant="primary" type="submit" className="text-xs">
                Enregistrer
              </Button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-6 text-center text-xs text-gray-500">Chargement des tâches...</div>
      ) : tasks.length === 0 ? (
        <div className="py-6 text-center text-xs text-gray-500">
          Aucune tâche en cours. Utilisez le bouton "Ajouter" pour créer une action.
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 group ${
                task.done
                  ? 'bg-white/[0.02] border-white/5 text-gray-500 line-through'
                  : 'bg-[#020919] border-white/10 text-white hover:border-[#FB8205]/40'
              }`}
            >
              <div
                className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
                onClick={() => handleToggleTask(task)}
              >
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => {}}
                  className="mt-0.5 rounded bg-[#020919] border-white/20 text-[#FB8205] focus:ring-[#FB8205]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug break-words">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {task.dueTime && (
                      <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {task.dueTime}
                      </span>
                    )}
                    {task.priority === 'HIGH' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-bold">
                        Urgent
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDeleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-gray-500 hover:text-red-400 transition-opacity"
                title="Supprimer la tâche"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
