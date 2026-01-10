


export function createPageUrl(pageName: string) {
    const [path, search] = pageName.split('?');
    const formattedPath = '/' + path.toLowerCase().replace(/ /g, '-');
    return search ? `${formattedPath}?${search}` : formattedPath;
}