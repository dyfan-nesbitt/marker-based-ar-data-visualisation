export function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

export async function loadDataFromUrl(url) {
    const resolved = new URL(url, window.location.href).toString();
    const res = await fetch(resolved, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    return await res.json();
}