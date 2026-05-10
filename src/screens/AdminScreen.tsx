import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
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
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// `hovered` and `focused` are exposed by react-native-web's Pressable but
// are not in the upstream React Native types yet. This local shim re-adds
// them so we can drive web-only hover styles without `any` casts.
type PressState = { hovered?: boolean; focused?: boolean; pressed: boolean };

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
  todo: '#94a3b8',
  in_progress: '#fbbf24',
  done: '#34d399',
  parked: '#c4b5fd',
};

const STATUS_BG: Record<Status, string> = {
  todo: 'rgba(148, 163, 184, 0.12)',
  in_progress: 'rgba(251, 191, 36, 0.12)',
  done: 'rgba(52, 211, 153, 0.12)',
  parked: 'rgba(196, 181, 253, 0.14)',
};

const STATUS_BORDER: Record<Status, string> = {
  todo: 'rgba(148, 163, 184, 0.30)',
  in_progress: 'rgba(251, 191, 36, 0.30)',
  done: 'rgba(52, 211, 153, 0.30)',
  parked: 'rgba(196, 181, 253, 0.32)',
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

function PhaseSkeleton({ titleWidth }: { titleWidth: number }) {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 850, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.phaseGroup}>
      <View style={styles.phaseHeader}>
        <View style={styles.phaseHeaderTop}>
          <Animated.View style={[styles.skelTitle, { width: titleWidth, opacity: pulse }]} />
          <Animated.View style={[styles.skelChevron, { opacity: pulse }]} />
        </View>
        <Animated.View style={[styles.skelTrack, { opacity: pulse }]} />
        <View style={styles.phaseStats}>
          <Animated.View style={[styles.skelChip, { opacity: pulse }]} />
          <Animated.View style={[styles.skelChip, { width: 64, opacity: pulse }]} />
          <Animated.View style={[styles.skelChip, { width: 52, opacity: pulse }]} />
        </View>
      </View>
    </View>
  );
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
  const [itemPendingDelete, setItemPendingDelete] = useState<RoadmapItem | null>(null);

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
    setItemPendingDelete(item);
  }

  async function handleConfirmDelete() {
    if (!itemPendingDelete) return;
    const id = itemPendingDelete.id;
    setItemPendingDelete(null);
    await deleteItem(id);
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
      <View style={styles.hero}>
        <Pressable
          onPress={() => router.back()}
          style={({ hovered }: PressState) => [
            styles.backButton,
            hovered && styles.backButtonHover,
          ]}
        >
          <Feather name="chevron-left" size={18} color="#6366f1" />
          <Text style={styles.back}>Back</Text>
        </Pressable>

        <View style={styles.heroHeading}>
          <View style={styles.heroEyebrow}>
            <Feather name="settings" size={11} color="#828599" />
            <Text style={styles.heroEyebrowText}>Admin</Text>
          </View>
          <Text style={styles.heroTitle}>Roadmap</Text>
          <Text style={styles.heroSubtitle}>
            {items.length} {items.length === 1 ? 'item' : 'items'} across {groups.length}{' '}
            {groups.length === 1 ? 'phase' : 'phases'}
          </Text>
        </View>

        <View style={styles.heroStats}>
          {(
            [
              {
                key: 'all',
                label: 'Total',
                value: items.length,
                color: '#6366f1',
              },
              {
                key: 'done',
                label: 'Done',
                value: statusTotalCounts.done,
                color: '#34d399',
              },
              {
                key: 'in_progress',
                label: 'In progress',
                value: statusTotalCounts.in_progress,
                color: '#fbbf24',
              },
              {
                key: 'todo',
                label: 'Todo',
                value: statusTotalCounts.todo,
                color: '#94a3b8',
              },
            ] as const
          ).map((stat) => (
            <View key={stat.key} style={styles.heroStatCard}>
              <View
                style={[
                  styles.heroStatDot,
                  { backgroundColor: stat.color, shadowColor: stat.color },
                ]}
              />
              <Text style={styles.heroStatValue}>{stat.value}</Text>
              <Text style={styles.heroStatLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {items.length > 0 && (
          <View style={styles.heroProgress}>
            <View style={styles.heroProgressBarTrack}>
              <View
                style={[
                  styles.heroProgressBarFill,
                  {
                    width: `${(statusTotalCounts.done / items.length) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.heroProgressLabel}>
              {Math.round((statusTotalCounts.done / items.length) * 100)}% complete
            </Text>
          </View>
        )}
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchRow}>
          <Feather name="search" size={14} color="#828599" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search items..."
            placeholderTextColor="#6b6f85"
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
              <Feather name="x" size={14} color="#828599" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {STATUS_FILTERS.map((filter) => {
            const isActive = statusFilter === filter.value;
            const count = statusTotalCounts[filter.value];
            return (
              <Pressable
                key={filter.value}
                style={({ hovered, pressed }: PressState) => [
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                  hovered && !isActive && styles.filterChipHover,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => setStatusFilter(filter.value)}
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
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Pressable
            style={({ hovered, pressed }: PressState) => [
              styles.filterChip,
              phaseFilter === 'all' && styles.filterChipActive,
              hovered && phaseFilter !== 'all' && styles.filterChipHover,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => setPhaseFilter('all')}
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
          </Pressable>

          {groups.map((group) => {
            const isActive = phaseFilter === group.phase;
            return (
              <Pressable
                key={group.phase}
                style={({ hovered, pressed }: PressState) => [
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                  hovered && !isActive && styles.filterChipHover,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => setPhaseFilter(group.phase)}
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
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.skeletonList}>
          <PhaseSkeleton titleWidth={180} />
          <PhaseSkeleton titleWidth={140} />
          <PhaseSkeleton titleWidth={210} />
        </View>
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
                      color="#828599"
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
                            placeholderTextColor="#6b6f85"
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
                            <Feather name="x" size={13} color="#828599" />
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
                          <Feather name="edit-2" size={12} color="#6366f1" />
                          <Text style={styles.actionText}>Edit phase</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {visibleItems.length === 0 && group.phase !== pendingPhase && (
                      <View style={styles.phaseEmpty}>
                        <Feather name="filter" size={14} color="#6b6f85" />
                        <Text style={styles.phaseEmptyText}>No items match this filter</Text>
                      </View>
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

                            <Pressable
                              style={({ hovered, pressed }: PressState) => [
                                styles.itemTitleRow,
                                hovered && styles.itemTitleRowHover,
                                pressed && { opacity: 0.8 },
                              ]}
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
                            </Pressable>
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
                                    placeholderTextColor="#6b6f85"
                                  />
                                  <TextInput
                                    style={[styles.editInput, styles.descriptionInput]}
                                    value={editDescription}
                                    onChangeText={setEditDescription}
                                    placeholder="description (optional)"
                                    placeholderTextColor="#6b6f85"
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
                                      <Feather name="x" size={13} color="#828599" />
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
                                      <Feather name="edit-2" size={12} color="#6366f1" />
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
                          placeholderTextColor="#6b6f85"
                          autoFocus
                        />
                        <TextInput
                          style={[styles.editInput, styles.descriptionInput]}
                          value={newDescription}
                          onChangeText={setNewDescription}
                          placeholder="description (optional)"
                          placeholderTextColor="#6b6f85"
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
                            <Feather name="x" size={13} color="#828599" />
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
                        <Feather name="plus" size={13} color="#6b6f85" />
                        <Text style={styles.addButtonText}>Add item</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {filteredGroups.length === 0 && trimmedSearch.length > 0 && (
            <View style={styles.rootEmpty}>
              <View style={styles.rootEmptyIcon}>
                <Feather name="search" size={20} color="#828599" />
              </View>
              <Text style={styles.rootEmptyTitle}>No results</Text>
              <Text style={styles.rootEmptyBody}>
                Nothing matches{' '}
                <Text style={styles.rootEmptyQuery}>&ldquo;{searchQuery}&rdquo;</Text>
              </Text>
              <TouchableOpacity
                style={styles.rootEmptyButton}
                onPress={() => setSearchQuery('')}
                activeOpacity={0.8}
              >
                <Feather name="x" size={13} color="#f5f5fa" />
                <Text style={styles.rootEmptyButtonText}>Clear search</Text>
              </TouchableOpacity>
            </View>
          )}

          {filteredGroups.length === 0 &&
            trimmedSearch.length === 0 &&
            items.length === 0 &&
            !addingNewPhase && (
              <View style={styles.rootEmpty}>
                <View style={styles.rootEmptyIcon}>
                  <Feather name="layers" size={20} color="#828599" />
                </View>
                <Text style={styles.rootEmptyTitle}>No phases yet</Text>
                <Text style={styles.rootEmptyBody}>
                  Create your first phase to start tracking the roadmap.
                </Text>
                <TouchableOpacity
                  style={styles.rootEmptyButton}
                  onPress={startNewPhase}
                  activeOpacity={0.8}
                >
                  <Feather name="plus" size={13} color="#f5f5fa" />
                  <Text style={styles.rootEmptyButtonText}>Create first phase</Text>
                </TouchableOpacity>
              </View>
            )}

          {addingNewPhase ? (
            <View style={styles.newPhaseForm}>
              <View style={styles.phaseNameRow}>
                <Text style={styles.phasePrefix}>Phase {nextPhaseNumber} -</Text>
                <TextInput
                  style={[styles.editInput, styles.phaseSuffixInput]}
                  value={newPhaseSuffix}
                  onChangeText={setNewPhaseSuffix}
                  placeholder="phase name"
                  placeholderTextColor="#6b6f85"
                  autoFocus
                />
              </View>
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.saveButton} onPress={createNewPhase}>
                  <Feather name="check" size={13} color="#fff" />
                  <Text style={styles.saveButtonText}>Create phase</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelNewPhase} style={styles.cancelButton}>
                  <Feather name="x" size={13} color="#828599" />
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : items.length > 0 ? (
            <TouchableOpacity style={styles.newPhaseButton} onPress={startNewPhase}>
              <Feather name="plus" size={14} color="#6b6f85" />
              <Text style={styles.newPhaseButtonText}>New phase</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      )}

      <Modal
        visible={itemPendingDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setItemPendingDelete(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setItemPendingDelete(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalIcon}>
              <Feather name="alert-triangle" size={18} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Delete item</Text>
            <Text style={styles.modalBody}>
              Permanently delete{' '}
              <Text style={styles.modalEmphasis}>
                &ldquo;{itemPendingDelete?.title ?? ''}&rdquo;
              </Text>
              ? This cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setItemPendingDelete(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={handleConfirmDelete}
                activeOpacity={0.85}
              >
                <Feather name="trash-2" size={13} color="#fff" />
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0d1f',
    paddingTop: 60,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 22,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.10)',
    marginBottom: 20,
  },
  heroHeading: {
    gap: 4,
  },
  heroEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  heroEyebrowText: {
    color: '#828599',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#f5f5fa',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    color: '#a8aac1',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  heroStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: '#14172e',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.14)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
  },
  heroStatDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 2,
  },
  heroStatValue: {
    color: '#f5f5fa',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    lineHeight: 26,
  },
  heroStatLabel: {
    color: '#828599',
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  heroProgressBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.18)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  heroProgressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
  },
  heroProgressLabel: {
    color: '#a8aac1',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
    minWidth: 88,
    textAlign: 'right',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingRight: 6,
    borderRadius: 6,
  },
  backButtonHover: {
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
  },
  back: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#f5f5fa',
    letterSpacing: -0.4,
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
    backgroundColor: '#0e1124',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.12)',
  },
  searchInput: {
    flex: 1,
    color: '#f5f5fa',
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
    borderColor: 'rgba(99, 102, 241, 0.18)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#818cf8',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 6,
  },
  filterChipHover: {
    backgroundColor: 'rgba(99, 102, 241, 0.10)',
    borderColor: 'rgba(99, 102, 241, 0.26)',
  },
  filterChipText: {
    color: '#a8aac1',
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
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  filterChipCountText: {
    color: '#a8aac1',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    lineHeight: 14,
  },
  filterChipCountTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  loading: {
    color: '#6b6f85',
    textAlign: 'center',
    marginTop: 40,
  },
  skeletonList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  skelTitle: {
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  skelChevron: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  skelTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  skelChip: {
    height: 10,
    width: 78,
    borderRadius: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
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
    backgroundColor: '#14172e',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.12)',
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
    color: '#f5f5fa',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  phaseCount: {
    color: '#828599',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 6,
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.18)',
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
    color: '#a8aac1',
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
    color: '#a8aac1',
    fontSize: 14,
    fontWeight: '600',
  },
  phaseSuffixInput: {
    flex: 1,
  },
  empty: {
    color: '#6b6f85',
    fontSize: 13,
    paddingVertical: 8,
    textAlign: 'center',
  },
  phaseEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  phaseEmptyText: {
    color: '#828599',
    fontSize: 13,
  },
  rootEmpty: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
    gap: 8,
  },
  rootEmptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rootEmptyTitle: {
    color: '#f5f5fa',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  rootEmptyBody: {
    color: '#a8aac1',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
  },
  rootEmptyQuery: {
    color: '#f5f5fa',
    fontWeight: '500',
  },
  rootEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  rootEmptyButtonText: {
    color: '#f5f5fa',
    fontSize: 13,
    fontWeight: '600',
  },
  item: {
    backgroundColor: '#1d2147',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.08)',
    borderRightColor: 'rgba(99, 102, 241, 0.08)',
    borderBottomColor: 'rgba(99, 102, 241, 0.08)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  itemExpandedCard: {
    backgroundColor: '#232752',
    borderTopColor: 'rgba(99, 102, 241, 0.18)',
    borderRightColor: 'rgba(99, 102, 241, 0.18)',
    borderBottomColor: 'rgba(99, 102, 241, 0.18)',
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
    borderColor: 'rgba(99, 102, 241, 0.50)',
  },
  itemTitleRow: {
    flex: 1,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemTitleRowHover: {
    opacity: 0.85,
  },
  itemTitle: {
    color: '#f5f5fa',
    fontSize: 14,
    letterSpacing: -0.1,
  },
  itemTitleDone: {
    textDecorationLine: 'line-through',
    color: '#6b6f85',
  },
  itemExpanded: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 2,
  },
  itemDescription: {
    color: '#a8aac1',
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
    color: '#6366f1',
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
    color: '#f5f5fa',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.18)',
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
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 4,
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
    color: '#828599',
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
    color: '#6b6f85',
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
    borderColor: 'rgba(99, 102, 241, 0.18)',
    marginBottom: 16,
  },
  newPhaseButtonText: {
    color: '#6b6f85',
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1d2147',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.18)',
    padding: 22,
    gap: 10,
  },
  modalIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    color: '#f5f5fa',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  modalBody: {
    color: '#a8aac1',
    fontSize: 13,
    lineHeight: 20,
  },
  modalEmphasis: {
    color: '#f5f5fa',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  modalCancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 7,
  },
  modalCancelText: {
    color: '#a8aac1',
    fontSize: 13,
    fontWeight: '500',
  },
  modalDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 7,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  modalDeleteText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
