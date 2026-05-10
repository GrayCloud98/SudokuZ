import { useEffect, useMemo, useState } from 'react';
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
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
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
  sort_order: number;
  created_at: string;
};

type PhaseGroup = {
  phase: string;
  phaseNumber: number;
  phaseSuffix: string;
  items: RoadmapItem[];
};

const STATUS_COLORS: Record<Status, string> = {
  todo: '#888',
  in_progress: '#f59e0b',
  done: '#22c55e',
  parked: '#a78bfa',
};

const STATUS_BG: Record<Status, string> = {
  todo: 'rgba(136, 136, 136, 0.10)',
  in_progress: 'rgba(245, 158, 11, 0.10)',
  done: 'rgba(34, 197, 94, 0.10)',
  parked: 'rgba(167, 139, 250, 0.10)',
};

const STATUS_BORDER: Record<Status, string> = {
  todo: 'rgba(136, 136, 136, 0.22)',
  in_progress: 'rgba(245, 158, 11, 0.28)',
  done: 'rgba(34, 197, 94, 0.28)',
  parked: 'rgba(167, 139, 250, 0.28)',
};

const STATUS_LABELS: Record<Status, string> = {
  todo: 'todo',
  in_progress: 'in progress',
  done: 'done',
  parked: 'parked',
};

const STATUS_FILTERS: { label: string; value: Status | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'todo', value: 'todo' },
  { label: 'in progress', value: 'in_progress' },
  { label: 'done', value: 'done' },
  { label: 'parked', value: 'parked' },
];

function normalizePhase(phase: string | null) {
  return phase?.trim() || 'uncategorized';
}

function parsePhase(phase: string) {
  const normalized = normalizePhase(phase);
  const match = normalized.match(/^Phase\s+(\d+)\s*-\s*(.+)$/i);

  if (!match) {
    return {
      phase: normalized,
      phaseNumber: Number.MAX_SAFE_INTEGER,
      phaseSuffix: normalized,
      isNumbered: false,
    };
  }

  return {
    phase: `Phase ${Number(match[1])} - ${match[2].trim()}`,
    phaseNumber: Number(match[1]),
    phaseSuffix: match[2].trim(),
    isNumbered: true,
  };
}

function buildPhaseName(phaseNumber: number, suffix: string) {
  return `Phase ${phaseNumber} - ${suffix.trim()}`;
}

function sortItemsInPhase(items: RoadmapItem[]) {
  return [...items].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.created_at.localeCompare(b.created_at);
  });
}

function groupItemsByPhase(items: RoadmapItem[]) {
  const map = new Map<string, RoadmapItem[]>();

  for (const item of items) {
    const phase = normalizePhase(item.phase);
    const current = map.get(phase) ?? [];
    current.push(item);
    map.set(phase, current);
  }

  return [...map.entries()]
    .map(([phase, phaseItems]) => {
      const parsed = parsePhase(phase);

      return {
        phase: parsed.phase,
        phaseNumber: parsed.phaseNumber,
        phaseSuffix: parsed.phaseSuffix,
        items: sortItemsInPhase(phaseItems),
      };
    })
    .sort((a, b) => {
      if (a.phaseNumber !== b.phaseNumber) return a.phaseNumber - b.phaseNumber;
      return a.phase.localeCompare(b.phase);
    });
}

function getNextPhaseNumber(groups: PhaseGroup[]) {
  const numbered = groups
    .map((group) => group.phaseNumber)
    .filter((num) => Number.isFinite(num) && num !== Number.MAX_SAFE_INTEGER);

  if (numbered.length === 0) return 0;
  return Math.max(...numbered) + 1;
}

function getNextSortOrder(items: RoadmapItem[]) {
  if (items.length === 0) return 0;
  return Math.max(...items.map((item) => item.sort_order)) + 1;
}

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
  const [newPhaseSuffix, setNewPhaseSuffix] = useState('');
  const [statusPickerItem, setStatusPickerItem] = useState<string | null>(null);
  const [editingPhase, setEditingPhase] = useState<string | null>(null);
  const [editPhaseSuffix, setEditPhaseSuffix] = useState('');
  const [pendingPhase, setPendingPhase] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/(game)');
    }
  }, [isAdmin, router]);

  useEffect(() => {
    fetchItems();
  }, []);

  const groups = useMemo(() => {
    const baseGroups = groupItemsByPhase(items);

    if (!pendingPhase) return baseGroups;
    if (baseGroups.some((group) => group.phase === pendingPhase)) return baseGroups;

    const parsed = parsePhase(pendingPhase);

    return [
      ...baseGroups,
      {
        phase: parsed.phase,
        phaseNumber: parsed.phaseNumber,
        phaseSuffix: parsed.phaseSuffix,
        items: [],
      },
    ].sort((a, b) => {
      if (a.phaseNumber !== b.phaseNumber) return a.phaseNumber - b.phaseNumber;
      return a.phase.localeCompare(b.phase);
    });
  }, [items, pendingPhase]);

  const trimmedSearch = searchQuery.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    const phaseGroups =
      phaseFilter === 'all' ? groups : groups.filter((g) => g.phase === phaseFilter);

    return phaseGroups
      .map((group) => {
        const counts: Record<Status, number> = {
          todo: 0,
          in_progress: 0,
          done: 0,
          parked: 0,
        };
        for (const item of group.items) counts[item.status]++;

        let visibleItems = group.items;
        if (statusFilter !== 'all') {
          visibleItems = visibleItems.filter((item) => item.status === statusFilter);
        }
        if (trimmedSearch) {
          visibleItems = visibleItems.filter((item) =>
            item.title.toLowerCase().includes(trimmedSearch)
          );
        }

        return {
          ...group,
          counts,
          totalCount: group.items.length,
          items: visibleItems,
        };
      })
      .filter((group) => {
        if (group.phase === pendingPhase) return true;
        if (trimmedSearch && group.items.length === 0) return false;
        return true;
      });
  }, [groups, phaseFilter, statusFilter, trimmedSearch, pendingPhase]);

  const statusTotalCounts = useMemo(() => {
    const counts: Record<Status | 'all', number> = {
      all: items.length,
      todo: 0,
      in_progress: 0,
      done: 0,
      parked: 0,
    };
    for (const item of items) counts[item.status]++;
    return counts;
  }, [items]);

  const phaseTotalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const group of groups) counts[group.phase] = group.items.length;
    return counts;
  }, [groups]);

  const nextPhaseNumber = useMemo(() => getNextPhaseNumber(groups), [groups]);

  async function fetchItems() {
    setIsLoading(true);

    const { data, error } = await supabase
      .from('roadmap_items')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('failed to fetch roadmap items:', error.message);
      setIsLoading(false);
      return;
    }

    setItems((data ?? []) as RoadmapItem[]);
    setIsLoading(false);
  }

  function resetItemEditor() {
    setEditingItem(null);
    setEditTitle('');
    setEditDescription('');
  }

  function resetAddForm() {
    if (pendingPhase && addingToPhase === pendingPhase) {
      setPendingPhase(null);
    }

    setAddingToPhase(null);
    setNewTitle('');
    setNewDescription('');
  }

  function resetPhaseEditor() {
    setEditingPhase(null);
    setEditPhaseSuffix('');
  }

  function resetTransientUi() {
    resetItemEditor();
    resetAddForm();
    resetPhaseEditor();
    setStatusPickerItem(null);
  }

  function togglePhase(phase: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedPhases((prev) => ({ ...prev, [phase]: !(prev[phase] ?? true) }));
  }

  function toggleExpand(id: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItem((prev) => (prev === id ? null : id));
    resetItemEditor();
    setStatusPickerItem(null);
  }

  function startEdit(item: RoadmapItem) {
    setEditingItem(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description ?? '');
    setStatusPickerItem(null);
  }

  function startPhaseEdit(group: PhaseGroup) {
    setEditingPhase(group.phase);
    setEditPhaseSuffix(group.phaseSuffix);
    resetAddForm();
  }

  async function saveEdit(item: RoadmapItem) {
    const trimmedTitle = editTitle.trim();
    const trimmedDescription = editDescription.trim();

    if (!trimmedTitle) return;

    const { error } = await supabase
      .from('roadmap_items')
      .update({
        title: trimmedTitle,
        description: trimmedDescription || null,
      })
      .eq('id', item.id);

    if (error) {
      console.error('failed to save edit:', error.message);
      return;
    }

    resetItemEditor();
    fetchItems();
  }

  async function savePhaseEdit(group: PhaseGroup) {
    const trimmedSuffix = editPhaseSuffix.trim();

    if (!trimmedSuffix) return;

    const newPhase = buildPhaseName(group.phaseNumber, trimmedSuffix);

    if (newPhase === group.phase) {
      resetPhaseEditor();
      return;
    }

    const { error } = await supabase
      .from('roadmap_items')
      .update({ phase: newPhase })
      .eq('phase', group.phase);

    if (error) {
      console.error('failed to rename phase:', error.message);
      return;
    }

    setCollapsedPhases((prev) => {
      const next = { ...prev };
      if (group.phase in next) {
        next[newPhase] = next[group.phase];
        delete next[group.phase];
      }
      return next;
    });

    if (phaseFilter === group.phase) {
      setPhaseFilter(newPhase);
    }

    if (addingToPhase === group.phase) {
      setAddingToPhase(newPhase);
    }

    resetPhaseEditor();
    fetchItems();
  }

  async function setStatus(item: RoadmapItem, status: Status) {
    if (item.status === status) {
      setStatusPickerItem(null);
      return;
    }

    const updates: Partial<RoadmapItem> = { status };

    if (status === 'done') {
      const phaseItems = items.filter(
        (i) => normalizePhase(i.phase) === normalizePhase(item.phase)
      );
      updates.sort_order = getNextSortOrder(phaseItems);
    }

    const { error } = await supabase.from('roadmap_items').update(updates).eq('id', item.id);

    if (error) {
      console.error('failed to set status:', error.message);
      return;
    }

    setStatusPickerItem(null);
    fetchItems();
  }

  function confirmDelete(item: RoadmapItem) {
    Alert.alert('Delete item', `Delete "${item.title}"?`, [
      { text: 'cancel', style: 'cancel' },
      {
        text: 'delete',
        style: 'destructive',
        onPress: () => deleteItem(item.id),
      },
    ]);
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from('roadmap_items').delete().eq('id', id);

    if (error) {
      console.error('failed to delete item:', error.message);
      return;
    }

    if (expandedItem === id) {
      setExpandedItem(null);
    }

    if (editingItem === id) {
      resetItemEditor();
    }

    if (statusPickerItem === id) {
      setStatusPickerItem(null);
    }

    fetchItems();
  }

  async function addItem(phase: string) {
    const trimmedTitle = newTitle.trim();
    const trimmedDescription = newDescription.trim();

    if (!trimmedTitle) return;

    const phaseItems = items.filter((item) => normalizePhase(item.phase) === phase);
    const nextSortOrder = getNextSortOrder(phaseItems);

    const { error } = await supabase.from('roadmap_items').insert({
      title: trimmedTitle,
      description: trimmedDescription || null,
      phase,
      status: 'todo',
      sort_order: nextSortOrder,
    });

    if (error) {
      console.error('failed to add item:', error.message);
      return;
    }

    if (pendingPhase === phase) {
      setPendingPhase(null);
    }

    resetAddForm();
    fetchItems();
  }

  function startNewPhase() {
    resetTransientUi();
    setAddingNewPhase(true);
  }

  function cancelNewPhase() {
    setAddingNewPhase(false);
    setNewPhaseSuffix('');
  }

  function createNewPhase() {
    const trimmedSuffix = newPhaseSuffix.trim();

    if (!trimmedSuffix) return;

    const phase = buildPhaseName(nextPhaseNumber, trimmedSuffix);

    setAddingNewPhase(false);
    setNewPhaseSuffix('');
    setPendingPhase(phase);
    setAddingToPhase(phase);
    setCollapsedPhases((prev) => ({ ...prev, [phase]: false }));
  }

  if (!isAdmin) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="chevron-left" size={18} color="#4a9eff" />
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Admin</Text>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchRow}>
          <Feather name="search" size={14} color="#71717a" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search items..."
            placeholderTextColor="#52525b"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.searchClear}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <Feather name="x" size={14} color="#71717a" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {STATUS_FILTERS.map((filter) => {
            const isActive = statusFilter === filter.value;
            const count = statusTotalCounts[filter.value];
            return (
              <TouchableOpacity
                key={filter.value}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setStatusFilter(filter.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {filter.label}
                </Text>
                <View style={[styles.filterChipCount, isActive && styles.filterChipCountActive]}>
                  <Text
                    style={[
                      styles.filterChipCountText,
                      isActive && styles.filterChipCountTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, phaseFilter === 'all' && styles.filterChipActive]}
            onPress={() => setPhaseFilter('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.filterChipText, phaseFilter === 'all' && styles.filterChipTextActive]}
            >
              All phases
            </Text>
            <View
              style={[
                styles.filterChipCount,
                phaseFilter === 'all' && styles.filterChipCountActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipCountText,
                  phaseFilter === 'all' && styles.filterChipCountTextActive,
                ]}
              >
                {items.length}
              </Text>
            </View>
          </TouchableOpacity>

          {groups.map((group) => {
            const isActive = phaseFilter === group.phase;
            return (
              <TouchableOpacity
                key={group.phase}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setPhaseFilter(group.phase)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {group.phase}
                </Text>
                <View style={[styles.filterChipCount, isActive && styles.filterChipCountActive]}>
                  <Text
                    style={[
                      styles.filterChipCountText,
                      isActive && styles.filterChipCountTextActive,
                    ]}
                  >
                    {phaseTotalCounts[group.phase] ?? 0}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {filteredGroups.map((group) => {
            const isCollapsed = collapsedPhases[group.phase] ?? true;
            const visibleItems = group.items;
            const isEditingPhase = editingPhase === group.phase;
            const progressStatuses: Status[] = ['done', 'in_progress', 'parked'];
            const breakdownOrder: Status[] = ['done', 'in_progress', 'todo', 'parked'];

            return (
              <View key={group.phase} style={styles.phaseGroup}>
                <TouchableOpacity
                  style={styles.phaseHeader}
                  onPress={() => togglePhase(group.phase)}
                  activeOpacity={0.7}
                >
                  <View style={styles.phaseHeaderTop}>
                    <View style={styles.phaseHeaderLeft}>
                      <Text style={styles.phaseTitle}>{group.phase}</Text>
                      <Text style={styles.phaseCount}>
                        {group.counts.done}/{group.totalCount}
                      </Text>
                    </View>
                    <Feather
                      name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                      size={18}
                      color="#71717a"
                    />
                  </View>

                  {group.totalCount > 0 && (
                    <View style={styles.progressTrack}>
                      {progressStatuses.map((status) => {
                        const count = group.counts[status];
                        if (count === 0) return null;
                        const pct = (count / group.totalCount) * 100;
                        return (
                          <View
                            key={status}
                            style={[
                              styles.progressSegment,
                              {
                                flexBasis: `${pct}%`,
                                backgroundColor: STATUS_COLORS[status],
                              },
                            ]}
                          />
                        );
                      })}
                    </View>
                  )}

                  {group.totalCount > 0 && (
                    <View style={styles.phaseStats}>
                      {breakdownOrder.map((status) => {
                        const count = group.counts[status];
                        if (count === 0) return null;
                        return (
                          <View key={status} style={styles.phaseStat}>
                            <View
                              style={[styles.statDot, { backgroundColor: STATUS_COLORS[status] }]}
                            />
                            <Text style={styles.phaseStatText}>
                              {count} {STATUS_LABELS[status]}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </TouchableOpacity>

                {!isCollapsed && (
                  <View style={styles.phaseItems}>
                    {isEditingPhase ? (
                      <View style={styles.phaseEditForm}>
                        <View style={styles.phaseNameRow}>
                          <Text style={styles.phasePrefix}>Phase {group.phaseNumber} -</Text>
                          <TextInput
                            style={[styles.editInput, styles.phaseSuffixInput]}
                            value={editPhaseSuffix}
                            onChangeText={setEditPhaseSuffix}
                            placeholder="phase name"
                            placeholderTextColor="#555"
                            autoFocus
                          />
                        </View>
                        <View style={styles.editActions}>
                          <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => savePhaseEdit(group)}
                          >
                            <Feather name="check" size={13} color="#fff" />
                            <Text style={styles.saveButtonText}>Save</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={resetPhaseEditor} style={styles.cancelButton}>
                            <Feather name="x" size={13} color="#71717a" />
                            <Text style={styles.cancelText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.phaseActions}>
                        <TouchableOpacity
                          onPress={() => startPhaseEdit(group)}
                          style={styles.iconAction}
                        >
                          <Feather name="edit-2" size={12} color="#4a9eff" />
                          <Text style={styles.actionText}>Edit phase</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {visibleItems.length === 0 && (
                      <Text style={styles.empty}>No items match this filter</Text>
                    )}

                    {visibleItems.map((item) => {
                      const isExpanded = expandedItem === item.id;
                      const isEditing = editingItem === item.id;
                      const isPickingStatus = statusPickerItem === item.id;

                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.item,
                            { borderLeftColor: STATUS_COLORS[item.status] },
                            isExpanded && styles.itemExpandedCard,
                          ]}
                        >
                          <View style={styles.itemRow}>
                            <TouchableOpacity
                              style={[
                                styles.statusBadge,
                                {
                                  backgroundColor: STATUS_BG[item.status],
                                  borderColor: STATUS_BORDER[item.status],
                                },
                              ]}
                              onPress={() => setStatusPickerItem(isPickingStatus ? null : item.id)}
                              activeOpacity={0.7}
                            >
                              <View
                                style={[
                                  styles.statusBadgeDot,
                                  { backgroundColor: STATUS_COLORS[item.status] },
                                ]}
                              />
                              <Text
                                style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}
                              >
                                {STATUS_LABELS[item.status]}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.itemTitleRow}
                              onPress={() => toggleExpand(item.id)}
                              activeOpacity={0.7}
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

                          {isPickingStatus && (
                            <View style={styles.statusPicker}>
                              {(Object.keys(STATUS_LABELS) as Status[]).map((status) => (
                                <TouchableOpacity
                                  key={status}
                                  style={[
                                    styles.statusPickerOption,
                                    {
                                      backgroundColor: STATUS_BG[status],
                                      borderColor: STATUS_BORDER[status],
                                    },
                                    item.status === status && styles.statusPickerOptionActive,
                                  ]}
                                  onPress={() => setStatus(item, status)}
                                  activeOpacity={0.7}
                                >
                                  <View
                                    style={[
                                      styles.statusBadgeDot,
                                      { backgroundColor: STATUS_COLORS[status] },
                                    ]}
                                  />
                                  <Text
                                    style={[styles.statusText, { color: STATUS_COLORS[status] }]}
                                  >
                                    {STATUS_LABELS[status]}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}

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
                                    style={[styles.editInput, styles.descriptionInput]}
                                    value={editDescription}
                                    onChangeText={setEditDescription}
                                    placeholder="description (optional)"
                                    placeholderTextColor="#555"
                                    multiline
                                    textAlignVertical="top"
                                  />
                                  <View style={styles.editActions}>
                                    <TouchableOpacity
                                      style={styles.saveButton}
                                      onPress={() => saveEdit(item)}
                                    >
                                      <Feather name="check" size={13} color="#fff" />
                                      <Text style={styles.saveButtonText}>Save</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      onPress={resetItemEditor}
                                      style={styles.cancelButton}
                                    >
                                      <Feather name="x" size={13} color="#71717a" />
                                      <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              ) : (
                                <View>
                                  {item.description && (
                                    <Text style={styles.itemDescription}>{item.description}</Text>
                                  )}
                                  <View style={styles.itemActions}>
                                    <TouchableOpacity
                                      onPress={() => startEdit(item)}
                                      style={styles.iconAction}
                                    >
                                      <Feather name="edit-2" size={12} color="#4a9eff" />
                                      <Text style={styles.actionText}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      onPress={() => confirmDelete(item)}
                                      style={styles.iconAction}
                                    >
                                      <Feather name="trash-2" size={12} color="#ef4444" />
                                      <Text style={styles.deleteText}>Delete</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })}

                    {addingToPhase === group.phase ? (
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
                          style={[styles.editInput, styles.descriptionInput]}
                          value={newDescription}
                          onChangeText={setNewDescription}
                          placeholder="description (optional)"
                          placeholderTextColor="#555"
                          multiline
                          textAlignVertical="top"
                        />
                        <View style={styles.editActions}>
                          <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => addItem(group.phase)}
                          >
                            <Feather name="check" size={13} color="#fff" />
                            <Text style={styles.saveButtonText}>Add</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={resetAddForm} style={styles.cancelButton}>
                            <Feather name="x" size={13} color="#71717a" />
                            <Text style={styles.cancelText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => {
                          resetItemEditor();
                          setAddingNewPhase(false);
                          setStatusPickerItem(null);
                          setAddingToPhase(group.phase);
                        }}
                      >
                        <Feather name="plus" size={13} color="#52525b" />
                        <Text style={styles.addButtonText}>Add item</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {addingNewPhase ? (
            <View style={styles.newPhaseForm}>
              <View style={styles.phaseNameRow}>
                <Text style={styles.phasePrefix}>Phase {nextPhaseNumber} -</Text>
                <TextInput
                  style={[styles.editInput, styles.phaseSuffixInput]}
                  value={newPhaseSuffix}
                  onChangeText={setNewPhaseSuffix}
                  placeholder="phase name"
                  placeholderTextColor="#555"
                  autoFocus
                />
              </View>
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.saveButton} onPress={createNewPhase}>
                  <Feather name="check" size={13} color="#fff" />
                  <Text style={styles.saveButtonText}>Create phase</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelNewPhase} style={styles.cancelButton}>
                  <Feather name="x" size={13} color="#71717a" />
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.newPhaseButton} onPress={startNewPhase}>
              <Feather name="plus" size={14} color="#52525b" />
              <Text style={styles.newPhaseButtonText}>New phase</Text>
            </TouchableOpacity>
          )}
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
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
  toolbar: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 14,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#0d0d0f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  searchInput: {
    flex: 1,
    color: '#fafafa',
    fontSize: 14,
    padding: 0,
    margin: 0,
  },
  searchClear: {
    padding: 2,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#4a9eff',
    borderColor: '#4a9eff',
  },
  filterChipText: {
    color: '#a1a1aa',
    fontSize: 13,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  filterChipCount: {
    minWidth: 20,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  filterChipCountText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    lineHeight: 14,
  },
  filterChipCountTextActive: {
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
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  phaseHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  phaseHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phaseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 12,
  },
  phaseTitle: {
    color: '#fafafa',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  phaseCount: {
    color: '#71717a',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 4,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressSegment: {
    height: '100%',
  },
  phaseStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    rowGap: 4,
  },
  phaseStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  phaseStatText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.2,
  },
  phaseItems: {
    padding: 12,
    gap: 6,
  },
  phaseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  phaseEditForm: {
    gap: 8,
    marginBottom: 4,
  },
  phaseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phasePrefix: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  phaseSuffixInput: {
    flex: 1,
  },
  empty: {
    color: '#444',
    fontSize: 13,
    paddingVertical: 8,
    textAlign: 'center',
  },
  item: {
    backgroundColor: '#161618',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    borderRightColor: 'rgba(255, 255, 255, 0.04)',
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  itemExpandedCard: {
    backgroundColor: '#1c1c1f',
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  statusPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  statusPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPickerOptionActive: {
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  itemTitleRow: {
    flex: 1,
  },
  itemTitle: {
    color: '#e4e4e7',
    fontSize: 14,
    letterSpacing: -0.1,
  },
  itemTitleDone: {
    textDecorationLine: 'line-through',
    color: '#52525b',
  },
  itemExpanded: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 2,
  },
  itemDescription: {
    color: '#a1a1aa',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 19,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 16,
  },
  iconAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
  descriptionInput: {
    minHeight: 80,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4a9eff',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
  },
  cancelText: {
    color: '#71717a',
    fontSize: 13,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  addButtonText: {
    color: '#52525b',
    fontSize: 13,
  },
  newPhaseForm: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  newPhaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 16,
  },
  newPhaseButtonText: {
    color: '#52525b',
    fontSize: 14,
  },
});
