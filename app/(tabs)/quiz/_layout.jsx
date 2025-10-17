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
                    title: "Daily Quiz",
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="stats"
                options={{
                    title: "Quiz Statistics",
                    headerShown: false,
                }}
            />
        </Stack>
    );
}
