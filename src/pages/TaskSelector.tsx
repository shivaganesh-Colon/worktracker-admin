// src/components/TaskSelector.tsx
// Multi-select task picker for creating programs/offers
import React, { useEffect, useState } from 'react';
import { COLORS } from '../theme/colours';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';
const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

interface Task {
  id: string;
  title: string;
  category: string;
  basePoints: number;
  bonusPoints: number;
  iconName: string | null;
  iconColor: string | null;
  difficulty: string;
  estimatedMinutes: number | null;
}

interface TaskSelectorProps {
  selectedTaskIds: string[];
  onChange: (taskIds: string[]) => void;
}

const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string }> = {
  cleaning:   { emoji: '✨', color: '#10B981', bg: '#D1FAE5' },
  cooking:    { emoji: '🍳', color: '#F59E0B', bg: '#FEF3C7' },
  organizing: { emoji: '📦', color: '#6366F1', bg: '#EEF2FF' },
  laundry:    { emoji: '👕', color: '#3B82F6', bg: '#DBEAFE' },
  other:      { emoji: '🏠', color: '#8B5CF6', bg: '#F3E8FF' },
};

export const TaskSelector: React.FC<TaskSelectorProps> = ({ selectedTaskIds, onChange }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [byCategory, setByCategory] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['cleaning']));

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await api.get('/admin/tasks/for-offers');
      setTasks(res.data.tasks);
      setByCategory(res.data.byCategory);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (taskId: string) => {
    if (selectedTaskIds.includes(taskId)) {
      onChange(selectedTaskIds.filter(id => id !== taskId));
    } else {
      onChange([...selectedTaskIds, taskId]);
    }
  };

  const toggleCategory = (category: string) => {
    const categoryTasks = byCategory[category] || [];
    const categoryTaskIds = categoryTasks.map(t => t.id);
    const allSelected = categoryTaskIds.every(id => selectedTaskIds.includes(id));

    if (allSelected) {
      // Deselect all in category
      onChange(selectedTaskIds.filter(id => !categoryTaskIds.includes(id)));
    } else {
      // Select all in category
      const combined = [...selectedTaskIds, ...categoryTaskIds];
      const unique = Array.from(new Set(combined)); // Convert Set to Array
      onChange(unique);
    }
  };

  const toggleExpand = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  if (loading) {
    return <div style={s.loading}>Loading tasks...</div>;
  }

  const categories = Object.keys(byCategory);
  const selectedCount = selectedTaskIds.length;

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <h3 style={s.title}>Select Tasks for This Program</h3>
        <div style={s.selectedBadge}>
          {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected
        </div>
      </div>

      {/* Info */}
      <div style={s.infoBox}>
        💡 <strong>Tip:</strong> Click categories to select/deselect all tasks in that category
      </div>

      {/* Categories */}
      {categories.map(category => {
        const categoryTasks = byCategory[category] || [];
        const catMeta = CATEGORY_META[category] || CATEGORY_META.other;
        const isExpanded = expandedCategories.has(category);
        const selectedInCategory = categoryTasks.filter(t => selectedTaskIds.includes(t.id)).length;
        const allSelected = selectedInCategory === categoryTasks.length && categoryTasks.length > 0;

        return (
          <div key={category} style={s.categoryBlock}>
            {/* Category Header */}
            <div style={s.categoryHeader}>
              <div style={s.categoryLeft}>
                <button
                  style={s.expandBtn}
                  onClick={() => toggleExpand(category)}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
                <div
                  style={{
                    ...s.categoryIcon,
                    background: catMeta.bg,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{catMeta.emoji}</span>
                </div>
                <div>
                  <div style={s.categoryName}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </div>
                  <div style={s.categoryMeta}>
                    {categoryTasks.length} tasks · {selectedInCategory} selected
                  </div>
                </div>
              </div>
              <button
                style={{
                  ...s.selectAllBtn,
                  ...(allSelected && s.selectAllBtnActive),
                }}
                onClick={() => toggleCategory(category)}
              >
                {allSelected ? '✓ Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Tasks List */}
            {isExpanded && (
              <div style={s.tasksList}>
                {categoryTasks.map(task => {
                  const isSelected = selectedTaskIds.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      style={{
                        ...s.taskItem,
                        ...(isSelected && s.taskItemSelected),
                      }}
                      onClick={() => toggleTask(task.id)}
                    >
                      <div style={s.checkboxContainer}>
                        <div
                          style={{
                            ...s.checkbox,
                            ...(isSelected && s.checkboxChecked),
                          }}
                        >
                          {isSelected && <span style={{ fontSize: 10 }}>✓</span>}
                        </div>
                      </div>
                      <div style={s.taskContent}>
                        <div style={s.taskTitle}>{task.title}</div>
                        <div style={s.taskMeta}>
                          {task.basePoints} pts · {task.difficulty} · ~{task.estimatedMinutes || '—'} min
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Selected Summary */}
      {selectedCount > 0 && (
        <div style={s.summary}>
          <div style={s.summaryTitle}>Selected Tasks ({selectedCount}):</div>
          <div style={s.selectedList}>
            {selectedTaskIds.map(id => {
              const task = tasks.find(t => t.id === id);
              if (!task) return null;
              const catMeta = CATEGORY_META[task.category] || CATEGORY_META.other;
              return (
                <div key={id} style={s.selectedChip}>
                  <span>{catMeta.emoji} {task.title}</span>
                  <button
                    style={s.removeBtn}
                    onClick={() => toggleTask(id)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
          <button
            style={s.clearBtn}
            onClick={() => onChange([])}
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

const s: any = {
  container: {
    border: `2px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 20,
    background: '#fff',
  },
  loading: { textAlign: 'center', padding: 40, color: COLORS.textSecondary },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 700, color: COLORS.text, margin: 0 },
  selectedBadge: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
  },
  infoBox: {
    background: COLORS.primaryLight,
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 16,
  },
  categoryBlock: { marginBottom: 12, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' },
  categoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    background: COLORS.background,
    cursor: 'pointer',
  },
  categoryLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  expandBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    color: COLORS.textSecondary,
    padding: '4px 8px',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: { fontSize: 15, fontWeight: 600, color: COLORS.text, textTransform: 'capitalize' },
  categoryMeta: { fontSize: 12, color: COLORS.textLight },
  selectAllBtn: {
    padding: '6px 14px',
    background: '#fff',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.text,
  },
  selectAllBtnActive: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tasksList: { padding: 12, background: '#fff' },
  taskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 6,
    cursor: 'pointer',
    marginBottom: 6,
    transition: 'background 0.15s',
    border: `1px solid transparent`,
  },
  taskItemSelected: {
    background: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  checkboxContainer: { flexShrink: 0 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    border: `2px solid ${COLORS.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  checkboxChecked: {
    background: COLORS.primary,
    borderColor: COLORS.primary,
  },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: 500, color: COLORS.text },
  taskMeta: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  summary: {
    marginTop: 20,
    padding: 16,
    background: COLORS.background,
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
  },
  summaryTitle: { fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 10 },
  selectedList: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  selectedChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#fff',
    padding: '4px 8px 4px 10px',
    borderRadius: 20,
    fontSize: 12,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    color: COLORS.textSecondary,
    padding: 0,
    width: 16,
    height: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    padding: '6px 14px',
    background: COLORS.errorLight,
    color: COLORS.error,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
};