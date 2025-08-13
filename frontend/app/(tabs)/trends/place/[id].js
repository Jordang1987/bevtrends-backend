import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import api from '../../../../src/lib/api';

export default function PlaceDetail() {
  const { id } = useLocalSearchParams();
  const [data, setData] = useState(null);

  useEffect(() => { api.get(`/trending/place/${id}`).then(r => setData(r.data)).catch(console.warn); }, [id]);

  if (!data) return <View style={s.center}><Text>Loading…</Text></View>;

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Text style={s.name}>{data.name}</Text>
      <Text style={s.gray}>{data.category} • Heat {data.heat ?? '—'}</Text>
      <Text style={s.h2}>Why it’s trending</Text>
      <Text style={s.p}>{data.note}</Text>
      <Text style={s.h2}>Address</Text>
      <Text style={s.p}>{data.address}</Text>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  center:{ flex:1, alignItems:'center', justifyContent:'center' },
  wrap:{ padding:16, gap:8 },
  name:{ fontSize:22, fontWeight:'800' },
  gray:{ opacity:0.7 },
  h2:{ marginTop:14, fontSize:16, fontWeight:'700' },
  p:{ lineHeight:20 }
});
