import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type RoadmapItem = {
  id: string;
  title: string;
  description: string | null;
  phase: string | null;
  is_complete: boolean;
  created_at: string;
};

export default function AdminScreen() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [phase, setPhase] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // redirect non-admins immediately
  useEffect(() => {
    if (!isAdmin) {
      router.replace('/(game)');
    }
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

  async function addItem() {
    if (!title.trim()) return;
    const { error } = await supabase.from('roadmap_items').insert({
      title: title.trim(),
      description: description.trim() || null,
      phase: phase.trim() || null,
      is_complete: false,
    });
    if (error) {
      console.error('failed to add item:', error.message);
      return;
    }
    setTitle('');
    setDescription('');
    setPhase('');
    fetchItems();
  }

  async function toggleItem(item: RoadmapItem) {
    const { error } = await supabase
      .from('roadmap_items')
      .update({ is_complete: !item.is_complete })
      .eq('id', item.id);
    if (error) {
      console.error('failed to toggle item:', error.message);
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

  if (!isAdmin) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>admin</Text>
      </View>

      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="title" value={title} onChangeText={setTitle} />
        <TextInput
          style={styles.input}
          placeholder="description (optional)"
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          style={styles.input}
          placeholder="phase (optional)"
          value={phase}
          onChangeText={setPhase}
        />
        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Text style={styles.addButtonText}>add item</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <Text style={styles.loading}>loading...</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <TouchableOpacity style={styles.itemLeft} onPress={() => toggleItem(item)}>
                <View style={[styles.checkbox, item.is_complete && styles.checkboxDone]} />
                <View>
                  {item.phase && <Text style={styles.phase}>{item.phase}</Text>}
                  <Text style={[styles.itemTitle, item.is_complete && styles.itemTitleDone]}>
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text style={styles.itemDescription}>{item.description}</Text>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteItem(item.id)}>
                <Text style={styles.delete}>delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  back: {
    fontSize: 14,
    color: '#007bff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  form: {
    gap: 8,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loading: {
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  checkboxDone: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  phase: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemTitleDone: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  itemDescription: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  delete: {
    fontSize: 13,
    color: '#ff4444',
  },
});
