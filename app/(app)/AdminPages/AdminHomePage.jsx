import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet,ScrollView } from 'react-native';
import { useAuth } from '../../../context/authContext';


const AdminHomePage = () => {
  const { user } = useAuth();

  if (!user) return null;

  return(
    <View>
        <Text>Hello Admin</Text>
    </View>
  );


};

export default AdminHomePage;
