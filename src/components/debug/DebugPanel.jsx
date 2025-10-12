import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../../store/authStore";

export const DebugPanel = () => {
    const [isVisible, setIsVisible] = useState(false);

    const clearAsyncStorage = async () => {
        try {
            await AsyncStorage.clear();
            Alert.alert("Success", "AsyncStorage cleared");
            // Reload the app state
            window.location.reload();
        } catch (error) {
            Alert.alert("Error", "Failed to clear AsyncStorage");
            console.error(error);
        }
    };

    const viewAsyncStorage = async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const stores = await AsyncStorage.multiGet(keys);
            console.log("=== AsyncStorage Data ===");
            stores.forEach(([key, value]) => {
                console.log(`${key}:`, value);
            });
            Alert.alert("Check Console", "AsyncStorage data logged to console");
        } catch (error) {
            Alert.alert("Error", "Failed to read AsyncStorage");
            console.error(error);
        }
    };

    if (!__DEV__) {
        return null; // Only show in development mode
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setIsVisible(!isVisible)}
            >
                <Text style={styles.toggleText}>🔧 DEBUG</Text>
            </TouchableOpacity>

            {isVisible && (
                <View style={styles.panel}>
                    <Text style={styles.title}>Debug Panel</Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={viewAsyncStorage}
                    >
                        <Text style={styles.buttonText}>View AsyncStorage</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.dangerButton]}
                        onPress={clearAsyncStorage}
                    >
                        <Text style={styles.buttonText}>Clear All Storage</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 50,
        right: 10,
        zIndex: 9999,
    },
    toggleButton: {
        backgroundColor: "#333",
        padding: 8,
        borderRadius: 5,
        opacity: 0.7,
    },
    toggleText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "bold",
    },
    panel: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 15,
        marginTop: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        minWidth: 200,
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },
    status: {
        fontSize: 12,
        marginBottom: 15,
        textAlign: "center",
        color: "#666",
    },
    button: {
        backgroundColor: "#007AFF",
        padding: 10,
        borderRadius: 5,
        marginBottom: 8,
    },
    dangerButton: {
        backgroundColor: "#FF3B30",
    },
    buttonText: {
        color: "#fff",
        textAlign: "center",
        fontSize: 14,
        fontWeight: "600",
    },
});
