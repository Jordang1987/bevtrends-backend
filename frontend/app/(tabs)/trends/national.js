import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import api from '../../../src/lib/api';

export default function National() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get('/trending/national').then(r => setItems(r.data.items || [])).catch(console.warn); }, []);
  return (
    <FlatList
      contentContainerStyle={s.wrap}
      data={items}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => (
        <View style={s.card}><Text style={s.name}>{item.name}</Text><Text>🔥 {item.heat ?? '—'}</Text></View>
      )}
    />
  );
}
const s = StyleSheet.create({ wrap:{ padding:16 }, card:{ backgroundColor:'#fff', padding:14, borderRadius:12, marginBottom:10 }, name:{ fontSize:18, fontWeight:'700' }});
