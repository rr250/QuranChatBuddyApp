import { Stack } from "expo-router";
import { theme } from "../../../src/theme";

export default function QuranLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: theme.colors.primary,
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                    fontWeight: "bold",
                },
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: "Quran",
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="reader"
                options={{
                    title: "Surah Reader",
                    headerShown: false,
                }}
            />
        </Stack>
    );
}
