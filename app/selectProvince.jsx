import { View, Text, Pressable, FlatList, Alert } from 'react-native';
import React, { useState } from 'react';
import { Card, Button, Title } from 'react-native-paper'; // Import Paper components
import { provincesData } from '../assets/data/data';
import { useAuth } from '../context/authContext';

const SelectProvince = () => {
  const [selectedProvince, setSelectedProvince] = useState('');
  const { setSignUpInfo, register } = useAuth();

  const selectProvince = (province) => {
    console.log('Selected province:', province);
    setSelectedProvince(province);
    setSignUpInfo((prev) => ({
      ...prev,
      province: province,
    }));
  };

  const handleSubmit = () => {
    if (!selectedProvince) {
      console.log(
        '%cError: You must select a province!',
        'color: red; font-weight: bold;',
      );
      Alert.alert(
        'Validation Error',
        'Please select a province before proceeding.',
      );
      return;
    }

    console.log(
      '%cProvince selected successfully:',
      'color: green; font-weight: bold;',
      selectedProvince,
    );

    // Call the register function once a province is selected
    register();
  };

  return (
    <View className="flex-1 px-5 py-4 bg-bgLightGray">
      <Card className="p-4 mb-6 bg-white rounded-lg shadow-lg">
        <Title className="text-2xl text-center font-exoSemibold text-darkGrayText">
          Please Choose A Province in Jordan
        </Title>
      </Card>

      <FlatList
        data={provincesData}
        numColumns={2}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => selectProvince(item)}
            className={`w-[45%] m-2 p-4 rounded-lg ${
              selectedProvince === item
                ? 'bg-blue-500 border-2 border-blue-700'
                : 'bg-white border-2 border-gray-300'
            } shadow-lg transform transition-all duration-300 hover:scale-105`}
          >
            <Text
              className={`text-center font-exo font-semibold text-lg capitalize ${
                selectedProvince === item ? 'text-white' : 'text-darkGrayText'
              }`}
            >
              {item}
            </Text>
          </Pressable>
        )}
        contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}
      />

      <View className="flex items-center mt-5">
        <Button mode="contained" onPress={handleSubmit} className="w-full">
          {selectedProvince
            ? `Province Selected: ${selectedProvince}`
            : 'Select a Province'}
        </Button>
      </View>
    </View>
  );
};

export default SelectProvince;
