"use client";

import { useState } from "react";
import { Search, X, CheckCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFacebookConfig } from "../../../hooks/useFacebookConfig";
import { PixelCard } from "../shared/PixelCard";

export function PixelSelectionStep() {
  const {
    pixels,
    selectedPixelId,
    selectPixel,
    pixelEvents,
    loadingEvents,
    loading,
    onboardingData,
  } = useFacebookConfig();

  const stepInfo = onboardingData?.steps?.find(
    (s) => s.step_key === "fb_pixel_selection"
  );

  const [searchQuery, setSearchQuery] = useState("");

  const filteredPixels = pixels.filter(
    (pixel) =>
      !searchQuery ||
      pixel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pixel.id.includes(searchQuery)
  );

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          {stepInfo?.title || "Select Facebook Pixel"}
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          {stepInfo?.description ||
            "Choose the pixel you want to use for conversion tracking. Events will be loaded from this pixel."}
        </p>
      </div>

      {pixels.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <div className="text-sm font-medium text-yellow-800 mb-1">
                No pixels found
              </div>
              <div className="text-sm text-yellow-700">
                No pixels were found for this account. Please ensure:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>
                    The account has a valid access token configured
                  </li>
                  <li>The account has pixels associated with it</li>
                  <li>You have the necessary permissions to view pixels</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Search input (only show if more than 3 pixels) */}
          {pixels.length > 3 && (
            <div className="relative">
              <Input
                type="text"
                placeholder="Search pixels by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Pixel list */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredPixels.map((pixel) => (
              <PixelCard
                key={pixel.id}
                pixel={pixel}
                isSelected={selectedPixelId === pixel.id}
                onSelect={() => selectPixel(pixel.id)}
                disabled={loading}
              />
            ))}
            {searchQuery && filteredPixels.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-500">
                No pixels found matching &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </>
      )}

      {/* Event Loading Status */}
      {loadingEvents && selectedPixelId && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 animate-pulse">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading events for this pixel...</span>
          </div>
        </div>
      )}

      {/* Events Loaded Success */}
      {!loadingEvents && pixelEvents.length > 0 && selectedPixelId && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-green-800">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>✓ {pixelEvents.length} events loaded and ready</span>
          </div>
        </div>
      )}
    </div>
  );
}
