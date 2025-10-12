import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Audio } from "expo-av";
import { useAuthStore } from "../../src/store/authStore";

export default function Onboarding() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [musicLoaded, setMusicLoaded] = useState(false);
    const router = useRouter();
    const soundRef = useRef(null);

    const onboardingSteps = [
        {
            title: "Welcome to Quran Chat Buddy",
            description: "Your companion for Quranic study and reflection",
            image: require("../../assets/splash.png"),
        },
        {
            title: "Explore the Quran",
            description:
                "Search verses, chapters and gain deeper understanding",
            image: require("../../assets/splash.png"),
        },
        {
            title: "Ask Questions",
            description:
                "Chat with an AI assistant about Quranic teachings and wisdom",
            image: require("../../assets/splash.png"),
        },
        {
            title: "Track Your Progress",
            description:
                "Set goals and track your reading and learning journey",
            image: require("../../assets/splash.png"),
        },
    ];

    // Audio setup and management
    useEffect(() => {
        let isMounted = true;

        const setupAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                });

                const { sound } = await Audio.Sound.createAsync(
                    require("../../assets/music/onboarding-bg.mp3"),
                    {
                        shouldPlay: true,
                        isLooping: true,
                        volume: 0.3,
                    }
                );

                if (isMounted) {
                    soundRef.current = sound;
                    setMusicLoaded(true);
                    setIsMusicPlaying(true);
                }
            } catch (error) {
                console.log("Error setting up audio:", error);
            }
        };

        setupAudio();

        return () => {
            isMounted = false;
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    // useEffect(() => {
    //     return () => {
    //         if (soundRef.current) {
    //             soundRef.current.unloadAsync();
    //         }
    //     };
    // }, []);

    const handleNext = () => {
        if (currentStep < onboardingSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeOnboarding();
        }
    };

    const handleSkip = () => {
        completeOnboarding();
    };

    const completeOnboarding = async () => {
        try {
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            }

            useAuthStore.getState().setOnboarded(true);
            // After onboarding, redirect to welcome/login screen
            router.replace("/(auth)/register");
        } catch (error) {
            console.log("Error saving onboarding status: ", error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="auto" />

            <View style={styles.skipContainer}>
                <View style={styles.topControls}>
                    <TouchableOpacity onPress={handleSkip}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.contentContainer}>
                <Image
                    source={onboardingSteps[currentStep].image}
                    style={styles.image}
                    resizeMode="contain"
                />

                <Text style={styles.title}>
                    {onboardingSteps[currentStep].title}
                </Text>
                <Text style={styles.description}>
                    {onboardingSteps[currentStep].description}
                </Text>
            </View>

            <View style={styles.paginationContainer}>
                {onboardingSteps.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            index === currentStep && styles.paginationDotActive,
                        ]}
                    />
                ))}
            </View>

            <TouchableOpacity style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>
                    {currentStep === onboardingSteps.length - 1
                        ? "Get Started"
                        : "Next"}
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    skipContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    topControls: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
    },
    musicButton: {
        padding: 8,
    },
    skipText: {
        fontSize: 16,
        color: "#666",
    },
    contentContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    image: {
        width: 280,
        height: 280,
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 16,
        color: "#333",
    },
    description: {
        fontSize: 16,
        textAlign: "center",
        color: "#666",
        paddingHorizontal: 20,
    },
    paginationContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 40,
    },
    paginationDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#ccc",
        marginHorizontal: 5,
    },
    paginationDotActive: {
        backgroundColor: "#4CAF50", // Green color theme
    },
    button: {
        backgroundColor: "#4CAF50",
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 30,
        marginBottom: 50,
        marginHorizontal: 30,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
});
