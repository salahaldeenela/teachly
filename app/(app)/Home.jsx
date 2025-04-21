import React from 'react';
import { View, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { useAuth } from '../../context/authContext';
const Home = () => {
  const { logout, user } = useAuth();
  if(user != null){

  console.log("UserData : " + user.userType);

  if(user.userType == "student")
  return (
    <View>
      <Text>Student</Text>
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


  if(user.userType == "tutor")
    return (
      <View>
        <Text>Tutor</Text>
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


  }

};

export default Home;
