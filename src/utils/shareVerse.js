import { Platform, Share } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { buildVerseShareMessage } from "../constants/share";

const toFileUri = (uri) => (uri.startsWith("file://") ? uri : `file://${uri}`);

const cleanupCapture = (uri) => {
    const path = uri.replace("file://", "");
    if (path.startsWith(FileSystem.cacheDirectory)) {
        FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {});
    }
};

export const shareVerse = async (viewRef, verse, { title = "Verse of the Day", category } = {}) => {
    if (!viewRef?.current || !verse) return;

    const message = buildVerseShareMessage(verse, { category });

    const uri = await captureRef(viewRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
    });

    try {
        if (Platform.OS === "ios") {
            await Share.share({
                title,
                message,
                url: toFileUri(uri),
            });
            return;
        }

        // Android — content URI lets Share attach image + caption text
        const localPath = uri.replace("file://", "");
        let shareUrl = toFileUri(uri);

        try {
            shareUrl = await FileSystem.getContentUriAsync(localPath);
        } catch {
            // fall back to file URI
        }

        const result = await Share.share({
            title,
            message,
            url: shareUrl,
        });

        if (result.action === Share.dismissedAction && (await Sharing.isAvailableAsync())) {
            await Sharing.shareAsync(localPath, {
                mimeType: "image/png",
                dialogTitle: title,
            });
        }
    } catch (error) {
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri.replace("file://", ""), {
                mimeType: "image/png",
                dialogTitle: title,
            });
        } else {
            await Share.share({ message, title });
        }
    } finally {
        cleanupCapture(uri);
    }
};
