import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";

const APP_SCHEME =
    Constants.expoConfig?.scheme ??
    Constants.expoConfig?.extra?.scheme ??
    "quranchatbuddy";

export const getGoogleRedirectUri = () =>
    makeRedirectUri({
        scheme: APP_SCHEME,
        path: "oauthredirect",
    });

export const GOOGLE_APP_SCHEME = APP_SCHEME;
