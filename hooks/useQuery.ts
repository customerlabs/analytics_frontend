"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

interface UseSongQueryProps {
    url: string;
    paramKey: string;
    paramValue: string;
    queryKey: string;
}

// Build URL with query params, skipping null/undefined values
function buildUrl(
    baseUrl: string,
    params: Record<string, string | undefined>
): string {
    const url = new URL(baseUrl, window.location.origin);
    for (const [key, value] of Object.entries(params)) {
        if (value != null) {
            url.searchParams.set(key, value);
        }
    }
    return url.toString();
}

export const useQuery = ({
    url,
    paramKey,
    paramValue,
    queryKey
}: UseSongQueryProps) => {

    const fetchSongs = async ({ pageParam }: { pageParam: string | undefined }) => {
        try {
            const fetch_url = buildUrl(url, {
                cursor: pageParam,
                [paramKey]: paramValue,
            });

            const res = await fetch(fetch_url, { cache: "no-store" });
            
            if (!res.ok) {
                throw new Error(`API request failed with status ${res.status}`);
            }
            
            const data = await res.json();
            
            return data;
        } catch (error) {
            console.error("Error fetching data:", error);
            throw error;
        }
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status
    } = useInfiniteQuery({
        initialPageParam: undefined,
        queryKey: [queryKey],
        queryFn: fetchSongs,
        getNextPageParam: (lastPage: { nextCursor: string }) => lastPage?.nextCursor,
        refetchInterval: false,
    });

    return {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status
    };
}