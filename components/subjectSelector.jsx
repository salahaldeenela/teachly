import { View, Text, Pressable, FlatList } from 'react-native';
import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'react-native-heroicons/solid';

const SubjectSelector = ({
  grade,
  subjects,
  selectedSubjects,
  updateSelectedSubjects,
}) => {
  const [showDropDown, setShowDropDown] = useState(false);

  const toggleDropdown = () => {
    setShowDropDown(!showDropDown);
  };

  const toggleSubjectSelection = (subject) => {
    const newSelectedSubjects = selectedSubjects.includes(subject)
      ? selectedSubjects.filter((item) => item !== subject)
      : [...selectedSubjects, subject];

    // Update the selected subjects for the current grade
    updateSelectedSubjects(grade, newSelectedSubjects);
  };

  return (
    <View className="flex justify-center bg-gray-100 min-h-14 py-4 rounded-lg mb-[18px]">
      <Pressable onPress={toggleDropdown} className="flex px-4">
        <View className="flex flex-row items-center justify-between">
          <Text className="text-lg font-semibold">{grade}</Text>
          {!showDropDown ? (
            <ChevronDownIcon style={{ color: 'gray' }} />
          ) : (
            <ChevronUpIcon style={{ color: 'gray' }} />
          )}
        </View>

        {/** Dropdown with dynamic subject options based on grade */}
        {showDropDown ? (
          <FlatList
            data={subjects}
            numColumns={2} // Handle the wrapping by using numColumns
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable
                className={`space-x-3 flex-row w-[45%] items-center justify-center m-2 rounded-[10px] py-3 ${
                  selectedSubjects.includes(item)
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                }`}
                onPress={() => toggleSubjectSelection(item)}
              >
                <Text
                  className={`text-center font-semibold text-base ${
                    selectedSubjects.includes(item)
                      ? 'text-white'
                      : 'text-gray-700'
                  }`}
                >
                  {item}
                </Text>
              </Pressable>
            )}
            contentContainerStyle={{
              paddingHorizontal: 10,
            }}
            scrollEnabled={true} // Enable scrolling on the FlatList
          />
        ) : null}
      </Pressable>
    </View>
  );
};

export default SubjectSelector;
