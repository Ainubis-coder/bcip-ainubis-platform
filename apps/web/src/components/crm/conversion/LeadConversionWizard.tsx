/**
 * BCIP Lead Conversion Wizard Modal Container
 * Phase 2D — Prompt 002D-003: CRM Lead Conversion Wizard
 * Master dialog orchestrating multi-step conversion through Phase 2C atomic REST API.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Lead,
  LeadStatus,
  ConvertLeadDto,
  ConvertLeadResult,
  OrganisationType,
} from '../shared/crm-types';
import { getCrmApiClient, CrmApiError } from '../shared/crm-api';
import { canConvertLead } from '../shared/crm-permissions';
import { TenantContext, UserAccount } from '../../../types/tenant';
import { Modal } from '@bcip/ui';
import { LeadConversionProgress, ConversionStep } from './LeadConversionProgress';
import { LeadConversionStepReview } from './LeadConversionStepReview';
import { LeadConversionStepData } from './LeadConversionStepData';
import { LeadConversionStepConfirm } from './LeadConversionStepConfirm';
import { LeadConversionStepSuccess } from './LeadConversionStepSuccess';
import { LeadConversionError } from './LeadConversionError';

interface LeadConversionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  activeTenant: TenantContext;
  user: UserAccount;
  onConversionSuccess: (result: ConvertLeadResult) => void;
  onNavigateToPipeline: (opportunityId?: string) => void;
}

export function LeadConversionWizard({
  isOpen,
  onClose,
  lead,
  activeTenant,
  user,
  onConversionSuccess,
  onNavigateToPipeline,
}: LeadConversionWizardProps) {
  const [step, setStep] = useState<ConversionStep>(1);
  const [conversionData, setConversionData] = useState<ConvertLeadDto>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<{
    message: string;
    code?: string;
    status?: number;
    details?: unknown;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ConvertLeadResult | null>(null);

  const userRole = user.role || user.userRole;
  const isPermitted = canConvertLead(userRole);

  const api = useMemo(
    () => getCrmApiClient(activeTenant.id, user),
    [activeTenant.id, user]
  );

  // Initialize conversion form fields whenever target lead changes or modal opens
  useEffect(() => {
    if (lead) {
      setStep(1);
      setResult(null);
      setApiError(null);
      setFieldErrors({});

      // Split name for contact prefill
      const nameParts = (lead.title || '').trim().split(' ');
      const firstName = nameParts[0] || 'Primary';
      const lastName = nameParts.slice(1).join(' ') || 'Contact';

      const orgName = lead.schemeName || lead.managingAgent || `${lead.title} Org`;
      const isScheme = Boolean(lead.schemeName);

      setConversionData({
        organisationName: orgName,
        organisationType: isScheme
          ? OrganisationType.BODY_CORPORATE
          : OrganisationType.MANAGING_AGENT,
        contactFirstName: firstName,
        contactLastName: lastName,
        opportunityName: `${orgName} — Platform Adoption`,
        estimatedValue: lead.estimatedUnits ? lead.estimatedUnits * 25 : 5000,
        createSchemeProspect: isScheme || Boolean(lead.managingAgent),
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      });
    }
  }, [lead, isOpen]);

  // Handle updates to step 2 conversion data
  const handleDataChange = useCallback((updated: Partial<ConvertLeadDto>) => {
    setConversionData((prev) => ({ ...prev, ...updated }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      Object.keys(updated).forEach((k) => delete next[k]);
      return next;
    });
  }, []);

  // Validate step 2 inputs
  const validateStepData = (): boolean => {
    const errors: Record<string, string> = {};

    if (!conversionData.organisationName?.trim() && !conversionData.existingOrganisationId) {
      errors.organisationName = 'Organisation name is required';
    } else if (conversionData.organisationName && conversionData.organisationName.trim().length < 2) {
      errors.organisationName = 'Organisation name must be at least 2 characters';
    }

    if (!conversionData.contactFirstName?.trim() && !conversionData.existingContactId) {
      errors.contactFirstName = 'First name is required';
    }

    if (!conversionData.contactLastName?.trim() && !conversionData.existingContactId) {
      errors.contactLastName = 'Last name is required';
    }

    if (!conversionData.opportunityName?.trim()) {
      errors.opportunityName = 'Opportunity title is required';
    } else if (conversionData.opportunityName.trim().length < 2) {
      errors.opportunityName = 'Opportunity title must be at least 2 characters';
    }

    if (
      conversionData.estimatedValue !== undefined &&
      (isNaN(conversionData.estimatedValue) || conversionData.estimatedValue < 0)
    ) {
      errors.estimatedValue = 'Estimated value must be a valid positive amount';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Move from step 1 to 2
  const handleStep1Next = () => {
    setApiError(null);
    setStep(2);
  };

  // Move from step 2 to 3 (after validation)
  const handleStep2Next = () => {
    if (!validateStepData()) return;
    setApiError(null);
    setStep(3);
  };

  // Submit atomic conversion (Step 3 Confirm)
  const handleConfirmConversion = async () => {
    if (!lead) return;
    if (isSubmitting) return;

    if (!isPermitted) {
      setApiError({
        message: 'Your user role is not permitted to convert CRM leads.',
        status: 403,
      });
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const convResult = await api.convertLead(lead.id, conversionData);
      setResult(convResult);
      setStep(4);
      onConversionSuccess(convResult);
    } catch (err: unknown) {
      if (err instanceof CrmApiError) {
        setApiError({
          message: err.message,
          code: err.code,
          status: err.status,
          details: err.details,
        });
      } else {
        setApiError({
          message: (err as Error).message || 'An unexpected error occurred during lead conversion.',
          status: 500,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !lead) return null;

  const isAlreadyConverted = lead.status === LeadStatus.CONVERTED;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Lead Conversion Wizard"
      description={`Active Tenant: ${activeTenant.name}`}
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Step Progress Tracker */}
        <LeadConversionProgress
          currentStep={step}
          onStepClick={(s) => {
            if (s === 1) setStep(1);
            else if (s === 2 && step === 3) setStep(2);
          }}
          isSubmitting={isSubmitting}
        />

        {/* Global Error Banner if present */}
        <LeadConversionError
          error={apiError}
          onRetry={step === 3 ? handleConfirmConversion : undefined}
          onClear={() => setApiError(null)}
        />

        {/* Step Contents */}
        <div className="px-1 py-1">
          {step === 1 && <LeadConversionStepReview lead={lead} />}

          {step === 2 && (
            <LeadConversionStepData
              lead={lead}
              conversionData={conversionData}
              onChange={handleDataChange}
              errors={fieldErrors}
            />
          )}

          {step === 3 && (
            <LeadConversionStepConfirm
              lead={lead}
              conversionData={conversionData}
              tenantName={activeTenant.name}
            />
          )}

          {step === 4 && result && (
            <LeadConversionStepSuccess
              result={result}
              onNavigateToPipeline={(oppId) => {
                onClose();
                onNavigateToPipeline(oppId);
              }}
              onClose={onClose}
            />
          )}
        </div>

        {/* Footer Navigation Buttons (Steps 1 to 3) */}
        {step < 4 && (
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep((s) => (s - 1) as ConversionStep)}
                  className="px-3.5 py-1.5 rounded text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {step === 1 && (
                <button
                  type="button"
                  disabled={isAlreadyConverted || !isPermitted}
                  onClick={handleStep1Next}
                  className="px-4 py-1.5 rounded text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Configure Entities
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  onClick={handleStep2Next}
                  className="px-4 py-1.5 rounded text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 transition-colors"
                >
                  Next: Review & Confirm
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  disabled={isSubmitting || !isPermitted}
                  onClick={handleConfirmConversion}
                  className="px-4 py-1.5 rounded text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Converting Lead...</span>
                    </>
                  ) : (
                    <span>Confirm & Convert Lead</span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
