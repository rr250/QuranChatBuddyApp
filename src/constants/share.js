import { APP_LINKS } from "./appLinks";

export const APP_SHARE_URL = APP_LINKS.home;

export const buildVerseShareMessage = (verse, { category } = {}) => {
    const categoryLine = category ? `${category}\n\n` : "";
    return `${categoryLine}${verse.arabicText}\n\n"${verse.translation}"\n\n— ${verse.reference}\n\nGet Quran Chat Buddy:\n${APP_SHARE_URL}`;
};
