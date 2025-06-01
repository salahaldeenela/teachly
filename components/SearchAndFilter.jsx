import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Button } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { provincesData } from '../assets/data/data';

const subjects = [
  'Arabic', 'Math', 'Physics', 'Science', 'Social Studies', 'Chemistry',
  'Biology', 'History', 'Geography', 'Islamic Studies', 'English', 'Economics',
];
const gradesOptions = [
  "Grade 1-3",
  "Grade 4-6",
  "Grade 7-9",
  "Grade 10-12",
];
const SearchAndFilter = ({ tutorsData, onResultsFiltered }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    province: '',
    rating: 0,
    gender: '',
    grade: '',
  });

  const handleClearFilters = () => {
    setFilters({
      subject: '',
      location: '',
      rating: 0,
      gender: '',
      grade: '',
    });
    setSearchQuery('');
    setShowFilters(false);
    onResultsFiltered(tutorsData);
  };

  const toggleGender = (selectedGender) => {
    setFilters((prev) => ({
      ...prev,
      gender: prev.gender === selectedGender ? '' : selectedGender,
    }));
  };

  const handleSearchQuery = () => {
    const filtered = tutorsData.filter((tutor) => {
      return tutor.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
    onResultsFiltered(filtered);
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
    const filtered = tutorsData.filter((tutor) => {
      const matchesGrade =
      !filters.grade ||
      Object.keys(tutor.grade).includes(filters.grade);

    const matchesSubject =
      !filters.subject ||
      Object.values(tutor.grade).some((g) => g.includes(filters.subject));
      

      const matchesLocation =
        !filters.province || tutor.province === filters.province;

      const matchesGender =
        !filters.gender || tutor.gender === filters.gender;

      const avgRating =
        tutor.reviews && tutor.reviews.length > 0
          ? tutor.reviews.reduce((sum, r) => sum + Number(r.rating), 0) / tutor.reviews.length
          : 0;
      const matchesRating =
        !filters.rating || avgRating >= filters.rating;

      return (
        matchesSubject &&
        matchesLocation &&
        matchesGender &&
        matchesRating &&
        matchesGrade
      );
    });

    onResultsFiltered(filtered);
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <TextInput
          style={[styles.searchBar, { flex: 1 }]}
          placeholder="Search"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={handleSearchQuery} style={{ marginLeft: 8 }}>
          <MaterialIcons name="search" size={28} color="#007bff" />
        </TouchableOpacity>
        
        {/* Filter Icon */}
        <TouchableOpacity
          style={{ marginLeft: 8 }}
          onPress={() => setShowFilters(!showFilters)}
        >
          <MaterialIcons name={showFilters ? 'filter-list' : 'filter-alt'} size={28} color="#007bff" />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterTitle}>Filters</Text>

          {/* Subject Dropdown */}
          <Text>Subject:</Text>
          <View style={styles.dropdown}>
            <Picker
              selectedValue={filters.subject}
              onValueChange={(value) => setFilters({ ...filters, subject: value })}
            >
              <Picker.Item label="Select subject" value="" />
              {subjects.map((subject) => (
                <Picker.Item label={subject} value={subject} key={subject} />
              ))}
            </Picker>
          </View>

          {/* Grade Dropdown */}
          <Text>Grade:</Text>
          <View style={styles.dropdown}>
            <Picker
              selectedValue={filters.grade}
              onValueChange={(value) => setFilters({ ...filters, grade: value })}
            >
              <Picker.Item label="Select grade" value="" />
              {Array.from({ length: 4 }, (_, i) => (
                <Picker.Item
                  key={i + 1}
                  label={gradesOptions[i]}
                  value={gradesOptions[i]}
                />
              ))}
            </Picker>
          </View>

          {/* Province Dropdown */}
          <Text>Province:</Text>
          <View style={styles.dropdown}>
            <Picker
              selectedValue={filters.province}
              onValueChange={(value) => setFilters({ ...filters, province: value })}
            >
              <Picker.Item label="Select province" value="" />
              {provincesData.map((loc) => (
                <Picker.Item label={loc} value={loc} key={loc} />
              ))}
            </Picker>
          </View>

          {/* Gender Select */}
          <Text>Gender:</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[styles.genderButton, filters.gender === 'male' && styles.selectedButton]}
              onPress={() => toggleGender('male')}
            >
              <Text style={styles.genderText}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, filters.gender === 'female' && styles.selectedButton]}
              onPress={() => toggleGender('female')}
            >
              <Text style={styles.genderText}>Female</Text>
            </TouchableOpacity>
          </View>

          {/* Rating Stars */}
          <Text>Minimum Rating:</Text>
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setFilters({ ...filters, rating: star })}>
                <MaterialIcons
                  name={star <= filters.rating ? 'star' : 'star-border'}
                  size={32}
                  color="#ffd700"
                />
              </TouchableOpacity>
            ))}
          </View>

          <Button
            mode="outlined"
            onPress={() => setFilters({ ...filters, rating: 5 })}
            style={styles.button}
          >
            Sort by Highest Rating
          </Button>
          <Button onPress={handleApplyFilters} mode="contained" style={styles.button}>
            Apply Filters
          </Button>
          <Button mode="text" onPress={handleClearFilters}>
            Clear Filters
          </Button>
        </View>
      )}
    </View>
  );
};

export default SearchAndFilter;

const styles = StyleSheet.create({
  searchBar: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
  },
  filtersContainer: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  filterTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 16,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginRight: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#d0ebff',
    borderColor: '#007bff',
  },
  genderText: {
    fontWeight: 'bold',
  },
  starContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  button: {
    marginBottom: 10,
  },
});