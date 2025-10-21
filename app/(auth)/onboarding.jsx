// app/(auth)/onboarding.jsx - Enhanced with AI Chat & Permissions
import { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useAuthStore } from "../../src/store/authStore";

const ONBOARDING_QUESTIONS = [
    {
        id: "name",
        type: "text",
        message:
            "Assalamu Alaikum! 🌙\n\nI'm your Quran Chat Buddy AI Assistant. I'm here to help you on your Islamic journey. Let's get to know each other better! What should I call you?",
        placeholder: "Enter your name",
        key: "userName",
    },
    {
        id: "knowledge_level",
        type: "choice",
        message: "How would you describe your current Islamic knowledge level?",
        options: [
            {
                label: "Beginner - Just starting",
                value: "Beginner - Just starting",
                emoji: "🌱",
            },
            {
                label: "Intermediate - Some knowledge",
                value: "Intermediate - Some knowledge",
                emoji: "📚",
            },
            {
                label: "Advanced - Well-versed",
                value: "Advanced - Well-versed",
                emoji: "🎓",
            },
        ],
        key: "knowledgeLevel",
    },
    {
        id: "prayer_frequency",
        type: "choice",
        message: "How often do you currently pray?",
        options: [
            {
                label: "All 5 daily prayers",
                value: "All 5 daily prayers",
                emoji: "🕌",
            },
            {
                label: "Some prayers regularly",
                value: "Some prayers regularly",
                emoji: "🤲",
            },
            { label: "Occasionally", value: "Occasionally", emoji: "🌟" },
            { label: "Learning", value: "Learning", emoji: "📖" },
        ],
        key: "prayerFrequency",
    },
    {
        id: "quran_reading",
        type: "choice",
        message: "How familiar are you with reading the Quran?",
        options: [
            { label: "Regularly", value: "Regularly", emoji: "📖" },
            { label: "Occasionally", value: "Occasionally", emoji: "📚" },
            { label: "Just starting", value: "Just starting", emoji: "🌱" },
            { label: "Want to learn", value: "Want to learn", emoji: "✨" },
        ],
        key: "quranReading",
    },
    {
        id: "goals",
        type: "multichoice",
        message: "What would you like to achieve? (Select all that apply)",
        options: [
            {
                label: "Learn more about Islam",
                value: "Learn more about Islam",
                emoji: "📚",
            },
            {
                label: "Improve prayer habits",
                value: "Improve prayer habits",
                emoji: "🕌",
            },
            { label: "Read the Quran", value: "Read the Quran", emoji: "📖" },
            {
                label: "Ask Islamic questions",
                value: "Ask Islamic questions",
                emoji: "🤔",
            },
            {
                label: "Build daily habits",
                value: "Build daily habits",
                emoji: "🌟",
            },
        ],
        key: "goals",
    },
];

export default function Onboarding() {
    // Phase management
    const [phase, setPhase] = useState("welcome"); // welcome, chat, permissions
    const [currentStep, setCurrentStep] = useState(0);

    // Audio state
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [musicLoaded, setMusicLoaded] = useState(false);
    const soundRef = useRef(null);

    // Chat state
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [userData, setUserData] = useState({});
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [isTyping, setIsTyping] = useState(false);

    // Permissions state
    const [locationStatus, setLocationStatus] = useState("pending");
    const [notificationStatus, setNotificationStatus] = useState("pending");

    const router = useRouter();
    const scrollViewRef = useRef(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const welcomeSteps = [
        {
            title: "Welcome to Quran Chat Buddy",
            description: "Your AI companion for Quranic study and reflection",
            image: require("../../assets/splash.png"),
        },
        {
            title: "Explore the Quran",
            description:
                "Read verses with translations and track your progress",
            image: require("../../assets/splash.png"),
        },
        {
            title: "Ask Questions",
            description: "Chat with AI about Islamic teachings and wisdom",
            image: require("../../assets/splash.png"),
        },
        {
            title: "Track Your Progress",
            description: "Daily quiz, prayer times, and reading streaks",
            image: require("../../assets/splash.png"),
        },
    ];

    // Audio setup - plays throughout onboarding
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
            // Don't unload here - keep playing
        };
    }, []);

    // Toggle music
    const toggleMusic = async () => {
        if (!soundRef.current) return;

        try {
            if (isMusicPlaying) {
                await soundRef.current.pauseAsync();
                setIsMusicPlaying(false);
            } else {
                await soundRef.current.playAsync();
                setIsMusicPlaying(true);
            }
        } catch (error) {
            console.log("Error toggling music:", error);
        }
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        if (phase === "chat") {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    // Start chat phase
    const startChat = () => {
        setPhase("chat");
    };

    // Show next question
    const showNextQuestion = () => {
        if (currentQuestionIndex >= ONBOARDING_QUESTIONS.length) {
            // Move to permissions phase
            setPhase("permissions");
            return;
        }
        console.log(
            12345,
            currentQuestionIndex,
            ONBOARDING_QUESTIONS[currentQuestionIndex],
            messages
        );
        const question = ONBOARDING_QUESTIONS[currentQuestionIndex];

        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    type: "ai",
                    content: question.message,
                    question: question,
                    timestamp: new Date(),
                },
            ]);

            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }, 1000);
    };

    // Handle text input submit
    const handleTextSubmit = () => {
        if (!userInput.trim()) return;

        const question = ONBOARDING_QUESTIONS[currentQuestionIndex];

        setMessages((prev) => [
            ...prev,
            {
                type: "user",
                content: userInput,
                timestamp: new Date(),
            },
        ]);

        const newUserData = { ...userData, [question.key]: userInput };
        setUserData(newUserData);
        saveToStorage(newUserData);

        setUserInput("");
        setCurrentQuestionIndex((prev) => prev + 1);
    };

    // Handle choice selection
    const handleChoiceSelect = (option) => {
        const question = ONBOARDING_QUESTIONS[currentQuestionIndex];

        if (question.type === "multichoice") {
            const newSelected = selectedOptions.includes(option.value)
                ? selectedOptions.filter((v) => v !== option.value)
                : [...selectedOptions, option.value];
            setSelectedOptions(newSelected);
        } else {
            // Single choice
            setMessages((prev) => [
                ...prev,
                {
                    type: "user",
                    content: option.label,
                    timestamp: new Date(),
                },
            ]);

            const newUserData = { ...userData, [question.key]: option.value };
            setUserData(newUserData);
            saveToStorage(newUserData);

            setCurrentQuestionIndex((prev) => prev + 1);
        }
    };

    // Handle multi-choice submit
    const handleMultiChoiceSubmit = () => {
        if (selectedOptions.length === 0) return;

        const question = ONBOARDING_QUESTIONS[currentQuestionIndex];
        const selectedLabels = question.options
            .filter((opt) => selectedOptions.includes(opt.value))
            .map((opt) => opt.label)
            .join(", ");

        setMessages((prev) => [
            ...prev,
            {
                type: "user",
                content: selectedLabels,
                timestamp: new Date(),
            },
        ]);

        const newUserData = { ...userData, [question.key]: selectedOptions };
        setUserData(newUserData);
        saveToStorage(newUserData);

        setSelectedOptions([]);
        setCurrentQuestionIndex((prev) => prev + 1);
    };

    useEffect(() => {
        const timer = setTimeout(showNextQuestion, 100);
        return () => clearTimeout(timer);
    }, [currentQuestionIndex]);

    // Save data to AsyncStorage
    const saveToStorage = async (data) => {
        try {
            await AsyncStorage.setItem("onboarding_data", JSON.stringify(data));
            await AsyncStorage.setItem(
                "onboarding_timestamp",
                new Date().toISOString()
            );
        } catch (error) {
            console.error("Error saving data:", error);
        }
    };

    // Request location permission
    const requestLocationPermission = async () => {
        try {
            const { status } =
                await Location.requestForegroundPermissionsAsync();

            if (status === "granted") {
                setLocationStatus("granted");
                const location = await Location.getCurrentPositionAsync({});
                await AsyncStorage.setItem(
                    "user_location",
                    JSON.stringify({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        timestamp: new Date().toISOString(),
                    })
                );
            } else {
                setLocationStatus("denied");
            }
        } catch (error) {
            console.error("Error requesting location:", error);
            setLocationStatus("denied");
        }
    };

    // Request notification permission
    const requestNotificationPermission = async () => {
        try {
            const { status } = await Notifications.requestPermissionsAsync();

            if (status === "granted") {
                setNotificationStatus("granted");
                await AsyncStorage.setItem("notifications_enabled", "true");
            } else {
                setNotificationStatus("denied");
            }
        } catch (error) {
            console.error("Error requesting notifications:", error);
            setNotificationStatus("denied");
        }
    };

    // Complete onboarding
    const completeOnboarding = async () => {
        try {
            // Stop and unload audio
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            }

            // Mark onboarding as complete
            await AsyncStorage.setItem("onboarding_completed", "true");
            await AsyncStorage.setItem(
                "onboarding_completed_date",
                new Date().toISOString()
            );

            useAuthStore.getState().setOnboarded(true);
            router.replace("/(auth)/register");
        } catch (error) {
            console.log("Error completing onboarding:", error);
        }
    };

    // Skip to end
    const handleSkip = () => {
        if (phase === "welcome") {
            startChat();
        }
    };

    // Render message
    const renderMessage = (message, index) => {
        if (message.type === "ai") {
            return (
                <View key={index} style={styles.aiMessageContainer}>
                    <View style={styles.aiAvatar}>
                        <Text style={styles.aiAvatarText}>🤖</Text>
                    </View>
                    <View style={styles.aiMessageBubble}>
                        <Text style={styles.aiMessageText}>
                            {message.content}
                        </Text>
                    </View>
                </View>
            );
        } else {
            return (
                <View key={index} style={styles.userMessageContainer}>
                    <View style={styles.userMessageBubble}>
                        <Text style={styles.userMessageText}>
                            {message.content}
                        </Text>
                    </View>
                </View>
            );
        }
    };

    // Render input area based on question type
    const renderInputArea = () => {
        const currentQuestion = ONBOARDING_QUESTIONS[currentQuestionIndex];
        if (!currentQuestion) return null;

        if (currentQuestion.type === "text") {
            return (
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder={currentQuestion.placeholder}
                        value={userInput}
                        onChangeText={setUserInput}
                        onSubmitEditing={handleTextSubmit}
                        returnKeyType="send"
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            !userInput.trim() && styles.sendButtonDisabled,
                        ]}
                        onPress={handleTextSubmit}
                        disabled={!userInput.trim()}
                    >
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            );
        }

        if (currentQuestion.type === "choice") {
            return (
                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.optionButton}
                            onPress={() => handleChoiceSelect(option)}
                        >
                            <Text style={styles.optionEmoji}>
                                {option.emoji}
                            </Text>
                            <Text style={styles.optionText}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            );
        }

        if (currentQuestion.type === "multichoice") {
            return (
                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.optionButton,
                                selectedOptions.includes(option.value) &&
                                    styles.optionButtonSelected,
                            ]}
                            onPress={() => handleChoiceSelect(option)}
                        >
                            <Text style={styles.optionEmoji}>
                                {option.emoji}
                            </Text>
                            <Text
                                style={[
                                    styles.optionText,
                                    selectedOptions.includes(option.value) &&
                                        styles.optionTextSelected,
                                ]}
                            >
                                {option.label}
                            </Text>
                            {selectedOptions.includes(option.value) && (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={20}
                                    color="#4CAF50"
                                />
                            )}
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            selectedOptions.length === 0 &&
                                styles.submitButtonDisabled,
                        ]}
                        onPress={handleMultiChoiceSubmit}
                        disabled={selectedOptions.length === 0}
                    >
                        <Text style={styles.submitButtonText}>
                            Continue ({selectedOptions.length} selected)
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }
    };

    // RENDER: Welcome Phase
    if (phase === "welcome") {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />

                <View style={styles.skipContainer}>
                    <View style={styles.topControls}>
                        <TouchableOpacity
                            style={styles.musicButton}
                            onPress={toggleMusic}
                        >
                            <Ionicons
                                name={
                                    isMusicPlaying
                                        ? "volume-high"
                                        : "volume-mute"
                                }
                                size={24}
                                color="#666"
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSkip}>
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.contentContainer}>
                    <Image
                        source={welcomeSteps[currentStep].image}
                        style={styles.image}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>
                        {welcomeSteps[currentStep].title}
                    </Text>
                    <Text style={styles.description}>
                        {welcomeSteps[currentStep].description}
                    </Text>
                </View>

                <View style={styles.paginationContainer}>
                    {welcomeSteps.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.paginationDot,
                                index === currentStep &&
                                    styles.paginationDotActive,
                            ]}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                        if (currentStep < welcomeSteps.length - 1) {
                            setCurrentStep(currentStep + 1);
                        } else {
                            startChat();
                        }
                    }}
                >
                    <Text style={styles.buttonText}>
                        {currentStep === welcomeSteps.length - 1
                            ? "Let's Begin"
                            : "Next"}
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // RENDER: Chat Phase
    if (phase === "chat") {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />

                <View style={styles.chatHeader}>
                    <TouchableOpacity
                        style={styles.musicButton}
                        onPress={toggleMusic}
                    >
                        <Ionicons
                            name={
                                isMusicPlaying ? "volume-high" : "volume-mute"
                            }
                            size={24}
                            color="#666"
                        />
                    </TouchableOpacity>
                    <View style={styles.chatHeaderContent}>
                        <Text style={styles.chatHeaderTitle}>
                            Getting to Know You
                        </Text>
                        <Text style={styles.chatHeaderSubtitle}>
                            {currentQuestionIndex + 1} of{" "}
                            {ONBOARDING_QUESTIONS.length}
                        </Text>
                    </View>
                </View>

                <KeyboardAvoidingView
                    style={styles.chatContent}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={100}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.messagesContainer}
                        contentContainerStyle={styles.messagesContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {messages.map((message, index) =>
                            renderMessage(message, index)
                        )}

                        {isTyping && (
                            <View style={styles.aiMessageContainer}>
                                <View style={styles.aiAvatar}>
                                    <Text style={styles.aiAvatarText}>🤖</Text>
                                </View>
                                <View style={styles.typingIndicator}>
                                    <View style={styles.typingDot} />
                                    <View style={styles.typingDot} />
                                    <View style={styles.typingDot} />
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {renderInputArea()}
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    // RENDER: Permissions Phase
    if (phase === "permissions") {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />

                <View style={styles.permissionsHeader}>
                    <TouchableOpacity
                        style={styles.musicButton}
                        onPress={toggleMusic}
                    >
                        <Ionicons
                            name={
                                isMusicPlaying ? "volume-high" : "volume-mute"
                            }
                            size={24}
                            color="#666"
                        />
                    </TouchableOpacity>
                    <Text style={styles.permissionsTitle}>
                        Setup Permissions
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.permissionsContent}>
                    {/* AI Message */}
                    <View style={styles.aiMessageContainer}>
                        <View style={styles.aiAvatar}>
                            <Text style={styles.aiAvatarText}>🤖</Text>
                        </View>
                        <View style={styles.aiMessageBubble}>
                            <Text style={styles.aiMessageText}>
                                To provide accurate prayer times and reminders,
                                I need a couple of permissions. Your privacy is
                                important! 🔒
                            </Text>
                        </View>
                    </View>

                    {/* Location Permission */}
                    <View style={styles.permissionCard}>
                        <View style={styles.permissionHeader}>
                            <Ionicons
                                name="location"
                                size={32}
                                color="#4CAF50"
                            />
                            <View style={styles.permissionInfo}>
                                <Text style={styles.permissionTitle}>
                                    Location Access
                                </Text>
                                <Text style={styles.permissionSubtitle}>
                                    For accurate prayer times
                                </Text>
                            </View>
                            <Text style={styles.statusIcon}>
                                {locationStatus === "granted"
                                    ? "✅"
                                    : locationStatus === "denied"
                                    ? "❌"
                                    : "⏳"}
                            </Text>
                        </View>

                        <Text style={styles.permissionDescription}>
                            We use your location to calculate precise prayer
                            times. Data stored locally, never shared.
                        </Text>

                        {locationStatus === "pending" && (
                            <TouchableOpacity
                                style={styles.permissionButton}
                                onPress={requestLocationPermission}
                            >
                                <Text style={styles.permissionButtonText}>
                                    Enable Location
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Notification Permission */}
                    <View style={styles.permissionCard}>
                        <View style={styles.permissionHeader}>
                            <Ionicons
                                name="notifications"
                                size={32}
                                color="#4CAF50"
                            />
                            <View style={styles.permissionInfo}>
                                <Text style={styles.permissionTitle}>
                                    Prayer Notifications
                                </Text>
                                <Text style={styles.permissionSubtitle}>
                                    Stay on time with reminders
                                </Text>
                            </View>
                            <Text style={styles.statusIcon}>
                                {notificationStatus === "granted"
                                    ? "✅"
                                    : notificationStatus === "denied"
                                    ? "❌"
                                    : "⏳"}
                            </Text>
                        </View>

                        <Text style={styles.permissionDescription}>
                            Receive gentle reminders before each prayer time.
                        </Text>

                        {notificationStatus === "pending" && (
                            <TouchableOpacity
                                style={[
                                    styles.permissionButton,
                                    styles.permissionButtonSecondary,
                                ]}
                                onPress={requestNotificationPermission}
                            >
                                <Text
                                    style={styles.permissionButtonTextSecondary}
                                >
                                    Enable Notifications
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>

                <View style={styles.permissionsFooter}>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            locationStatus !== "granted" &&
                                styles.buttonDisabled,
                        ]}
                        onPress={completeOnboarding}
                        disabled={locationStatus !== "granted"}
                    >
                        <Text style={styles.buttonText}>
                            {locationStatus === "granted"
                                ? "Complete Setup ✓"
                                : "Enable Location to Continue"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    // Welcome phase styles
    skipContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    topControls: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    musicButton: {
        padding: 8,
    },
    skipText: {
        fontSize: 16,
        color: "#666",
        padding: 8,
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
        backgroundColor: "#4CAF50",
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
    buttonDisabled: {
        opacity: 0.5,
    },
    // Chat phase styles
    chatHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    chatHeaderContent: {
        flex: 1,
        alignItems: "center",
    },
    chatHeaderTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    chatHeaderSubtitle: {
        fontSize: 14,
        color: "#666",
        marginTop: 2,
    },
    chatContent: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 80,
    },
    aiMessageContainer: {
        flexDirection: "row",
        marginBottom: 16,
        alignItems: "flex-start",
    },
    aiAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#4CAF50",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    aiAvatarText: {
        fontSize: 18,
    },
    aiMessageBubble: {
        flex: 1,
        backgroundColor: "#f0f0f0",
        borderRadius: 16,
        borderTopLeftRadius: 4,
        padding: 16,
    },
    aiMessageText: {
        fontSize: 16,
        color: "#333",
        lineHeight: 24,
    },
    userMessageContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: 16,
    },
    userMessageBubble: {
        maxWidth: "80%",
        backgroundColor: "#4CAF50",
        borderRadius: 16,
        borderTopRightRadius: 4,
        padding: 16,
    },
    userMessageText: {
        fontSize: 16,
        color: "white",
        lineHeight: 24,
    },
    typingIndicator: {
        flexDirection: "row",
        backgroundColor: "#f0f0f0",
        borderRadius: 16,
        borderTopLeftRadius: 4,
        padding: 16,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#999",
        marginRight: 4,
    },
    inputContainer: {
        flexDirection: "row",
        padding: 16,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
    },
    textInput: {
        flex: 1,
        backgroundColor: "#f0f0f0",
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginRight: 12,
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#4CAF50",
        alignItems: "center",
        justifyContent: "center",
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    continueButton: {
        flex: 1,
        backgroundColor: "#4CAF50",
        borderRadius: 24,
        paddingVertical: 14,
        alignItems: "center",
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "white",
    },
    optionsContainer: {
        padding: 16,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
    },
    optionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: "#f8f9fa",
    },
    optionButtonSelected: {
        backgroundColor: "#e8f5e9",
        borderColor: "#4CAF50",
    },
    optionEmoji: {
        fontSize: 24,
        marginRight: 12,
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        color: "#333",
        fontWeight: "500",
    },
    optionTextSelected: {
        color: "#4CAF50",
        fontWeight: "600",
    },
    submitButton: {
        backgroundColor: "#4CAF50",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 8,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "white",
    },
    // Permissions phase styles
    permissionsHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    permissionsTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
    permissionsContent: {
        flex: 1,
        padding: 16,
    },
    permissionCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    permissionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    permissionInfo: {
        flex: 1,
        marginLeft: 12,
    },
    permissionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    permissionSubtitle: {
        fontSize: 14,
        color: "#666",
        marginTop: 2,
    },
    statusIcon: {
        fontSize: 24,
    },
    permissionDescription: {
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
        marginBottom: 16,
    },
    permissionButton: {
        backgroundColor: "#4CAF50",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    permissionButtonSecondary: {
        backgroundColor: "#fff",
        borderWidth: 2,
        borderColor: "#4CAF50",
    },
    permissionButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
    },
    permissionButtonTextSecondary: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#4CAF50",
    },
    permissionsFooter: {
        padding: 20,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
    },
    skipButtonBottom: {
        paddingVertical: 12,
        alignItems: "center",
    },
    skipTextBottom: {
        fontSize: 16,
        color: "#666",
    },
});
