import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const STORAGE_KEY = "@ikariam_cookie";
const SERVER_URL = "https://s67-fr.ikariam.gameforge.com";

export default function LoginScreen() {
  const [cookie, setCookie] = useState("");
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    loadCookie();
  }, []);

  const loadCookie = async () => {
    try {
      const savedCookie = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedCookie) {
        setCookie(savedCookie);
        await testConnection(savedCookie);
      }
    } catch (error) {
      console.error("Erreur chargement cookie:", error);
    }
  };

  const saveCookie = async (cookieValue: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, cookieValue);
    } catch (error) {
      console.error("Erreur sauvegarde cookie:", error);
    }
  };

  const testConnection = async (cookieValue: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${SERVER_URL}/?view=city`, {
        headers: {
          Cookie: `ikariam=${cookieValue}`,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data) {
        setIsConnected(true);
        await saveCookie(cookieValue);
        Alert.alert("✅ Succès", "Connexion réussie au serveur Ikariam !");
      }
    } catch (error: any) {
      setIsConnected(false);
      Alert.alert(
        "❌ Erreur",
        error.message || "Impossible de se connecter au serveur"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    if (!cookie.trim()) {
      Alert.alert("⚠️ Erreur", "Veuillez entrer votre cookie de session");
      return;
    }
    testConnection(cookie.trim());
  };

  const handleDisconnect = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setCookie("");
    setIsConnected(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>⚔️ Ikariam Mobile</Text>
          <Text style={styles.subtitle}>
            Serveur: s67-fr.ikariam.gameforge.com
          </Text>
        </View>

        {!isConnected ? (
          <View style={styles.form}>
            <Text style={styles.label}>Cookie de session</Text>
            <TextInput
              style={styles.input}
              value={cookie}
              onChangeText={setCookie}
              placeholder="100554_f45bf5d0af513e7e246f22dfcbbc86e9"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.helpBox}>
              <Text style={styles.helpTitle}>
                📋 Comment récupérer le cookie ?
              </Text>
              <Text style={styles.helpText}>
                1. Ouvre Ikariam dans ton navigateur{"\n"}
                2. Appuie sur F12 puis onglet Console{"\n"}
                3. Tape : document.cookie{"\n"}
                4. Copie uniquement la valeur après "ikariam="
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleConnect}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successText}>Connecté avec succès</Text>
            <Text style={styles.successSubtext}>
              Cookie enregistré et validé
            </Text>

            <TouchableOpacity
              style={[styles.button, styles.buttonDanger]}
              onPress={handleDisconnect}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1419",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#e6c86f",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#8b8b8b",
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  label: {
    color: "#e6c86f",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#1a2332",
    color: "#fff",
    padding: 16,
    borderRadius: 12,
    fontSize: 14,
    minHeight: 90,
    borderWidth: 1,
    borderColor: "#2a3648",
    textAlignVertical: "top",
  },
  helpBox: {
    backgroundColor: "#1a2332",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#e6c86f",
  },
  helpTitle: {
    color: "#e6c86f",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  helpText: {
    color: "#aaa",
    fontSize: 13,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#c77d3f",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonDanger: {
    backgroundColor: "#d9534f",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  successText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4caf50",
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 15,
    color: "#8b8b8b",
    marginBottom: 40,
  },
});
