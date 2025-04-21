import { Text, TextInput, View } from 'react-native';
import React from 'react';

const Input = ({ label, placeholder, last = false, Icon, value, onChange }) => {
  return (
    <View
      className={`flex flex-col gap-2 relative w-full ${last ? '' : 'mb-5'}`}
    >
      <Text className="text-base font-semibold font-exo text-darkGrayText">
        {label}
      </Text>
      {/** ====================== Text Input ============================= */}
      <View className="flex flex-row items-center justify-between h-12 px-4 bg-white rounded-lg shadow">
        <TextInput
          className={
            'font-exo flex items-center text-darkGrayText text-sm h-full w-full bg-white rounded-lg'
          }
          placeholder={placeholder}
          value={value}
          onChangeText={onChange}
          secureTextEntry={label === 'Password'}
        />
        {/** ====================== Optional Icon ============================= */}
        {Boolean(Icon) ? (
          <Icon
            className="absolute right-0 mr-4 text-lightGrayText"
            size={20}
          />
        ) : null}
      </View>
    </View>
  );
};

export default Input;
