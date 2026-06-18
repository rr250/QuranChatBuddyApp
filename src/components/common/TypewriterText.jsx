import { useEffect, useMemo, useState } from "react";
import { Text } from "react-native";

/**
 * Reveals text word-by-word (or character-by-character) for a typewriter effect.
 */
export const TypewriterText = ({
    text,
    mode = "word",
    speed = 32,
    style,
    onComplete,
}) => {
    const tokens = useMemo(() => {
        if (!text) return [];
        if (mode === "char") return text.split("");
        return text.split(/(\s+)/);
    }, [text, mode]);

    const [visibleCount, setVisibleCount] = useState(0);
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        setVisibleCount(0);
        setFinished(false);
    }, [text, mode]);

    useEffect(() => {
        if (!tokens.length) {
            if (!finished) {
                setFinished(true);
                onComplete?.();
            }
            return undefined;
        }

        if (visibleCount >= tokens.length) {
            if (!finished) {
                setFinished(true);
                onComplete?.();
            }
            return undefined;
        }

        const timer = setTimeout(
            () => setVisibleCount((count) => count + 1),
            speed,
        );
        return () => clearTimeout(timer);
    }, [tokens.length, visibleCount, finished, onComplete, speed]);

    return <Text style={style}>{tokens.slice(0, visibleCount).join("")}</Text>;
};
