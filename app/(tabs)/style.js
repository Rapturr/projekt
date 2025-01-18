import { StyleSheet } from "react-native";
const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#1a1a1a",
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingVertical: "16",
  },
  header2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 20,
  },
  title: {
    marginBottom: 30,
    fontSize: 28,
    fontWeight: "bold",
    color: "#f2f2f2",
  },
  input: {
    color: "#f2f2f2",
    width: 300,
    padding: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderRadius: 30,
    backgroundColor: "#404040",
  },
  input2: {
    color: "#f2f2f2",
    width: 300,
    height: 60,
    padding: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderRadius: 30,
    backgroundColor: "#404040",
  },
  modalInput: {
    width: 300,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 16,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#ffa31a",
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  button2: {
    flex: 1, // Każdy przycisk zajmuje tyle samo miejsca
    marginHorizontal: 5, // Dodanie odstępu między przyciskami
    backgroundColor: '#6200EE',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  imageButtonContainer: {
    flexDirection: 'row', // Ustawienie wiersza
    justifyContent: 'space-between', // Odstępy między przyciskami
    width: '100%', // Ustawienie szerokości kontenera
    marginVertical: 10,
  },
  buttonText: {
    fontWeight: "bold",
    color: "#f2f2f2",
    fontSize: 16,
    textAlign: "center",
    paddingLeft: 20,
    paddingRight: 20,
  },
  buttonCancel: {
    backgroundColor: "#444",
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  taskName: {
    color: "#f2f2f2",
    fontSize: 18,
    padding: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#444",
  },
  taskContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    marginBottom: 10,
    backgroundColor: "#202020",
    borderRadius: 10,
  },
  addButton: {
    backgroundColor: "#ffa31a",
    padding: 12,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    width: 55,
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffa31a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    marginLeft: 8,
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  task: {
    fontSize: 18,
    padding: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#fff",
  },
  taskImage: {
    width: 80,
    height: 80,
    marginVertical: 10,
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  link: {
    color: "#f5f5f5",
  },
});

export default styles;
