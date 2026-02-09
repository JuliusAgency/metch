


export function createPageUrl(pageName: string) {
    const [path, search] = pageName.split('?');
    const formattedPath = '/' + path.toLowerCase().replace(/ /g, '-');
    return search ? `${formattedPath}?${search}` : formattedPath;
}

export const safeParseJSON = (data: any, fallback: any = []) => {
    if (!data) return fallback;
    if (typeof data !== 'string') return data;
    try {
        let jsonStr = data;
        // Handle Postgres hex format if needed
        if (jsonStr.startsWith('\\x')) {
            const hex = jsonStr.slice(2);
            let str = '';
            for (let i = 0; i < hex.length; i += 2) {
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            }
            jsonStr = str;
        }
        return JSON.parse(jsonStr);
    } catch (e) {
        return fallback;
    }
};