import React from 'react';
import { View, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { useAuth } from '../../context/authContext';
const Home = () => {
  const { logout, user } = useAuth();
  console.log(user);
  return (
    <View>
      <Text></Text>
      <Button
        onPress={() => {
          logout();
        }}
        mode="contained"
      >
        Click Mes
      </Button>
      {/* The button will be visible now */}
    </View>
  );
};

export default Home;
