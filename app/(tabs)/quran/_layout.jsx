import { Stack } from "expo-router";

export default function QuizLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: "#2E8B57",
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
