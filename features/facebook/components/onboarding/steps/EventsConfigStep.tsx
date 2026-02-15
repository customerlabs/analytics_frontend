"use client";

import { Users, ShoppingBag, Info } from "lucide-react";
import { useFacebookConfig } from "../../../hooks/useFacebookConfig";
import { EventDropdown } from "../shared/EventDropdown";
import { ActionTypeMapping } from "../shared/ActionTypeMapping";

export function EventsConfigStep() {
  const {
    form,
    pixelEvents,
    conversionEvents,
    loadingEvents,
    updateLeadConfig,
    updateEcommerceConfig,
    eventVerification,
    mappingVerification,
    getSelectedPixel,
    onboardingData,
  } = useFacebookConfig();

  const stepKey =
    form.businessType === "LEAD_GEN" ? "fb_lead_events" : "fb_ecommerce_events";
  const stepInfo = onboardingData?.steps?.find((s) => s.step_key === stepKey);

  const selectedPixel = getSelectedPixel();

  // Get verification for selected events
  const getEventVerification = (eventName: string) => {
    return eventVerification.get(eventName);
  };

  const getMappingVerification = (mappingKey: string) => {
    return mappingVerification.get(mappingKey);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-1">
          {stepInfo?.title || "Primary Conversion Event"}
        </h4>
        <p className="text-sm text-gray-600 mb-2">
          {stepInfo?.description ||
            "Select your primary conversion event. Additional events for specific goals (like new customer tracking) can be configured per-goal in Goals settings."}
        </p>
        {selectedPixel && (
          <div className="text-xs text-gray-500">
            Pixel: {selectedPixel.name} • Business Type:{" "}
            {form.businessType === "LEAD_GEN" ? "Lead Generation" : "Ecommerce"}
          </div>
        )}
      </div>

      {/* Lead Generation Configuration */}
      {form.businessType === "LEAD_GEN" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  Primary Lead Event
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  This is the main conversion event for your lead generation
                  campaigns. A default goal will be created automatically after
                  saving.
                </p>
              </div>
            </div>
          </div>

          <EventDropdown
            label="Primary Lead Event"
            description="The main conversion event you want to optimize for (e.g., Lead, SignUp)"
            required
            value={form.lead.primaryEvent}
            onChange={(value) => updateLeadConfig({ primaryEvent: value })}
            options={pixelEvents}
            verification={getEventVerification(form.lead.primaryEvent)}
            isLoading={loadingEvents}
          />

          {form.lead.primaryEvent && (
            <ActionTypeMapping
              eventName={form.lead.primaryEvent}
              value={form.lead.primaryEventMapping}
              onChange={(value) =>
                updateLeadConfig({ primaryEventMapping: value })
              }
              options={conversionEvents}
              verification={getMappingVerification("lead.primaryEventMapping")}
            />
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600">
                <strong>Need quality lead tracking?</strong> After saving, add a
                &quot;Quality Leads&quot; goal to configure those events
                separately.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ecommerce Configuration */}
      {form.businessType === "ECOMMERCE" && (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  Primary Purchase Event
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  This is the main conversion event for ROAS optimization. A
                  default goal will be created automatically after saving.
                </p>
              </div>
            </div>
          </div>

          <EventDropdown
            label="Purchase Event"
            description="The main conversion event for purchases (e.g., Purchase, CompletePayment)"
            required
            value={form.ecommerce.purchaseEvent}
            onChange={(value) => updateEcommerceConfig({ purchaseEvent: value })}
            options={pixelEvents}
            verification={getEventVerification(form.ecommerce.purchaseEvent)}
            isLoading={loadingEvents}
          />

          {form.ecommerce.purchaseEvent && (
            <ActionTypeMapping
              eventName={form.ecommerce.purchaseEvent}
              value={form.ecommerce.purchaseEventMapping}
              onChange={(value) =>
                updateEcommerceConfig({ purchaseEventMapping: value })
              }
              options={conversionEvents}
              verification={getMappingVerification(
                "ecommerce.purchaseEventMapping"
              )}
            />
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600">
                <strong>Need new/repeat customer tracking?</strong> After
                saving, add a &quot;New Customers&quot; or &quot;Repeat
                Customers&quot; goal to configure those events separately.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
