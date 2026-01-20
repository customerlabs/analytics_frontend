import useSWR from "swr";
import { fetchFromAPIClient } from "@/lib/apiFetcherClient";

export const useSWRQuery = (url : string) => {
    
    const { data, error, isLoading, mutate } = useSWR(url, fetchFromAPIClient, {
        revalidateOnFocus: false,
        dedupingInterval: 30000,
        focusThrottleInterval: 5000
    });

    return {
        data,
        error,
        isLoading,
        mutate
    };
    
}