import { StyleSheet } from "react-native";
import { theme } from "../../theme";

export const authStyles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    keyboardContainer: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
    },
    header: {
        alignItems: "center",
        marginBottom: theme.spacing.xxl,
        paddingTop: theme.spacing.xl,
    },
    logoIcon: {
        fontSize: 60,
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "white",
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        color: "rgba(255,255,255,0.8)",
    },
    form: { flex: 1 },
    input: {
        marginBottom: theme.spacing.sm,
        backgroundColor: "white",
    },
    errorText: {
        textAlign: "center",
        marginBottom: theme.spacing.md,
        color: "#ffcdd2",
    },
    primaryButton: {
        backgroundColor: "white",
        marginBottom: theme.spacing.lg,
        borderRadius: theme.spacing.md,
    },
    buttonContent: { paddingVertical: theme.spacing.sm },
    buttonLabel: {
        fontSize: 16,
        fontWeight: "bold",
        color: theme.colors.primary,
    },
    divider: {
        backgroundColor: "rgba(255,255,255,0.3)",
        marginVertical: theme.spacing.md,
    },
    orText: {
        textAlign: "center",
        color: "rgba(255,255,255,0.8)",
        marginBottom: theme.spacing.md,
        fontSize: 14,
    },
    linkRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: theme.spacing.lg,
    },
    linkText: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 14,
        flex: 1,
    },
    linkInline: {
        color: "white",
        fontWeight: "bold",
        textDecorationLine: "underline",
    },
    linkButtonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 14,
    },
    checkboxContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: theme.spacing.md,
    },
    forgotButton: {
        alignSelf: "flex-end",
        marginBottom: theme.spacing.lg,
    },
    forgotButtonText: {
        color: "white",
        fontSize: 14,
    },
});
