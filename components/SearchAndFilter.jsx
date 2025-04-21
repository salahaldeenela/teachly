import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Button } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';

const subjects = ['Math', 'Science', 'English', 'History'];
const locations = ['Amman', 'Irbid', 'Zarqa', 'Aqaba'];

const SearchAndFilter = ({ searchQuery, setSearchQuery, filters, setFilters }) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleClearFilters = () => {
    setFilters({
      price: 'none',
      subject: '',
      location: '',
      rating: 0,
      gender: '',
      free: false,
    });
  };

  const toggleGender = (selectedGender) => {
    setFilters((prev) => ({
      ...prev,
      gender: prev.gender === selectedGender ? '' : selectedGender,
    }));
  };

  const toggleFree = () => {
    setFilters((prev) => ({
      ...prev,
      free: !prev.free,
      price: !prev.free ? 'free' : 'none',
    }));
  };

  return (
    <View>
      <TextInput
        style={styles.searchBar}
        placeholder="Search"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <TouchableOpacity onPress={() => setShowFilters((prev) => !prev)}>
        <Text style={styles.toggleFiltersText}>
          {showFilters ? 'Hide Filters ▲' : 'Show Filters ▼'}
        </Text>
      </TouchableOpacity>

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

          {/* Location Dropdown */}
          <Text>Location:</Text>
          <View style={styles.dropdown}>
            <Picker
              selectedValue={filters.location}
              onValueChange={(value) => setFilters({ ...filters, location: value })}
            >
              <Picker.Item label="Select location" value="" />
              {locations.map((loc) => (
                <Picker.Item label={loc} value={loc} key={loc} />
              ))}
            </Picker>
          </View>

          {/* Gender Select */}
          <Text>Gender:</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                filters.gender === 'male' && styles.selectedButton,
              ]}
              onPress={() => toggleGender('male')}
            >
              <Text style={styles.genderText}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                filters.gender === 'female' && styles.selectedButton,
              ]}
              onPress={() => toggleGender('female')}
            >
              <Text style={styles.genderText}>Female</Text>
            </TouchableOpacity>
          </View>

          {/* Free Option */}
          <Text>Free Option:</Text>
          <TouchableOpacity
            style={[
              styles.freeButton,
              filters.free && styles.selectedButton,
            ]}
            onPress={toggleFree}
          >
            <Text style={styles.genderText}>Free</Text>
          </TouchableOpacity>

          {/* Rating Stars */}
          <Text>Minimum Rating:</Text>
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setFilters({ ...filters, rating: star })}
              >
                <MaterialIcons
                  name={star <= filters.rating ? 'star' : 'star-border'}
                  size={32}
                  color="#ffd700"
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Sorting */}
          <Button
            mode="outlined"
            onPress={() => setFilters({ ...filters, price: 'low', rating: 0 })}
            style={styles.button}
          >
            Sort by Lowest Price
          </Button>
          <Button
            mode="outlined"
            onPress={() => setFilters({ ...filters, rating: 5, price: 'none' })}
            style={styles.button}
          >
            Sort by Highest Rating
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
    marginBottom: 10,
  },
  toggleFiltersText: {
    color: '#007bff',
    marginBottom: 10,
    textAlign: 'right',
    marginRight: 10,
    fontWeight: 'bold',
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
  freeButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  starContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  button: {
    marginBottom: 10,
  },
});
