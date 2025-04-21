import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';

const Button = ({
  onPrimaryBtnPress,
  primaryBtnText,
  showSecondaryBtn = true,
  secondaryBtnText1,
  secondaryBtnText2,
  onSecondaryBtnPress,
}) => {
  return (
    <View className="flex flex-col items-center gap-8">
      {/** ====================== Main Button ============================= */}
      <Pressable
        onPress={onPrimaryBtnPress}
        className="py-3 bg-bgPurple px-7 rounded-xl w-[267px] max-h-[61px] flex items-center justify-center"
      >
        <Text className="text-xl text-center font-exoSemibold text-bgWhite">
          {primaryBtnText}
        </Text>
      </Pressable>
      {/** ====================== Secondary pressable ============================= */}
      {showSecondaryBtn ? (
        <View className="flex-row justify-center">
          <Text className="text-lg text-darkGrayText font-exo">
            {secondaryBtnText1}{' '}
          </Text>
          <Pressable onPress={onSecondaryBtnPress}>
            <Text className="text-lg font-exo text-bgPurple">
              {secondaryBtnText2}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

export default Button;
