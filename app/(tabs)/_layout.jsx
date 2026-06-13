import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { ChatBottomBar } from "../../src/components/navigation/ChatBottomBar";

const hiddenTab = { href: null, headerShown: false };

export default function TabLayout() {
    return (
        <View style={styles.container}>
            <View style={styles.screenArea}>
                <Tabs
                    screenOptions={{
                        headerShown: false,
                        tabBarStyle: { display: "none" },
                    }}
                >
                    <Tabs.Screen name="index" options={{ title: "Home" }} />
                    <Tabs.Screen name="chat" options={hiddenTab} />
                    <Tabs.Screen name="prayer" options={hiddenTab} />
                    <Tabs.Screen name="quran" options={hiddenTab} />
                    <Tabs.Screen name="quiz" options={hiddenTab} />
                    <Tabs.Screen name="profile" options={hiddenTab} />
                </Tabs>
            </View>
            <ChatBottomBar />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    screenArea: {
        flex: 1,
    },
});
