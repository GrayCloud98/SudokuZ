import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type Status = 'todo' | 'in_progress' | 'done' | 'parked';

type RoadmapItem = {
  id: string;
  title: string;
  description: string | null;
  phase: string | null;
  status: Status;
  created_at: string;
};

type PhaseGroup = {
  phase: string;
  items: RoadmapItem[];
};

const STATUS_COLORS: Record<Status, string> = {
  todo: '#444',
  in_progress: '#b45309',
  done: '#166534',
  parked: '#5b21b6',
};

const STATUS_BG: Record<Status, string> = {
  todo: '#1a1a1a',
  in_progress: '#451a03',
  done: '#052e16',
  parked: '#2e1065',
};

const STATUS_NEXT: Record<Status, Status> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'parked',
  parked: 'todo',
};

const STATUS_LABELS: Record<Status, string> = {
  todo: 'todo',
  in_progress: 'in progress',
  done: 'done',
  parked: 'parked',
};

const STATUS_FILTERS: { label: string; value: Status | 'all' }[] = [
  { label: 'all', value: 'all' },
  { label: 'todo', value: 'todo' },
  { label: 'in progress', value: 'in_progress' },
  { label: 'done', value: 'done' },
  { label: 'parked', value: 'parked' },
];

export default function AdminScreen() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [addingToPhase, setAddingToPhase] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [addingNewPhase, setAddingNewPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');

  useEffect(() => {
    if (!isAdmin) router.replace('/(game)');
  }, [isAdmin]);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const { data, error } = await supabase
      .from('roadmap_items')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('failed to fetch roadmap items:', error.message);
      return;
    }
    setItems(data);
    setIsLoading(false);
  }

  function togglePhase(phase: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedPhases((prev) => ({ ...prev, [phase]: !(prev[phase] ?? true) }));
  }

  function toggleExpand(id: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItem((prev) => (prev === id ? null : id));
    setEditingItem(null);
  }

  function startEdit(item: RoadmapItem) {
    setEditingItem(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description ?? '');
  }

  async function saveEdit(item: RoadmapItem) {
    const { error } = await supabase
      .from('roadmap_items')
      .update({
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      })
      .eq('id', item.id);
    if (error) {
      console.error('failed to save edit:', error.message);
      return;
    }
    setEditingItem(null);
    fetchItems();
  }

  async function cycleStatus(item: RoadmapItem) {
    const { error } = await supabase
      .from('roadmap_items')
      .update({ status: STATUS_NEXT[item.status] })
      .eq('id', item.id);
    if (error) {
      console.error('failed to cycle status:', error.message);
      return;
    }
    fetchItems();
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from('roadmap_items').delete().eq('id', id);
    if (error) {
      console.error('failed to delete item:', error.message);
      return;
    }
    fetchItems();
  }

  async function addItem(phase: string) {
    if (!newTitle.trim()) return;
    const { error } = await supabase.from('roadmap_items').insert({
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      phase,
      status: 'todo',
    });
    if (error) {
      console.error('failed to add item:', error.message);
      return;
    }
    setNewTitle('');
    setNewDescription('');
    setAddingToPhase(null);
    fetchItems();
  }

  function getFilteredItems(phaseItems: RoadmapItem[]) {
    if (statusFilter === 'all') return phaseItems;
    return phaseItems.filter((i) => i.status === statusFilter);
  }

  function groupByPhase(): PhaseGroup[] {
    const phases = [...new Set(items.map((i) => i.phase ?? 'uncategorized'))];
    return phases.map((phase) => ({
      phase,
      items: items.filter((i) => (i.phase ?? 'uncategorized') === phase),
    }));
  }

  function phaseProgress(phaseItems: RoadmapItem[]) {
    const done = phaseItems.filter((i) => i.status === 'done').length;
    return { done, total: phaseItems.length };
  }

  if (!isAdmin) return null;

  const groups = groupByPhase();
  const filteredGroups =
    phaseFilter === 'all' ? groups : groups.filter((g) => g.phase === phaseFilter);

  return (
    <View style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>admin</Text>
      </View>

      {/* filters */}
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterChip, statusFilter === f.value && styles.filterChipActive]}
              onPress={() => setStatusFilter(f.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === f.value && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, phaseFilter === 'all' && styles.filterChipActive]}
            onPress={() => setPhaseFilter('all')}
          >
            <Text
              style={[styles.filterChipText, phaseFilter === 'all' && styles.filterChipTextActive]}
            >
              all phases
            </Text>
          </TouchableOpacity>
          {groups.map(({ phase }) => (
            <TouchableOpacity
              key={phase}
              style={[styles.filterChip, phaseFilter === phase && styles.filterChipActive]}
              onPress={() => setPhaseFilter(phase)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  phaseFilter === phase && styles.filterChipTextActive,
                ]}
              >
                {phase}
              </Text>
            </TouchableOpacity>
          ))}
          {/* new phase */}
          {addingNewPhase ? (
            <View style={[styles.phaseGroup, { padding: 16, gap: 8 }]}>
              <TextInput
                style={styles.editInput}
                value={newPhaseName}
                onChangeText={setNewPhaseName}
                placeholder="phase name"
                placeholderTextColor="#555"
                autoFocus
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => {
                    if (!newPhaseName.trim()) return;
                    setAddingToPhase(newPhaseName.trim());
                    setAddingNewPhase(false);
                    setNewPhaseName('');
                  }}
                >
                  <Text style={styles.saveButtonText}>create phase</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setAddingNewPhase(false)}>
                  <Text style={styles.cancelText}>cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.newPhaseButton} onPress={() => setAddingNewPhase(true)}>
              <Text style={styles.newPhaseButtonText}>+ new phase</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {isLoading ? (
        <Text style={styles.loading}>loading...</Text>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {filteredGroups.map(({ phase, items: phaseItems }) => {
            const { done, total } = phaseProgress(phaseItems);
            const filtered = getFilteredItems(phaseItems);
            const isCollapsed = collapsedPhases[phase] ?? true;
            const progress = total > 0 ? done / total : 0;

            return (
              <View key={phase} style={styles.phaseGroup}>
                {/* phase header */}
                <TouchableOpacity style={styles.phaseHeader} onPress={() => togglePhase(phase)}>
                  <View style={styles.phaseHeaderLeft}>
                    <Text style={styles.phaseTitle}>{phase}</Text>
                    <Text style={styles.phaseCount}>
                      {done}/{total}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>{isCollapsed ? '↓' : '↑'}</Text>
                </TouchableOpacity>

                {/* progress bar */}
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>

                {/* items */}
                {!isCollapsed && (
                  <View style={styles.phaseItems}>
                    {filtered.length === 0 && (
                      <Text style={styles.empty}>no items match this filter</Text>
                    )}
                    {filtered.map((item) => {
                      const isExpanded = expandedItem === item.id;
                      const isEditing = editingItem === item.id;
                      return (
                        <View key={item.id} style={styles.item}>
                          <View style={styles.itemRow}>
                            <TouchableOpacity
                              style={[
                                styles.statusBadge,
                                { backgroundColor: STATUS_BG[item.status] },
                              ]}
                              onPress={() => cycleStatus(item)}
                            >
                              <Text
                                style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}
                              >
                                {STATUS_LABELS[item.status]}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.itemTitleRow}
                              onPress={() => toggleExpand(item.id)}
                            >
                              <Text
                                style={[
                                  styles.itemTitle,
                                  item.status === 'done' && styles.itemTitleDone,
                                ]}
                                numberOfLines={isExpanded ? undefined : 1}
                              >
                                {item.title}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {isExpanded && (
                            <View style={styles.itemExpanded}>
                              {isEditing ? (
                                <View style={styles.editForm}>
                                  <TextInput
                                    style={styles.editInput}
                                    value={editTitle}
                                    onChangeText={setEditTitle}
                                    placeholder="title"
                                    placeholderTextColor="#555"
                                  />
                                  <TextInput
                                    style={styles.editInput}
                                    value={editDescription}
                                    onChangeText={setEditDescription}
                                    placeholder="description (optional)"
                                    placeholderTextColor="#555"
                                    multiline
                                  />
                                  <View style={styles.editActions}>
                                    <TouchableOpacity
                                      style={styles.saveButton}
                                      onPress={() => saveEdit(item)}
                                    >
                                      <Text style={styles.saveButtonText}>save</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setEditingItem(null)}>
                                      <Text style={styles.cancelText}>cancel</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              ) : (
                                <View>
                                  {item.description && (
                                    <Text style={styles.itemDescription}>{item.description}</Text>
                                  )}
                                  <View style={styles.itemActions}>
                                    <TouchableOpacity onPress={() => startEdit(item)}>
                                      <Text style={styles.actionText}>edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => deleteItem(item.id)}>
                                      <Text style={styles.deleteText}>delete</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })}

                    {/* add item form */}
                    {addingToPhase === phase ? (
                      <View style={styles.addForm}>
                        <TextInput
                          style={styles.editInput}
                          value={newTitle}
                          onChangeText={setNewTitle}
                          placeholder="title"
                          placeholderTextColor="#555"
                          autoFocus
                        />
                        <TextInput
                          style={styles.editInput}
                          value={newDescription}
                          onChangeText={setNewDescription}
                          placeholder="description (optional)"
                          placeholderTextColor="#555"
                        />
                        <View style={styles.editActions}>
                          <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => addItem(phase)}
                          >
                            <Text style={styles.saveButtonText}>add</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setAddingToPhase(null)}>
                            <Text style={styles.cancelText}>cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setAddingToPhase(phase)}
                      >
                        <Text style={styles.addButtonText}>+ add item</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  back: {
    fontSize: 14,
    color: '#4a9eff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  filters: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#4a9eff',
    borderColor: '#4a9eff',
  },
  filterChipText: {
    color: '#888',
    fontSize: 13,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  loading: {
    color: '#555',
    textAlign: 'center',
    marginTop: 40,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  phaseGroup: {
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  phaseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  phaseTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  phaseCount: {
    color: '#555',
    fontSize: 13,
  },
  chevron: {
    color: '#555',
    fontSize: 20,
  },
  progressBar: {
    height: 2,
    backgroundColor: '#2a2a2a',
  },
  progressFill: {
    height: 2,
    backgroundColor: '#166534',
  },
  phaseItems: {
    padding: 12,
    gap: 6,
  },
  empty: {
    color: '#444',
    fontSize: 13,
    paddingVertical: 8,
    textAlign: 'center',
  },
  item: {
    backgroundColor: '#222',
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  itemTitleRow: {
    flex: 1,
  },
  itemTitle: {
    color: '#ccc',
    fontSize: 14,
  },
  itemTitleDone: {
    textDecorationLine: 'line-through',
    color: '#555',
  },
  itemExpanded: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  itemDescription: {
    color: '#666',
    fontSize: 13,
    marginBottom: 10,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionText: {
    color: '#4a9eff',
    fontSize: 13,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 13,
  },
  editForm: {
    gap: 8,
  },
  addForm: {
    gap: 8,
    marginTop: 6,
  },
  editInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  saveButton: {
    backgroundColor: '#4a9eff',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  cancelText: {
    color: '#555',
    fontSize: 13,
  },
  addButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#333',
    fontSize: 13,
  },
  newPhaseButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  newPhaseButtonText: {
    color: '#333',
    fontSize: 14,
  },
});
