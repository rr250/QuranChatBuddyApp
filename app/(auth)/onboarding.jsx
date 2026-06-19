// app/(auth)/onboarding.jsx - Enhanced with AI Chat & Permissions
import { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Animated,
    ActivityIndicator,
    Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Audio } from "expo-av";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useAuthStore } from "../../src/store/authStore";
import { AppBackground } from "../../src/components/ui/Glass";
import { AppLogo } from "../../src/components/common/AppLogo";
import { MessageBubble } from "../../src/components/chat/MessageBubble";
import { ScreenHeader } from "../../src/components/navigation/ScreenHeader";
import { glass } from "../../src/constants/glass";
import { theme, spacing } from "../../src/constants/theme";
import { useSettingsStore } from "../../src/store/settingsStore";
import { LocationService } from "../../src/services/locationService";
import { NotificationService } from "../../src/services/notificationService";
import { usePaywallStore } from "../../src/store/paywallStore";
import { APP_LINKS } from "../../src/constants/appLinks";
import { FaithReminderPreview } from "../../src/components/notifications/FaithReminderPreview";
import { PrayerTimeWidget } from "../../src/components/prayer/PrayerTimeWidget";

const ONBOARDING_INTRO = [
    "Assalamu Alaikum! 🌟",
    "Welcome to QuranChatBuddy – we're blessed to have you here.",
    "Before we begin your personalized journey, we'd love to get to know you a little better so we can tailor the experience to your pace, comfort level, and goals.",
    "Please answer a few short questions — there are no right or wrong answers. This is a safe, private, and judgment-free space meant to support your growth with kindness and compassion.",
];

const ONBOARDING_QUESTIONS = [
    {
        id: "name",
        type: "text",
        message: "To start, what's your name?",
        placeholder: "Type your answer...",
        key: "userName",
    },
    {
        id: "quran_familiarity",
        type: "choice",
        message: (data) =>
            `Great to meet you, ${data.userName || "friend"}! How familiar are you with the Quran?`,
        options: [
            { label: "I'm just starting", value: "just_starting" },
            { label: "I read occasionally", value: "read_occasionally" },
            { label: "I read often", value: "read_often" },
            {
                label: "I'm comfortable with reading & understanding",
                value: "comfortable",
            },
            {
                label: "I'm advanced / seeking deeper study",
                value: "advanced",
            },
        ],
        key: "quranFamiliarity",
    },
    {
        id: "prayer_frequency",
        type: "choice",
        message:
            "Thank you for sharing. How often do you currently pray?",
        options: [
            {
                label: "All 5 daily prayers",
                value: "All 5 daily prayers",
            },
            {
                label: "Some prayers regularly",
                value: "Some prayers regularly",
            },
            { label: "Occasionally", value: "Occasionally" },
            { label: "Still learning", value: "Still learning" },
        ],
        key: "prayerFrequency",
    },
    {
        id: "quran_reading",
        type: "choice",
        message:
            "And how often do you read or spend time with the Quran?",
        options: [
            { label: "Regularly", value: "Regularly" },
            { label: "Occasionally", value: "Occasionally" },
            { label: "Just starting", value: "Just starting" },
            { label: "Want to learn", value: "Want to learn" },
        ],
        key: "quranReading",
    },
    {
        id: "goals",
        type: "multichoice",
        message: "What would you like to focus on? (Select all that apply)",
        options: [
            {
                label: "Learn more about Islam",
                value: "learn_islam",
            },
            {
                label: "Improve prayer habits",
                value: "improve_prayer",
            },
            { label: "Read the Quran", value: "read_quran" },
            {
                label: "Ask Islamic questions",
                value: "ask_questions",
            },
            {
                label: "Build daily habits",
                value: "daily_habits",
            },
        ],
        key: "goals",
    },
];

export default function Onboarding() {
    // Phase management: welcome → permissions → chat
    const [phase, setPhase] = useState("welcome");
    const [introIndex, setIntroIndex] = useState(0);
    const [introComplete, setIntroComplete] = useState(false);
    const [questionRevealed, setQuestionRevealed] = useState(false);
    const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

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
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const activeQuestionAnchorY = useRef(0);

    const scrollChatToEnd = useCallback(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 120);
    }, []);

    const scrollToActiveQuestion = useCallback(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, activeQuestionAnchorY.current - spacing.md),
                animated: true,
            });
        }, 160);
    }, []);

    const saveTimeoutRef = useRef(null);
    const introShownRef = useRef(new Set());

    // Audio loads only when user opts in (keeps onboarding fast)
    const ensureAudio = async () => {
        if (soundRef.current) return soundRef.current;

        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
        });

        const { sound } = await Audio.Sound.createAsync(
            require("../../assets/music/onboarding-bg.mp3"),
            { shouldPlay: true, isLooping: true, volume: 0.25 },
        );
        soundRef.current = sound;
        setMusicLoaded(true);
        setIsMusicPlaying(true);
        return sound;
    };

    useEffect(
        () => () => {
            soundRef.current?.unloadAsync();
        },
        [],
    );

    const toggleMusic = async () => {
        try {
            if (!soundRef.current) {
                await ensureAudio();
                return;
            }

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

    // Scroll to bottom when messages or input area change
    useEffect(() => {
        if (phase === "chat") {
            scrollChatToEnd();
        }
    }, [messages, phase, questionRevealed, currentQuestionIndex, scrollChatToEnd, scrollToActiveQuestion]);

    useEffect(() => {
        if (phase === "chat" && questionRevealed) {
            scrollToActiveQuestion();
        }
    }, [phase, questionRevealed, currentQuestionIndex, scrollToActiveQuestion]);

    const startPermissions = () => {
        setPhase("permissions");
    };

    const startChat = () => {
        setPhase("chat");
        setCurrentQuestionIndex(0);
        setMessages([]);
        setIntroIndex(0);
        setIntroComplete(false);
        setQuestionRevealed(false);
        introShownRef.current = new Set();
    };

    const getQuestionMessage = (question) =>
        typeof question.message === "function"
            ? question.message(userData)
            : question.message;

    const showIntroMessage = (index) => {
        const introId = `intro-${index}`;
        if (introShownRef.current.has(introId)) return;
        introShownRef.current.add(introId);

        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    type: "ai",
                    content: ONBOARDING_INTRO[index],
                    animate: true,
                    id: introId,
                    timestamp: new Date(),
                },
            ]);
        }, 120);
    };

    const showNextQuestion = () => {
        if (currentQuestionIndex >= ONBOARDING_QUESTIONS.length) {
            finishOnboarding();
            return;
        }

        const question = ONBOARDING_QUESTIONS[currentQuestionIndex];
        const questionId = `question-${question.id}`;
        if (introShownRef.current.has(questionId)) return;
        introShownRef.current.add(questionId);

        setQuestionRevealed(false);
        setIsTyping(true);

        setTimeout(() => {
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    type: "ai",
                    content: getQuestionMessage(question),
                    question,
                    animate: true,
                    id: questionId,
                    timestamp: new Date(),
                },
            ]);

            fadeAnim.setValue(0);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }, 180);
    };

    const isQuestionInputReady = (question) => {
        if (!question || !questionRevealed) return false;
        return messages.some((message) => message.id === `question-${question.id}`);
    };

    // Handle text input submit
    const handleTextSubmit = () => {
        if (!userInput.trim()) return;

        const question = ONBOARDING_QUESTIONS[currentQuestionIndex];

        setQuestionRevealed(false);
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
            setQuestionRevealed(false);
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

        setQuestionRevealed(false);
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
        if (phase !== "chat" || introComplete) return undefined;
        if (introIndex >= ONBOARDING_INTRO.length) {
            setIntroComplete(true);
            return undefined;
        }
        showIntroMessage(introIndex);
        return undefined;
    }, [phase, introIndex, introComplete]);

    useEffect(() => {
        if (phase !== "chat" || !introComplete) return undefined;
        const timer = setTimeout(showNextQuestion, 60);
        return () => clearTimeout(timer);
    }, [currentQuestionIndex, phase, introComplete]);

    const saveToStorage = (data) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await AsyncStorage.setItem("onboarding_data", JSON.stringify(data));
                await AsyncStorage.setItem(
                    "onboarding_timestamp",
                    new Date().toISOString(),
                );
            } catch (error) {
                console.error("Error saving data:", error);
            }
        }, 300);
    };

    // Request location permission
    const requestLocationPermission = async () => {
        try {
            const { status } =
                await Location.requestForegroundPermissionsAsync();

            if (status === "granted") {
                setLocationStatus("granted");
                const location = await LocationService.getCurrentLocation({
                    skipPermissionPrompt: true,
                    useCache: false,
                });
                await AsyncStorage.setItem(
                    "user_location",
                    JSON.stringify({
                        latitude: location.coords?.latitude ?? location.latitude,
                        longitude: location.coords?.longitude ?? location.longitude,
                        timestamp: new Date().toISOString(),
                    })
                );
                await useSettingsStore.getState().applyDeviceLocation(location);
            } else {
                setLocationStatus("denied");
                await useSettingsStore.getState().setUseManualLocation(true);
            }
        } catch (error) {
            console.error("Error requesting location:", error);
            setLocationStatus("denied");
            await useSettingsStore.getState().setUseManualLocation(true);
        }
    };

    // Request notification permission
    const requestNotificationPermission = async () => {
        try {
            const granted =
                await NotificationService.requestNotificationPermissions();

            if (granted) {
                setNotificationStatus("granted");
                await AsyncStorage.setItem("notifications_enabled", "true");
                await AsyncStorage.setItem("prayerNotificationsEnabled", "true");
                await AsyncStorage.setItem("verseNotificationsEnabled", "true");

                NotificationService.registerForPushNotifications().catch(
                    (error) =>
                        console.warn("Push token registration failed:", error),
                );

                const { PrayerNotificationService } = await import(
                    "../../src/services/prayerNotificationService"
                );
                await PrayerNotificationService.setupFaithReminders();
            } else {
                setNotificationStatus("denied");
                await AsyncStorage.setItem("notifications_enabled", "false");
            }
        } catch (error) {
            console.error("Error requesting notifications:", error);
            setNotificationStatus("denied");
        }
    };

    const handlePermissionsContinue = async () => {
        if (isRequestingPermissions) return;
        setIsRequestingPermissions(true);
        try {
            await requestNotificationPermission();
            await requestLocationPermission();
            startChat();
        } finally {
            setIsRequestingPermissions(false);
        }
    };

    const finishOnboarding = async () => {
        try {
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            }

            await AsyncStorage.setItem("onboarding_completed", "true");
            await AsyncStorage.setItem(
                "onboarding_completed_date",
                new Date().toISOString(),
            );

            useAuthStore.getState().setOnboarded(true);
            const userName = userData.userName || "";
            router.replace("/(tabs)");
            setTimeout(() => {
                usePaywallStore.getState().showOnboardingPaywall(userName);
            }, 400);
        } catch (error) {
            console.log("Error completing onboarding:", error);
        }
    };

    const handleIntroTypewriterComplete = (messageId) => {
        if (messageId?.startsWith("intro-")) {
            const index = Number(messageId.replace("intro-", ""));
            if (!Number.isNaN(index)) {
                setIntroIndex(index + 1);
            }
            return;
        }

        if (messageId?.startsWith("question-")) {
            setQuestionRevealed(true);
        }
    };

    const renderMessage = (message, index) => (
        <MessageBubble
            key={message.id || `${message.type}-${index}`}
            message={{
                isUser: message.type === "user",
                text: message.content,
                animate: message.animate,
                timestamp: message.timestamp,
            }}
            onTypewriterComplete={() =>
                handleIntroTypewriterComplete(message.id)
            }
        />
    );

    // Render input area based on question type
    const renderInputArea = () => {
        const currentQuestion = ONBOARDING_QUESTIONS[currentQuestionIndex];
        if (!isQuestionInputReady(currentQuestion)) return null;

        if (currentQuestion.type === "text") {
            return (
                <View
                    style={[
                        styles.composerWrapper,
                        { paddingBottom: Math.max(insets.bottom, 12) },
                    ]}
                >
                    <View style={styles.composerInputShell}>
                        <MaterialCommunityIcons
                            name="message-text-outline"
                            size={18}
                            color="rgba(255,255,255,0.75)"
                        />
                        <TextInput
                            style={styles.composerInput}
                            placeholder={currentQuestion.placeholder}
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            value={userInput}
                            onChangeText={setUserInput}
                            onSubmitEditing={handleTextSubmit}
                            returnKeyType="send"
                        />
                        <TouchableOpacity
                            style={[
                                styles.composerSendButton,
                                !userInput.trim() &&
                                    styles.composerSendButtonDisabled,
                            ]}
                            onPress={handleTextSubmit}
                            disabled={!userInput.trim()}
                        >
                            <MaterialCommunityIcons
                                name="send"
                                size={18}
                                color={
                                    userInput.trim()
                                        ? "#fff"
                                        : "rgba(255,255,255,0.35)"
                                }
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        if (currentQuestion.type === "choice") {
            return (
                <View
                    style={[
                        styles.optionsContainer,
                        { paddingBottom: Math.max(insets.bottom, 8) },
                    ]}
                >
                    {currentQuestion.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.optionButton}
                            onPress={() => handleChoiceSelect(option)}
                        >
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
                <View
                    style={[
                        styles.optionsContainer,
                        { paddingBottom: Math.max(insets.bottom, 8) },
                    ]}
                >
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
                                <MaterialCommunityIcons
                                    name="check-circle"
                                    size={20}
                                    color={theme.colors.secondary}
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
            <AppBackground>
            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />

                <View style={styles.welcomeContent}>
                    <AppLogo size={88} />
                    <Text style={styles.welcomeEyebrow}>Welcome to</Text>
                    <Text style={styles.title}>Quran Chat Buddy</Text>
                </View>

                <View style={styles.welcomeFooter}>
                    <TouchableOpacity
                        style={styles.primaryCtaButton}
                        onPress={startPermissions}
                    >
                        <Text style={styles.primaryCtaButtonText}>Continue</Text>
                    </TouchableOpacity>
                    <Text style={styles.termsText}>
                        By continuing you agree to our{" "}
                        <Text
                            style={styles.termsLink}
                            onPress={() => Linking.openURL(APP_LINKS.terms)}
                        >
                            Terms & Conditions
                        </Text>
                    </Text>
                </View>
            </SafeAreaView>
            </AppBackground>
        );
    }

    // RENDER: Chat Phase
    if (phase === "chat") {
        return (
            <AppBackground>
            <SafeAreaView style={styles.container} edges={["top"]}>
                <StatusBar style="light" />

                <ScreenHeader
                    title="Meet Quran Chat Buddy"
                    subtitle={
                        introComplete
                            ? `Question ${Math.min(
                                  currentQuestionIndex + 1,
                                  ONBOARDING_QUESTIONS.length,
                              )} of ${ONBOARDING_QUESTIONS.length}`
                            : "Getting started"
                    }
                    showHome={false}
                    leftAction={
                        <TouchableOpacity
                            style={styles.headerIconButton}
                            onPress={toggleMusic}
                        >
                            <Ionicons
                                name={
                                    isMusicPlaying
                                        ? "volume-high"
                                        : "volume-mute"
                                }
                                size={20}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    }
                />

                <KeyboardAvoidingView
                    style={styles.chatContent}
                    behavior="padding"
                    keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.messagesContainer}
                        contentContainerStyle={[
                            styles.messagesContent,
                            { paddingBottom: spacing.md },
                        ]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="interactive"
                        onContentSizeChange={() => {
                            if (questionRevealed) {
                                scrollToActiveQuestion();
                            } else {
                                scrollChatToEnd();
                            }
                        }}
                    >
                        {messages.map((message, index) =>
                            renderMessage(message, index)
                        )}

                        {isTyping ? (
                            <View style={styles.typingContainer}>
                                <ActivityIndicator size="small" color="#fff" />
                                <Text style={styles.typingText}>Thinking...</Text>
                            </View>
                        ) : null}

                        {questionRevealed ? (
                            <View
                                onLayout={(event) => {
                                    activeQuestionAnchorY.current =
                                        event.nativeEvent.layout.y;
                                }}
                            />
                        ) : null}
                    </ScrollView>

                    {renderInputArea()}
                </KeyboardAvoidingView>
            </SafeAreaView>
            </AppBackground>
        );
    }

    // RENDER: Permissions Phase
    if (phase === "permissions") {
        return (
            <AppBackground>
            <SafeAreaView style={styles.container} edges={["top"]}>
                <StatusBar style="light" />

                <ScrollView
                    style={styles.permissionsScroll}
                    contentContainerStyle={[
                        styles.permissionsContent,
                        { paddingBottom: spacing.lg },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.permissionsHeadline}>
                        Enable notifications and location permission to get the
                        most out of Quran Chat Buddy
                    </Text>

                    <Text style={styles.previewSectionTitle}>
                        Faith Reminders
                    </Text>
                    <FaithReminderPreview />

                    <Text style={styles.previewSectionTitle}>
                        Prayer Time Widget
                    </Text>
                    <PrayerTimeWidget preview />
                </ScrollView>

                <View
                    style={[
                        styles.permissionsFooter,
                        { paddingBottom: Math.max(insets.bottom, spacing.md) },
                    ]}
                >
                    <TouchableOpacity
                        style={[
                            styles.primaryCtaButton,
                            isRequestingPermissions &&
                                styles.primaryCtaButtonDisabled,
                        ]}
                        onPress={handlePermissionsContinue}
                        disabled={isRequestingPermissions}
                    >
                        {isRequestingPermissions ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryCtaButtonText}>
                                Continue
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
            </AppBackground>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent",
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
    welcomeEmoji: {
        fontSize: 88,
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 16,
        color: "#fff",
    },
    description: {
        fontSize: 16,
        textAlign: "center",
        color: "rgba(255,255,255,0.8)",
        paddingHorizontal: 20,
    },
    welcomeIconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.12)",
        marginBottom: 20,
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
    headerIconButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: glass.backgroundStrong,
        borderWidth: 1,
        borderColor: glass.border,
    },
    chatContent: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: spacing.md,
    },
    typingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    typingText: {
        color: "rgba(255,255,255,0.8)",
    },
    composerWrapper: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: glass.borderSubtle,
    },
    composerInputShell: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: glass.backgroundStrong,
        borderRadius: 24,
        paddingHorizontal: 14,
        minHeight: 48,
        borderWidth: 1,
        borderColor: glass.cardBorder,
    },
    composerInput: {
        flex: 1,
        color: "#fff",
        fontSize: 15,
        paddingVertical: 8,
    },
    composerSendButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.primary,
    },
    composerSendButtonDisabled: {
        opacity: 0.6,
    },
    optionsContainer: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: glass.borderSubtle,
    },
    optionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: glass.backgroundStrong,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: glass.cardBorder,
    },
    optionButtonSelected: {
        backgroundColor: glass.backgroundLight,
        borderColor: theme.colors.secondary,
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        color: "#fff",
        fontWeight: "500",
    },
    optionTextSelected: {
        color: theme.colors.secondary,
        fontWeight: "600",
    },
    submitButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: spacing.xs,
        borderWidth: 1,
        borderColor: glass.cardBorder,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "white",
    },
    // Permissions phase styles
    permissionsScroll: {
        flex: 1,
    },
    permissionsContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.lg,
    },
    permissionsHeadline: {
        fontSize: 22,
        fontWeight: "700",
        color: "#fff",
        textAlign: "center",
        lineHeight: 30,
        marginBottom: spacing.lg,
    },
    previewSectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "rgba(255,255,255,0.9)",
        marginBottom: spacing.sm,
        marginTop: spacing.sm,
    },
    previewNotificationCard: {
        marginBottom: spacing.sm,
    },
    previewNotificationInner: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.md,
        gap: spacing.sm,
    },
    previewAppIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.12)",
    },
    previewNotificationText: {
        flex: 1,
    },
    previewNotificationTitle: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    previewNotificationBody: {
        color: "rgba(255,255,255,0.75)",
        fontSize: 13,
        marginTop: 2,
    },
    previewNotificationTime: {
        color: "rgba(255,255,255,0.55)",
        fontSize: 12,
    },
    previewWidgetCard: {
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    previewWidgetTitle: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: spacing.md,
    },
    previewPrayerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    previewPrayerItem: {
        alignItems: "center",
        flex: 1,
    },
    previewPrayerIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.12)",
        marginBottom: 6,
    },
    previewPrayerIconActive: {
        backgroundColor: theme.colors.primary,
    },
    previewPrayerName: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 11,
        marginBottom: 2,
    },
    previewPrayerTime: {
        color: "#fff",
        fontSize: 10,
        textAlign: "center",
    },
    welcomeContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    welcomeEyebrow: {
        fontSize: 20,
        color: "rgba(255,255,255,0.85)",
        marginTop: spacing.lg,
        marginBottom: spacing.xs,
    },
    welcomeFooter: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    termsText: {
        textAlign: "center",
        color: theme.colors.secondary,
        fontSize: 13,
        marginTop: spacing.md,
        lineHeight: 20,
    },
    termsLink: {
        textDecorationLine: "underline",
        color: theme.colors.secondary,
        fontWeight: "600",
    },
    primaryCtaButtonDisabled: {
        opacity: 0.7,
    },
    permissionCard: {
        marginBottom: spacing.md,
    },
    permissionCardInner: {
        padding: spacing.lg,
    },
    permissionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    permissionIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: glass.backgroundLight,
        borderWidth: 1,
        borderColor: glass.borderSubtle,
    },
    permissionInfo: {
        flex: 1,
        marginLeft: spacing.md,
        paddingRight: spacing.sm,
    },
    permissionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },
    permissionSubtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.75)",
        marginTop: 2,
    },
    permissionHint: {
        marginTop: spacing.sm,
        fontSize: 13,
        color: "rgba(255,255,255,0.75)",
        textAlign: "center",
    },
    permissionDescription: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
        lineHeight: 21,
        marginBottom: spacing.md,
    },
    permissionButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: glass.cardBorder,
    },
    permissionButtonOutline: {
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: glass.cardBorder,
    },
    permissionButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
    },
    permissionButtonOutlineText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
    },
    permissionsFooter: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        backgroundColor: glass.barBackground,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.1)",
    },
    primaryCtaButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: glass.radiusLg,
        paddingVertical: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: glass.cardBorder,
    },
    primaryCtaButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
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
