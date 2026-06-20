import { Stack } from "expo-router";
import { theme } from "../../../src/theme";

export default function QuizLayout() {
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
