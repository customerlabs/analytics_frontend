"use client";

import { Users, ShoppingBag } from "lucide-react";
import { useFacebookConfig } from "../../../hooks/useFacebookConfig";
import { BusinessTypeCard } from "../shared/BusinessTypeCard";

export function BusinessTypeStep() {
  const {
    form,
    setBusinessType,
    getSelectedPixel,
    onboardingData,
  } = useFacebookConfig();

  const stepInfo = onboardingData?.steps?.find(
    (s) => s.step_key === "fb_business_type"
  );

  const selectedPixel = getSelectedPixel();

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          {stepInfo?.title || "Select Business Type"}
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          {stepInfo?.description ||
            "Choose how you want to optimize your campaigns. This determines which conversion events we'll track."}
        </p>
        {selectedPixel && (
          <div className="text-xs text-gray-500 mb-4">
            Selected Pixel: {selectedPixel.name}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BusinessTypeCard
          type="LEAD_GEN"
          title="Lead Generation"
          description="Optimize for lead generation. Track lead events and quality signals."
          icon={
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          }
          isSelected={form.businessType === "LEAD_GEN"}
          onSelect={() => setBusinessType("LEAD_GEN")}
        />

        <BusinessTypeCard
          type="ECOMMERCE"
          title="Ecommerce"
          description="Optimize for sales and ROAS. Track purchase events and new customers."
          icon={
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-purple-600" />
            </div>
          }
          isSelected={form.businessType === "ECOMMERCE"}
          onSelect={() => setBusinessType("ECOMMERCE")}
        />
      </div>
    </div>
  );
}
