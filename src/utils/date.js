export const getTodayDateString = () => new Date().toDateString();

export const getYesterdayDateString = () =>
    new Date(Date.now() - 86_400_000).toDateString();

export const sortByDateDesc = (items, dateKey = "date") =>
    [...items].sort(
        (a, b) => new Date(b[dateKey]).getTime() - new Date(a[dateKey]).getTime(),
    );
