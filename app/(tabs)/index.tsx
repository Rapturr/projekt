import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet, TouchableOpacity, Modal, Image, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import styles from './style';

const API_URL = 'http://10.0.2.2:5000';

/*const axiosWithoutInterceptors = axios.create({
  baseURL: 'https://10.0.2.2:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});
axiosWithoutInterceptors.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Axios error details:', {
      message: error.message,
      config: error.config,
      response: error.response?.data,
    });
    return Promise.reject(error);
  }
);*/


export default function App() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  const [taskNames, setTaskNames] = useState([]);
  const [selectedTaskName, setSelectedTaskName] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [isAddingTaskName, setIsAddingTaskName] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [taskPhotos, setTaskPhotos] = useState({});

  useEffect(() => {
    try {//Sprawdzamy czy aplikacja została otwarta w iframe, i przenosimy ją na najwyższy poziom
      if (window.self !== window.top) {
        console.warn('App is being loaded in an iframe. Redirecting...');
        alert('Aplikacja nie może być uruchamiana w osadzeniu.');
        window.top.location = window.self.location;
        return;
      } else {
          console.warn('window.top.location is not accessible.');
        }
    } catch (error) {
      console.error('Clickjacking protection failed:', error);
    }

    const loadToken = async () => {
      const savedToken = await AsyncStorage.getItem('token');
      if (savedToken) {
        setToken(savedToken);
        await fetchTaskNames(savedToken);
      }
    };
    loadToken();
    
  }, []);

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access camera was denied');
      return;
    }
  
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };
  

  

  // Funkcja prosząca o dostęp do plików
  const requestFilePermission = async () => {
    const { status } = await FileSystem.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission to access file system was denied');
  }
  };

  /*const handleLogin = async () => {
    try {
      const response = await fetch('https://10.0.2.2:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login: username, password }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      await AsyncStorage.setItem('token', data.token);
      setToken(data.token);
      fetchTaskNames(data.token);
    } catch (error) {
      Alert.alert('Login failed', error.message);
    }
  };
*/
  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        login: username,
        password,
      });
      await AsyncStorage.setItem('token', response.data.token);
      setToken(response.data.token);
      fetchTaskNames(response.data.token);
    } catch (error) {
      if (error.response) {
        const { status } = error.response;
        switch (status) {
          case 401:
            Alert.alert('Login failed', 'Invalid username or password');
            break;
          case 429: // Too Many Requests
            Alert.alert(
              'Too Many Attempts',
              'You have exceeded the maximum number of login attempts. Please wait 3 minutes and try again.'
            );
            break;
          default:
            Alert.alert('Error', 'Something went wrong. Please try again later.');
        }
      }
    }
  };

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const handleRegister = async () => {
    if (!passwordRegex.test(password)) {
      Alert.alert(
        "Invalid Password",
        "Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character."
      );
      return;
    }
    try {
      const registerResponse = await axios.post(`${API_URL}/register`, {
        login: username,
        password,
      });

      await AsyncStorage.setItem('token', registerResponse.data.token);
      setToken(registerResponse.data.token);
      fetchTaskNames(registerResponse.data.token);
      Alert.alert('Success', 'User registered and logged in.');
    } catch (error) {
      Alert.alert('Error', 'Failed to register user');
    }
  };

  //Pobranie nazw list zadań i zdjęć
  const fetchTaskNames = async (authToken) => {
    try {
      const response = await axios.get(`${API_URL}/tasknames`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
  
      const taskNames = response.data;
      setTaskNames(taskNames);
  
      const photosPromises = taskNames.map((task) =>
        fetchPhoto(task.taskname, authToken)
      );
  
      await Promise.all(photosPromises);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch task names');
      console.error(error);
    }
  };
  //Pobranie zadań dla danej listy
  const fetchTasks = async (taskName) => {
    try {
      const response = await axios.get(`${API_URL}/tasks/${taskName}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data);
      setSelectedTaskName(taskName);
  
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch tasks');
    }
  };
  //Dodanie zadania
  const addTask = async () => {
    try {
      await axios.post(
        `${API_URL}/tasks`,
        { content: newTask, taskname: selectedTaskName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewTask('');
      fetchTasks(selectedTaskName);
    } catch (error) {
      Alert.alert('Error', 'Failed to add task');
    }
  };
  //Dodanie listy zadań
  const addNewTaskName = async () => {
    try {
      await axios.post(
        `${API_URL}/tasks`,
        { content: newTask, taskname: newTaskName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const formData = new FormData();
      formData.append('photo', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'photo.jpg'
      });
      
      await axios.post(
        `${API_URL}/tasks/${newTaskName}/photo`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
  
      setNewTask('');
      setIsAddingTaskName(false);
  
      fetchTasks(selectedTaskName);
      fetchTaskNames(token);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add task');
    }
  };
  
  //Usuwanie zadań
  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks(selectedTaskName);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete task');
    }
  };
  //Usuwanie listy zadań
  const deleteTaskName = async (taskName) => {
    try {
      await axios.delete(`${API_URL}/tasknames/${taskName}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTaskNames((prevTaskNames) =>
        prevTaskNames.filter((item) => item.taskname !== taskName)
      );
      setSelectedTaskName(null);
      setTasks([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete taskname');
    }
  };
  //Wylogowanie użytkownika 
  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setTaskNames([]);
    setSelectedTaskName(null);
    setTasks([]);
  };

  //Wybór zdjęcia na ikonkę listy
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access gallery was denied');
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };
  //Pobranie zdjęć z serwera
  const fetchPhoto = async (taskName, authToken) => {
    try {
      const response = await axios.get(`${API_URL}/tasks/${taskName}/photos`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
  
      if (response.data.length > 0) {
        // Dodanie zdjęcia do taskPhotos
        setTaskPhotos((prevPhotos) => ({
          ...prevPhotos,
          [taskName]: `data:image/jpeg;base64,${response.data[0].photo}`,
        }));
      }
    } catch (error) {
      console.error(`Failed to fetch photo for task: ${taskName}`, error);
    }
  };


    if (!token) {
      return (
        <View style={styles.centeredContainer}>
        
        {isRegistering ? (
          <>
            <Text style={styles.title}>Register</Text>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              />
            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsRegistering(false)}>
              <Text style={styles.link}>Back to Login</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Login</Text>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              />
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsRegistering(true)}>
              <Text style={styles.link}>Don't have an account? Register</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }
  
  if (!selectedTaskName) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={taskNames}
          keyExtractor={(item) => item.taskname}
          renderItem={({ item }) => (
            <View style={styles.taskContainer}>
              {taskPhotos[item.taskname] && (
                <Image
                source={{ uri: taskPhotos[item.taskname] }}
                style={styles.taskImage}
                />
              )}

              <TouchableOpacity onPress={() => fetchTasks(item.taskname)}>
                <Text style={styles.taskName}>{item.taskname}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteTaskName(item.taskname)}>
                <Ionicons name="trash" size={24} color="rgb(255, 55, 55)" />
              </TouchableOpacity>
            </View>
          )}
          />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddingTaskName(true)}
          >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
        {/* Modal to add new taskname */}
      
      
      <Modal visible={isAddingTaskName} animationType="slide">
        <View style={styles.centeredContainer}>
          <Text style={styles.title}>Create Task List</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Task Name"
            value={newTaskName}
            onChangeText={setNewTaskName}
            />
          <TextInput
            style={styles.modalInput}
            placeholder="First Task"
            value={newTask}
            onChangeText={setNewTask}
            />

          {/* Wybór zdjęcia lub robienie zdjęcia */}
          
          <View style={styles.imageButtonContainer}>
            <TouchableOpacity style={styles.button2} onPress={pickImage}>
              <Text style={styles.buttonText}>Pick an Image</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button2} onPress={takePicture}>
              <Text style={styles.buttonText}>Take a Picture</Text>
            </TouchableOpacity>
          </View>

          {selectedImage && (
            <Image
            source={{ uri: selectedImage }}
            style={{ width: 200, height: 200, marginVertical: 10 }}
            />
          )}

          

          <TouchableOpacity style={styles.button} onPress={addNewTaskName}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonCancel}
            onPress={() => setIsAddingTaskName(false)}
            >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header2}>
        <TouchableOpacity onPress={() => setSelectedTaskName(null)}>
          <Ionicons name="arrow-back" size={24} color="#f2f2f2" />
        </TouchableOpacity>
        <Text style={styles.title}>{`${selectedTaskName}`}</Text>
      </View>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.taskContainer}>
            <Text style={styles.taskName}>{item.content}</Text>
            <TouchableOpacity onPress={() => deleteTask(item.id)}>
              <Ionicons name="trash" size={24} color="rgb(255, 55, 55)" />
            </TouchableOpacity>
          </View>
        )}
        />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input2}
          placeholder="New Task"
          value={newTask}
          onChangeText={setNewTask}
          />
        <TouchableOpacity style={styles.addButton} onPress={addTask}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
}
