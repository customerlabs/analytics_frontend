"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import qs from "query-string";

interface UseSongQueryProps {
    url: string;
    paramKey: string;
    paramValue: string;
    queryKey: string;
}

export const useQuery = ({
    url,
    paramKey,
    paramValue,
    queryKey
}: UseSongQueryProps) => {

    const fetchSongs = async ({ pageParam = undefined }) => {
        try {
            const fetch_url = qs.stringifyUrl({
                url,
                query: {
                    cursor: pageParam,
                    [paramKey]: paramValue
                }
            }, {
                skipNull: true
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