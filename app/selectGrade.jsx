// eslint-disable-next-line import/namespace
import { useAuth } from '../context/authContext';
import { Platform, View, SafeAreaView, Alert } from 'react-native';
import React, { useState } from 'react';
import { Button } from 'react-native-paper'; // Importing the Button from React Native Paper
import SubjectSelector from '../components/subjectSelector';
import { gradesData } from '../assets/data/data';
import { useRouter } from 'expo-router';

const SelectGradeScreen = () => {
  const [selectedSubjects, setSelectedSubjects] = useState({}); // Object to store selected subjects for each grade
  const navigation = useRouter();
  const { setSignUpInfo } = useAuth();

  const updateSelectedSubjects = (grade, subjects) => {
    setSelectedSubjects((prevState) => ({
      ...prevState,
      [grade]: subjects,
    }));

    setSignUpInfo((prev) => ({
      ...prev,
      grade: {
        ...prev.grade,
        [grade]: subjects,
      },
    }));

    console.log(`Updated selected subjects for ${grade}:`, subjects);
  };

  const handleNext = () => {
    // Check if at least one subject is selected in any grade
    const isAnySubjectSelected = Object.values(selectedSubjects).some(
      (subjects) => subjects.length > 0,
    );

    if (!isAnySubjectSelected) {
      console.log(
        '%cError: Please select at least one subject!',
        'color: red; font-weight: bold;',
      );
      Alert.alert('Validation Error', 'Please select at least one subject.');
      return;
    }

    console.log(
      '%cAt least one subject selected, proceeding...',
      'color: green; font-weight: bold;',
    );
    // Proceed to the next screen if at least one subject is selected
    navigation.navigate('selectProvince');
  };

  return (
    <SafeAreaView className="py-8 px-7">
      <View className="mt-10">
        {gradesData.map((gradeItem, index) => (
          <SubjectSelector
            key={index}
            grade={gradeItem.grade}
            subjects={gradeItem.subjects}
            selectedSubjects={selectedSubjects[gradeItem.grade] || []}
            updateSelectedSubjects={updateSelectedSubjects}
          />
        ))}
      </View>

      {/** Action button */}
      <View className={Platform.OS === 'ios' ? 'mt-[30%]' : 'mt-[10%]'}>
        <Button
          mode="contained"
          onPress={handleNext}
          style={{ marginBottom: 10 }}
        >
          Next
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default SelectGradeScreen;
