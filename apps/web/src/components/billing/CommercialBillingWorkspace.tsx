/**
 * BCIP Commercial Operations & Invoicing Workspace Frontend Component
 * Phase 3 — Prompt 003-002
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Icon, Modal } from '@bcip/ui';
import { getCrmApiClient } from '../crm/shared/crm-api.ts';
import type { TenantContext, UserAccount } from '../../types/tenant';
import type { ModuleId } from '../../types/navigation';

interface CommercialBillingWorkspaceProps {
  activeTenant: TenantContext;
  user: UserAccount;
  onNavigate?: (id: ModuleId) => void;
}

export function CommercialBillingWorkspace({ activeTenant, user, onNavigate }: CommercialBillingWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'profiles' | 'invoices' | 'taxes' | 'receivables'>('dashboard');

  const [customers, setCustomers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [invoiceLines, setInvoiceLines] = useState<any[]>([]);
  
  // Receivables, Payments, and Allocations States
  const [receivables, setReceivables] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentAllocations, setPaymentAllocations] = useState<any[]>([]);
  const [selectedReceivable, setSelectedReceivable] = useState<any | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [recSearch, setRecSearch] = useState('');
  const [recStatusFilter, setRecStatusFilter] = useState('');

  // Reversal fields
  const [reversalReason, setReversalReason] = useState('');
  const [selectedAllocForReversal, setSelectedAllocForReversal] = useState<any | null>(null);
  const [selectedPmtForReversal, setSelectedPmtForReversal] = useState<any | null>(null);

  // Modals for Receivables View
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [isAllocatePaymentModalOpen, setIsAllocatePaymentModalOpen] = useState(false);
  const [isReverseAllocationModalOpen, setIsReverseAllocationModalOpen] = useState(false);
  const [isReversePaymentModalOpen, setIsReversePaymentModalOpen] = useState(false);

  // Form fields for record payment
  const [newPmtCustId, setNewPmtCustId] = useState('');
  const [newPmtAmount, setNewPmtAmount] = useState('0');
  const [newPmtDate, setNewPmtDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newPmtMethod, setNewPmtMethod] = useState('BANK_TRANSFER');
  const [newPmtRef, setNewPmtRef] = useState('');
  const [newPmtNotes, setNewPmtNotes] = useState('');

  // Form fields for allocate payment
  const [allocPmtId, setAllocPmtId] = useState('');
  const [allocRecId, setAllocRecId] = useState('');
  const [allocAmount, setAllocAmount] = useState('0');

  const selectedCustomer = useMemo(() => {
    if (!selectedInvoice || customers.length === 0) return null;
    return customers.find((c) => c.id === selectedInvoice.billingCustomerId) || null;
  }, [selectedInvoice, customers]);

  // Document states
  const [invoiceDocuments, setInvoiceDocuments] = useState<any[]>([]);
  const [selectedDocumentForPreview, setSelectedDocumentForPreview] = useState<any | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);

  // Delivery states
  const [invoiceDeliveries, setInvoiceDeliveries] = useState<any[]>([]);
  const [deliveryTemplates, setDeliveryTemplates] = useState<any[]>([]);
  const [selectedTemplateForDelivery, setSelectedTemplateForDelivery] = useState<string>('');
  const [selectedRecipientEmail, setSelectedRecipientEmail] = useState<string>('');
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [selectedDocForDelivery, setSelectedDocForDelivery] = useState<any | null>(null);
  const [isSendingDelivery, setIsSendingDelivery] = useState(false);
  const [isRetryingDelivery, setIsRetryingDelivery] = useState(false);
  const [deliveryAttempts, setDeliveryAttempts] = useState<Record<string, any[]>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);
  const [isAddLineModalOpen, setIsAddLineModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);

  // Form states
  const [newCustLegalName, setNewCustLegalName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustOrgId, setNewCustOrgId] = useState('');

  const [newProfCustId, setNewProfCustId] = useState('');
  const [newProfFreq, setNewProfFreq] = useState('MONTHLY');
  const [newProfPrefix, setNewProfPrefix] = useState('INV');

  const [invCustId, setInvCustId] = useState('');
  const [invProfileId, setInvProfileId] = useState('');
  const [invIssueDate, setInvIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invDueDate, setInvDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [invNotes, setInvNotes] = useState('');

  // Line item modal form
  const [lineDesc, setLineDesc] = useState('');
  const [lineQty, setLineQty] = useState('1');
  const [linePrice, setLinePrice] = useState('0');
  const [lineDiscount, setLineDiscount] = useState('0');
  const [lineTaxRate, setLineTaxRate] = useState('15');

  // Void modal form
  const [voidReason, setVoidReason] = useState('');

  const api = useMemo(
    () => getCrmApiClient(activeTenant.id, user),
    [activeTenant.id, user.id, user.role, user.userRole]
  );

  const allocablePayments = useMemo(() => {
    return payments.filter((p) => {
      if (p.status === 'REVERSED') return false;
      const pAllocs = paymentAllocations.filter((a) => a.paymentId === p.id && !a.reversedAt);
      const totalAllocated = pAllocs.reduce((sum, a) => sum + a.allocatedAmount, 0);
      return p.amount > totalAllocated;
    });
  }, [payments, paymentAllocations]);

  const allocableReceivables = useMemo(() => {
    if (!allocPmtId) return [];
    const pmt = payments.find((p) => p.id === allocPmtId);
    if (!pmt) return [];
    return receivables.filter((r) => {
      return (
        r.customerId === pmt.customerId &&
        r.currency === pmt.currency &&
        r.status !== 'PAID' &&
        r.status !== 'VOIDED' &&
        r.status !== 'CANCELLED'
      );
    });
  }, [allocPmtId, payments, receivables]);

  const deliveryTemplatePreview = useMemo(() => {
    if (!selectedInvoice || !selectedDocForDelivery) return { subject: '', body: '' };
    const template = deliveryTemplates.find((t) => t.id === selectedTemplateForDelivery);
    if (!template) return { subject: '', body: '' };

    const variables = {
      customer_name: selectedCustomer?.legalName || 'Customer',
      invoice_number: selectedInvoice.invoiceNumber,
      invoice_date: new Date(selectedInvoice.issueDate).toLocaleDateString(),
      due_date: new Date(selectedInvoice.dueDate).toLocaleDateString(),
      invoice_total: selectedInvoice.grandTotal.toLocaleString(),
      currency: selectedInvoice.currency,
    };

    const replaceVars = (tmpl: string) => {
      let res = tmpl;
      for (const [key, val] of Object.entries(variables)) {
        res = res.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
      }
      return res;
    };

    return {
      subject: replaceVars(template.subject),
      body: replaceVars(template.body),
    };
  }, [selectedInvoice, selectedDocForDelivery, selectedTemplateForDelivery, deliveryTemplates, selectedCustomer]);

  const loadBillingData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [custData, profData, invData, templatesData, recsData, pmtsData, allocsData] = await Promise.all([
        api.listBillingCustomers().catch(() => []),
        api.listBillingProfiles().catch(() => []),
        api.listInvoices().catch(() => []),
        api.listDeliveryTemplates().catch(() => []),
        api.listReceivables().catch(() => []),
        api.listPayments().catch(() => []),
        api.listAllocations().catch(() => []),
      ]);
      setCustomers(custData);
      setProfiles(profData);
      setInvoices(invData);
      setDeliveryTemplates(templatesData);
      setReceivables(recsData);
      setPayments(pmtsData);
      setPaymentAllocations(allocsData);

      if (selectedInvoice) {
        const freshInv = invData.find((i: any) => i.id === selectedInvoice.id);
        if (freshInv) {
          setSelectedInvoice(freshInv);
          const [lines, docs, deliveries] = await Promise.all([
            api.listInvoiceLines(freshInv.id).catch(() => []),
            api.listInvoiceDocuments(freshInv.id).catch(() => []),
            api.listInvoiceDeliveries(freshInv.id).catch(() => []),
          ]);
          setInvoiceLines(lines);
          setInvoiceDocuments(docs);
          setInvoiceDeliveries(deliveries);
        }
      }

      if (selectedReceivable) {
        const freshRec = recsData.find((r: any) => r.id === selectedReceivable.id);
        if (freshRec) {
          setSelectedReceivable(freshRec);
        }
      }

      if (selectedPayment) {
        const freshPmt = pmtsData.find((p: any) => p.id === selectedPayment.id);
        if (freshPmt) {
          setSelectedPayment(freshPmt);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load billing operational workspace data.');
    } finally {
      setIsLoading(false);
    }
  }, [api, selectedInvoice?.id, selectedReceivable?.id, selectedPayment?.id]);

  useEffect(() => {
    loadBillingData();
  }, [activeTenant.id]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createBillingCustomer({
        legalName: newCustLegalName,
        billingEmail: newCustEmail,
        billingAddress: newCustAddress,
        organisationId: newCustOrgId.trim() || undefined,
        currency: 'ZAR',
      });
      setSuccess('Billing customer created successfully.');
      setIsCustomerModalOpen(false);
      setNewCustLegalName('');
      setNewCustEmail('');
      setNewCustAddress('');
      setNewCustOrgId('');
      await loadBillingData();
    } catch (err: any) {
      setError(err.message || 'Failed to create customer.');
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createBillingProfile({
        billingCustomerId: newProfCustId,
        billingFrequency: newProfFreq,
        invoicePrefix: newProfPrefix,
        defaultCurrency: 'ZAR',
        defaultPaymentTerms: 'NET_30',
      });
      setSuccess('Billing profile configured successfully.');
      setIsProfileModalOpen(false);
      setNewProfCustId('');
      await loadBillingData();
    } catch (err: any) {
      setError(err.message || 'Failed to create billing profile.');
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const inv = await api.createInvoice({
        billingCustomerId: invCustId,
        billingProfileId: invProfileId.trim() || undefined,
        issueDate: new Date(invIssueDate).toISOString(),
        dueDate: new Date(invDueDate).toISOString(),
        notes: invNotes.trim() || undefined,
      });
      setSuccess(`Invoice draft ${inv.invoiceNumber} created successfully.`);
      setIsCreateInvoiceModalOpen(false);
      setInvCustId('');
      setInvNotes('');
      await loadBillingData();
      handleSelectInvoice(inv);
    } catch (err: any) {
      setError(err.message || 'Failed to create invoice draft.');
    }
  };

  const handleSelectInvoice = async (inv: any) => {
    setSelectedInvoice(inv);
    setInvoiceDocuments([]);
    setInvoiceDeliveries([]);
    try {
      const [lines, docs, deliveries] = await Promise.all([
        api.listInvoiceLines(inv.id).catch(() => []),
        api.listInvoiceDocuments(inv.id).catch(() => []),
        api.listInvoiceDeliveries(inv.id).catch(() => []),
      ]);
      setInvoiceLines(lines);
      setInvoiceDocuments(docs);
      setInvoiceDeliveries(deliveries);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice details.');
    }
  };

  const handleGenerateDocument = async () => {
    if (!selectedInvoice) return;
    setIsGeneratingDocument(true);
    setError(null);
    setSuccess(null);
    try {
      const doc = await api.generateInvoiceDocument(selectedInvoice.id);
      setSuccess(`Invoice document version ${doc.version} generated successfully.`);
      const docs = await api.listInvoiceDocuments(selectedInvoice.id).catch(() => []);
      setInvoiceDocuments(docs);
    } catch (err: any) {
      setError(err.message || 'Failed to generate invoice document.');
    } finally {
      setIsGeneratingDocument(false);
    }
  };

  const handlePreviewDocument = (doc: any) => {
    setSelectedDocumentForPreview(doc);
    setIsPreviewModalOpen(true);
  };

  const handleOpenDeliveryModal = (doc: any) => {
    setSelectedDocForDelivery(doc);
    // Auto-resolve primary recipient email from selectedCustomer or fallback to input
    const primaryEmail = selectedCustomer?.billingEmail || '';
    setSelectedRecipientEmail(primaryEmail);
    // Pre-select first template if available
    if (deliveryTemplates.length > 0) {
      setSelectedTemplateForDelivery(deliveryTemplates[0].id);
    }
    setIsDeliveryModalOpen(true);
  };

  const handleSendDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !selectedDocForDelivery) return;
    setIsSendingDelivery(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await api.initiateInvoiceDelivery(selectedInvoice.id, {
        documentId: selectedDocForDelivery.id,
        recipientEmail: selectedRecipientEmail,
        templateId: selectedTemplateForDelivery,
      });
      setSuccess('Invoice delivery initiated successfully.');
      setIsDeliveryModalOpen(false);
      // Reload documents and deliveries
      const [docs, deliveries] = await Promise.all([
        api.listInvoiceDocuments(selectedInvoice.id).catch(() => []),
        api.listInvoiceDeliveries(selectedInvoice.id).catch(() => []),
      ]);
      setInvoiceDocuments(docs);
      setInvoiceDeliveries(deliveries);
    } catch (err: any) {
      setError(err.message || 'Failed to deliver invoice.');
    } finally {
      setIsSendingDelivery(false);
    }
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    if (!selectedInvoice) return;
    setIsRetryingDelivery(true);
    setError(null);
    setSuccess(null);
    try {
      await api.retryInvoiceDelivery(deliveryId);
      setSuccess('Invoice delivery retry initiated successfully.');
      // Reload deliveries and attempts for this item
      const [deliveries, attempts] = await Promise.all([
        api.listInvoiceDeliveries(selectedInvoice.id).catch(() => []),
        api.listDeliveryAttempts(deliveryId).catch(() => []),
      ]);
      setInvoiceDeliveries(deliveries);
      setDeliveryAttempts((prev) => ({ ...prev, [deliveryId]: attempts }));
    } catch (err: any) {
      setError(err.message || 'Failed to retry delivery.');
    } finally {
      setIsRetryingDelivery(false);
    }
  };

  const handleToggleAttempts = async (deliveryId: string) => {
    if (deliveryAttempts[deliveryId]) {
      // Toggle close
      setDeliveryAttempts((prev) => {
        const copy = { ...prev };
        delete copy[deliveryId];
        return copy;
      });
    } else {
      try {
        const attempts = await api.listDeliveryAttempts(deliveryId);
        setDeliveryAttempts((prev) => ({ ...prev, [deliveryId]: attempts }));
      } catch (err: any) {
        setError(err.message || 'Failed to load delivery attempts.');
      }
    }
  };

  const handleAddLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setError(null);
    try {
      const res = await api.addInvoiceLine(selectedInvoice.id, {
        description: lineDesc,
        quantity: Number(lineQty),
        unitPrice: Number(linePrice),
        discountAmount: Number(lineDiscount),
        taxRate: Number(lineTaxRate),
      });
      setSelectedInvoice(res.invoice);
      setInvoiceLines(res.lines);
      setIsAddLineModalOpen(false);
      setLineDesc('');
      setLineQty('1');
      setLinePrice('0');
      setLineDiscount('0');
      setSuccess('Invoice line added and server calculation updated.');
    } catch (err: any) {
      setError(err.message || 'Failed to add invoice line.');
    }
  };

  const handleDeleteLine = async (lineId: string) => {
    if (!selectedInvoice) return;
    setError(null);
    try {
      const res = await api.deleteInvoiceLine(selectedInvoice.id, lineId);
      setSelectedInvoice(res.invoice);
      setInvoiceLines(res.lines);
      setSuccess('Invoice line removed.');
    } catch (err: any) {
      setError(err.message || 'Failed to remove line.');
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedInvoice) return;
    setError(null);
    try {
      const updated = await api.submitInvoiceReview(selectedInvoice.id);
      setSelectedInvoice(updated);
      setSuccess('Invoice submitted for peer review.');
      await loadBillingData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit invoice.');
    }
  };

  const handleApprove = async () => {
    if (!selectedInvoice) return;
    setError(null);
    try {
      const updated = await api.approveInvoice(selectedInvoice.id, 'Approved via workspace');
      setSelectedInvoice(updated);
      setSuccess('Invoice approved by authorized user.');
      await loadBillingData();
    } catch (err: any) {
      setError(err.message || 'Approval failed.');
    }
  };

  const handleIssue = async () => {
    if (!selectedInvoice) return;
    setError(null);
    try {
      const updated = await api.issueInvoice(selectedInvoice.id);
      setSelectedInvoice(updated);
      setSuccess(`Invoice ${updated.invoiceNumber} officially issued.`);
      await loadBillingData();
    } catch (err: any) {
      setError(err.message || 'Issuance failed.');
    }
  };

  const handleVoid = async () => {
    if (!selectedInvoice || !voidReason.trim()) return;
    setError(null);
    try {
      const updated = await api.voidInvoice(selectedInvoice.id, voidReason.trim());
      setSelectedInvoice(updated);
      setSuccess('Invoice permanently voided.');
      setIsVoidModalOpen(false);
      setVoidReason('');
      await loadBillingData();
    } catch (err: any) {
      setError(err.message || 'Void operation failed.');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (!newPmtCustId || !newPmtAmount || Number(newPmtAmount) <= 0) {
        throw new Error('Please select a customer and enter a positive payment amount.');
      }
      const customer = customers.find((c) => c.id === newPmtCustId);
      const currency = customer?.currency || 'ZAR';

      await api.recordPayment({
        customerId: newPmtCustId,
        amount: Number(newPmtAmount),
        currency,
        paymentDate: new Date(newPmtDate).toISOString(),
        paymentMethod: newPmtMethod,
        externalReference: newPmtRef.trim() || undefined,
        notes: newPmtNotes.trim() || undefined,
      });

      setSuccess(`Recorded payment of R ${Number(newPmtAmount).toLocaleString()} successfully.`);
      setIsRecordPaymentModalOpen(false);
      setNewPmtCustId('');
      setNewPmtAmount('0');
      setNewPmtRef('');
      setNewPmtNotes('');
      await loadBillingData();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment.');
    }
  };

  const handleAllocatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (!allocPmtId || !allocRecId || Number(allocAmount) <= 0) {
        throw new Error('Please select payment, receivable, and enter positive allocation amount.');
      }

      await api.allocatePayment({
        paymentId: allocPmtId,
        receivableId: allocRecId,
        allocatedAmount: Number(allocAmount),
      });

      setSuccess('Payment allocated successfully.');
      setIsAllocatePaymentModalOpen(false);
      setAllocPmtId('');
      setAllocRecId('');
      setAllocAmount('0');
      await loadBillingData();
    } catch (err: any) {
      setError(err.message || 'Failed to allocate payment.');
    }
  };

  const handleReverseAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllocForReversal || !reversalReason.trim()) return;
    setError(null);
    setSuccess(null);
    try {
      await api.reverseAllocation(selectedAllocForReversal.id, reversalReason.trim());
      setSuccess('Payment allocation reversed successfully.');
      setIsReverseAllocationModalOpen(false);
      setSelectedAllocForReversal(null);
      setReversalReason('');
      await loadBillingData();
    } catch (err: any) {
      setError(err.message || 'Failed to reverse allocation.');
    }
  };

  const handleReversePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPmtForReversal || !reversalReason.trim()) return;
    setError(null);
    setSuccess(null);
    try {
      await api.reversePayment(selectedPmtForReversal.id, reversalReason.trim());
      setSuccess('Payment record reversed successfully.');
      setIsReversePaymentModalOpen(false);
      setSelectedPmtForReversal(null);
      setReversalReason('');
      await loadBillingData();
    } catch (err: any) {
      setError(err.message || 'Failed to reverse payment.');
    }
  };

  const handleRecalculateReceivable = async (id: string) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await api.recalculateReceivable(id);
      setSuccess(`Receivable outstanding balance recalculated: R ${res.outstandingAmount.toLocaleString()}`);
      await loadBillingData();
    } catch (err: any) {
      setError(err.message || 'Failed to recalculate receivable.');
    }
  };

  // Metrics
  const activeCustomersCount = customers.filter((c) => c.status === 'ACTIVE').length;
  const draftInvoicesCount = invoices.filter((i) => i.status === 'DRAFT').length;
  const reviewInvoicesCount = invoices.filter((i) => i.status === 'REVIEW_REQUIRED').length;
  const approvedInvoicesCount = invoices.filter((i) => i.status === 'APPROVED').length;
  const issuedInvoicesCount = invoices.filter((i) => i.status === 'ISSUED').length;
  const voidedInvoicesCount = invoices.filter((i) => i.status === 'VOIDED').length;

  const currentPeriodValue = invoices
    .filter((i) => i.status === 'ISSUED')
    .reduce((acc, i) => acc + (i.grandTotal || 0), 0);

  const receivableStats = useMemo(() => {
    let totalOutstanding = 0;
    let currentOutstanding = 0;
    let overdueOutstanding = 0;
    let partiallyPaidCount = 0;
    let paidCount = 0;

    const now = new Date();
    receivables.forEach((r) => {
      const isOverdue = r.status === 'OVERDUE' || (r.status !== 'PAID' && r.status !== 'VOIDED' && new Date(r.dueDate) < now);
      const outstanding = r.outstandingAmount || 0;
      
      if (r.status !== 'VOIDED' && r.status !== 'CANCELLED') {
        totalOutstanding += outstanding;
        if (isOverdue) {
          overdueOutstanding += outstanding;
        } else {
          currentOutstanding += outstanding;
        }
        
        if (r.status === 'PARTIALLY_PAID') {
          partiallyPaidCount++;
        } else if (r.status === 'PAID') {
          paidCount++;
        }
      }
    });

    let totalPayments = 0;
    let totalAllocatedPayments = 0;
    payments.forEach((p) => {
      if (p.status !== 'REVERSED') {
        totalPayments += p.amount;
      }
    });
    
    paymentAllocations.forEach((a) => {
      if (!a.reversedAt) {
        totalAllocatedPayments += a.allocatedAmount;
      }
    });
    
    const unallocatedPayments = Math.max(0, totalPayments - totalAllocatedPayments);

    return {
      totalOutstanding,
      currentOutstanding,
      overdueOutstanding,
      partiallyPaidCount,
      paidCount,
      unallocatedPayments,
    };
  }, [receivables, payments, paymentAllocations]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ISSUED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'APPROVED':
        return 'bg-teal-500/10 text-teal-300 border-teal-500/25';
      case 'REVIEW_REQUIRED':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/25';
      case 'DRAFT':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/25';
      case 'VOIDED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/25';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <Icon name="file-text" size="sm" className="text-sky-400" />
              <span>Commercial Operations & Invoicing</span>
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Phase 3 Billing Workspace
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tenant-scoped commercial billing, customer accounts, deterministic calculation engine, and governed invoice lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadBillingData}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <Icon name="refresh" size="sm" className={isLoading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateInvoiceModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Icon name="plus" size="sm" />
            <span>Create Invoice</span>
          </Button>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs rounded-lg flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Icon name="check-circle" size="sm" className="text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-200 font-bold">×</button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-950/20 border border-rose-900 text-rose-400 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        {(['dashboard', 'customers', 'profiles', 'invoices', 'receivables', 'taxes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs uppercase font-mono font-bold tracking-wider relative capitalize ${
              activeTab === tab
                ? 'text-sky-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Total Customers</span>
              <div className="text-xl font-bold font-mono text-slate-100 mt-1">{customers.length}</div>
              <span className="text-[10px] text-emerald-400">{activeCustomersCount} active accounts</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-blue-400 block">Draft Invoices</span>
              <div className="text-xl font-bold font-mono text-blue-300 mt-1">{draftInvoicesCount}</div>
              <span className="text-[10px] text-slate-500">Editable workspace</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-amber-400 block">Awaiting Review</span>
              <div className="text-xl font-bold font-mono text-amber-300 mt-1">{reviewInvoicesCount}</div>
              <span className="text-[10px] text-slate-500">Requires audit check</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-emerald-400 block">Issued Value</span>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-1">R {currentPeriodValue.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500">{issuedInvoicesCount} official invoices</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Recent Invoices & Commercial Activity
            </h3>
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No invoices recorded for this tenant. Create an invoice to begin.
              </div>
            ) : (
              <div className="space-y-2">
                {invoices.slice(0, 5).map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      setActiveTab('invoices');
                      handleSelectInvoice(inv);
                    }}
                    className="p-3 bg-slate-900/30 border border-slate-800 rounded-lg hover:border-slate-700 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 font-mono">{inv.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-500">Due: {new Date(inv.dueDate).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${getStatusBadge(inv.status)}`}>
                        {inv.status}
                      </span>
                      <span className="font-mono font-bold text-slate-200">R {inv.grandTotal?.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Billing Customers ({customers.length})
            </h3>
            <Button variant="primary" size="sm" onClick={() => setIsCustomerModalOpen(true)}>
              + Add Customer
            </Button>
          </div>

          {customers.length === 0 ? (
            <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-lg text-slate-500 text-xs">
              No billing customers registered. Click Add Customer to start.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {customers.map((c) => (
                <div key={c.id} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-sky-400 font-bold">{c.customerNumber}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {c.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{c.legalName}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{c.billingEmail}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{c.billingAddress}</p>
                  </div>
                  {c.organisationId && (
                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Linked Organisation:</span>
                      <button
                        onClick={() => onNavigate && onNavigate('organisations')}
                        className="text-sky-400 hover:underline font-mono"
                      >
                        {c.organisationId}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROFILES */}
      {activeTab === 'profiles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Billing Profiles ({profiles.length})
            </h3>
            <Button variant="primary" size="sm" onClick={() => setIsProfileModalOpen(true)}>
              + Configure Profile
            </Button>
          </div>

          {profiles.length === 0 ? (
            <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-lg text-slate-500 text-xs">
              No billing profiles configured.
            </div>
          ) : (
            <div className="space-y-2">
              {profiles.map((p) => (
                <div key={p.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-200">Customer: {p.billingCustomerId}</span>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      Frequency: {p.billingFrequency} | Terms: {p.defaultPaymentTerms} | Prefix: {p.invoicePrefix}
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-sky-400">
                    Next Seq: #{p.nextInvoiceNumber}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TAXES */}
      {activeTab === 'taxes' && (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Tax Configuration (Standard VAT)
          </h3>
          <div className="p-3 bg-slate-900/30 border border-slate-800 rounded flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-200 font-mono">Standard VAT (South Africa)</span>
              <span className="text-[10px] text-slate-400 block font-mono">Tax Code: VAT-15</span>
            </div>
            <div className="text-right font-mono">
              <span className="text-emerald-400 font-bold text-sm">15.0%</span>
              <span className="text-[10px] text-slate-500 block">Exclusive / Standard</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: INVOICES & DETAIL WORKSPACE */}
      {activeTab === 'invoices' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoices List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Invoices ({invoices.length})
              </h3>
              <Button variant="primary" size="sm" onClick={() => setIsCreateInvoiceModalOpen(true)}>
                + New Draft
              </Button>
            </div>

            {invoices.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-lg text-slate-500 text-xs">
                No invoices found.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {invoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => handleSelectInvoice(inv)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex flex-col gap-1.5 ${
                      selectedInvoice?.id === inv.id
                        ? 'bg-slate-900 border-sky-500 text-slate-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono font-semibold text-slate-200">{inv.invoiceNumber}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getStatusBadge(inv.status)}`}>
                        {inv.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between w-full text-[10px] text-slate-500 font-mono">
                      <span>R {inv.grandTotal?.toLocaleString()}</span>
                      <span>{new Date(inv.issueDate).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Invoice Detail & Line Items Workspace */}
          <div className="lg:col-span-2 space-y-6">
            {selectedInvoice ? (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-100 font-mono">{selectedInvoice.invoiceNumber}</h3>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase ${getStatusBadge(selectedInvoice.status)}`}>
                        {selectedInvoice.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Customer ID: {selectedInvoice.billingCustomerId} | Issued: {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedInvoice.status === 'DRAFT' && (
                      <Button variant="secondary" size="sm" onClick={handleSubmitReview}>
                        Submit Review
                      </Button>
                    )}
                    {selectedInvoice.status === 'REVIEW_REQUIRED' && (
                      <Button variant="primary" size="sm" onClick={handleApprove}>
                        Approve Invoice
                      </Button>
                    )}
                    {selectedInvoice.status === 'APPROVED' && (
                      <Button variant="primary" size="sm" onClick={handleIssue}>
                        Issue Official
                      </Button>
                    )}
                    {selectedInvoice.status === 'ISSUED' && (
                      <Button variant="secondary" size="sm" onClick={() => setIsVoidModalOpen(true)}>
                        Void Invoice
                      </Button>
                    )}
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                      Line Items ({invoiceLines.length})
                    </h4>
                    {selectedInvoice.status === 'DRAFT' && (
                      <Button variant="secondary" size="sm" onClick={() => setIsAddLineModalOpen(true)}>
                        + Add Line
                      </Button>
                    )}
                  </div>

                  {invoiceLines.length === 0 ? (
                    <div className="p-6 text-center bg-slate-900/30 border border-slate-800/60 rounded text-slate-500 text-xs">
                      No line items added yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {invoiceLines.map((line) => (
                        <div key={line.id} className="p-3 bg-slate-900/30 border border-slate-800 rounded flex items-center justify-between text-xs font-mono">
                          <div>
                            <span className="font-semibold text-slate-200 font-sans block">{line.description}</span>
                            <span className="text-[10px] text-slate-500">
                              Qty: {line.quantity} × R {line.unitPrice.toLocaleString()} (Tax {line.taxRate}%)
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-200">R {line.lineTotal?.toLocaleString()}</span>
                            {selectedInvoice.status === 'DRAFT' && (
                              <button
                                onClick={() => handleDeleteLine(line.id)}
                                className="text-rose-400 hover:text-rose-200 font-bold"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Totals Calculation Summary (Server Authoritative) */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span>R {selectedInvoice.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Discount:</span>
                    <span>- R {selectedInvoice.discountTotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tax (VAT):</span>
                    <span>R {selectedInvoice.taxTotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-200 font-bold text-sm pt-2 border-t border-slate-800">
                    <span>Grand Total:</span>
                    <span className="text-emerald-400">R {selectedInvoice.grandTotal?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Documents & Delivery Foundation (Prompt 003-003) */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="file-text" className="w-4 h-4 text-sky-400" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                        Official Documents ({invoiceDocuments.length})
                      </h4>
                    </div>
                    {(selectedInvoice.status === 'APPROVED' || selectedInvoice.status === 'ISSUED') && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleGenerateDocument}
                        disabled={isGeneratingDocument}
                      >
                        {isGeneratingDocument ? 'Generating...' : 'Generate Doc'}
                      </Button>
                    )}
                  </div>

                  {invoiceDocuments.length === 0 ? (
                    <div className="text-center py-4 bg-slate-900/10 border border-slate-900/40 rounded text-slate-500 text-[11px] font-mono">
                      No official documents generated yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {invoiceDocuments.map((doc) => (
                        <div key={doc.id} className="p-3 bg-slate-900/40 border border-slate-800/80 rounded flex flex-col gap-2 text-xs font-mono">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-200">v{doc.version}</span>
                              <span className="text-slate-400">({doc.documentNumber})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                                doc.status === 'GENERATED'
                                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                                  : 'bg-slate-900/60 text-slate-400 border-slate-800'
                              }`}>
                                {doc.status}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                                doc.deliveryStatus === 'SENT'
                                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                                  : doc.deliveryStatus === 'FAILED'
                                  ? 'bg-rose-950/40 text-rose-400 border-rose-800/50'
                                  : 'bg-slate-900/60 text-slate-400 border-slate-800'
                              }`}>
                                DELIV: {doc.deliveryStatus}
                              </span>
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-500 space-y-1">
                            <p>File: <span className="text-slate-400">{doc.fileName}</span></p>
                            <p>Checksum: <span className="text-slate-400">{doc.contentHash.slice(0, 18)}...</span></p>
                            <p>Generated: <span className="text-slate-400">{new Date(doc.generatedAt).toLocaleString()}</span> by <span className="text-slate-400">{doc.generatedBy}</span></p>
                          </div>

                          <div className="flex justify-end gap-2 pt-1 border-t border-slate-900">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-[10px]"
                              onClick={() => handlePreviewDocument(doc)}
                            >
                              Preview Document
                            </Button>
                            {(selectedInvoice.status === 'APPROVED' || selectedInvoice.status === 'ISSUED') && (
                              <Button
                                variant="primary"
                                size="sm"
                                className="text-[10px]"
                                onClick={() => handleOpenDeliveryModal(doc)}
                              >
                                Prepare Delivery
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Deliveries & Communication History (Prompt 003-004) */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Icon name="arrow-up-right" className="w-4 h-4 text-sky-400" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                      Delivery History ({invoiceDeliveries.length})
                    </h4>
                  </div>

                  {invoiceDeliveries.length === 0 ? (
                    <div className="text-center py-4 bg-slate-900/10 border border-slate-900/40 rounded text-slate-500 text-[11px] font-mono">
                      No delivery attempts recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {invoiceDeliveries.map((del) => (
                        <div key={del.id} className="p-3 bg-slate-900/40 border border-slate-800/80 rounded flex flex-col gap-2 text-xs font-mono">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-300">{del.destination}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase ${
                                del.status === 'SENT'
                                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                                  : del.status === 'FAILED'
                                  ? 'bg-rose-950/40 text-rose-400 border-rose-800/50'
                                  : 'bg-slate-900/60 text-slate-400 border-slate-800'
                              }`}>
                                {del.status}
                              </span>
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-500 space-y-1">
                            <p>Channel: <span className="text-slate-400">{del.deliveryChannel}</span></p>
                            <p>Doc Reference: <span className="text-slate-400">{del.invoiceDocumentId}</span></p>
                            <p>Requested At: <span className="text-slate-400">{new Date(del.requestedAt).toLocaleString()}</span></p>
                            {del.completedAt && <p>Completed At: <span className="text-slate-400">{new Date(del.completedAt).toLocaleString()}</span></p>}
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-900">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-[10px]"
                              onClick={() => handleToggleAttempts(del.id)}
                            >
                              {deliveryAttempts[del.id] ? 'Hide Attempts' : 'Show Attempts'}
                            </Button>

                            {del.status === 'FAILED' && (
                              <Button
                                variant="primary"
                                size="sm"
                                className="text-[10px] bg-rose-600 hover:bg-rose-500"
                                onClick={() => handleRetryDelivery(del.id)}
                                disabled={isRetryingDelivery}
                              >
                                {isRetryingDelivery ? 'Retrying...' : 'Retry Delivery'}
                              </Button>
                            )}
                          </div>

                          {/* Attempts sub-list */}
                          {deliveryAttempts[del.id] && (
                            <div className="mt-2 p-2 bg-slate-950/60 border border-slate-800/50 rounded space-y-2 text-[10px]">
                              <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">Attempt Trace Log</p>
                              {deliveryAttempts[del.id].length === 0 ? (
                                <p className="text-slate-600 italic">No attempts logged yet.</p>
                              ) : (
                                <div className="space-y-2 divide-y divide-slate-900">
                                  {deliveryAttempts[del.id].map((att) => (
                                    <div key={att.id} className="pt-1.5 first:pt-0 space-y-1">
                                      <div className="flex justify-between items-center text-slate-400">
                                        <span className="font-semibold text-slate-300">Attempt #{att.attemptNumber}</span>
                                        <span className={`text-[8px] px-1 rounded border ${
                                          att.status === 'SENT'
                                            ? 'text-emerald-400 border-emerald-900/60 bg-emerald-950/20'
                                            : 'text-rose-400 border-rose-900/60 bg-rose-950/20'
                                        }`}>{att.status}</span>
                                      </div>
                                      <p className="text-[9px] text-slate-500">Started: {new Date(att.startedAt).toLocaleString()}</p>
                                      {att.completedAt && <p className="text-[9px] text-slate-500">Completed: {new Date(att.completedAt).toLocaleString()}</p>}
                                      {att.providerReference && <p className="text-[9px] text-slate-400">Ref: {att.providerReference}</p>}
                                      {att.failureMessage && <p className="text-[9px] text-rose-400/90 font-mono">Error: {att.failureMessage}</p>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-16 text-center text-slate-500 text-xs">
                Select an invoice from the list to inspect lines, calculations, and lifecycle actions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: RECEIVABLES */}
      {activeTab === 'receivables' && (
        <div className="space-y-6">
          {/* Receivables Actions & Dashboard */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Receivables, Payments & Ledger Allocations
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsRecordPaymentModalOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Icon name="plus" size="sm" />
                <span>Record Payment</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAllocatePaymentModalOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Icon name="plus" size="sm" />
                <span>Allocate Payment</span>
              </Button>
            </div>
          </div>

          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-rose-400 block">Total Outstanding</span>
              <div className="text-xl font-bold font-mono text-rose-300 mt-1">R {receivableStats.totalOutstanding.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500">Unpaid issued invoices</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-sky-400 block">Current Balance</span>
              <div className="text-xl font-bold font-mono text-sky-300 mt-1">R {receivableStats.currentOutstanding.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500">Within payment terms</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-amber-400 block">Overdue Balance</span>
              <div className="text-xl font-bold font-mono text-amber-300 mt-1">R {receivableStats.overdueOutstanding.toLocaleString()}</div>
              <span className="text-[10px] text-rose-400/80 font-semibold font-mono">Past term dates</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <span className="text-[10px] font-mono uppercase text-emerald-400 block">Unallocated Payments</span>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-1">R {receivableStats.unallocatedPayments.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500">Available payment pool</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Receivables List & Payments list */}
            <div className="space-y-6">
              {/* Receivables List Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                    Receivable Records ({receivables.length})
                  </h4>
                </div>

                {/* Filter and Search Box */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Search invoice #..."
                    value={recSearch}
                    onChange={(e) => setRecSearch(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono placeholder-slate-500"
                  />
                  <select
                    value={recStatusFilter}
                    onChange={(e) => setRecStatusFilter(e.target.value)}
                    className="text-xs px-2 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono"
                  >
                    <option value="">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="PARTIALLY_PAID">Partial</option>
                    <option value="PAID">Paid</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="VOIDED">Voided</option>
                  </select>
                </div>

                {receivables.length === 0 ? (
                  <div className="p-6 text-center bg-slate-950 border border-slate-800 rounded-lg text-slate-500 text-xs font-mono">
                    No receivables opened.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {receivables
                      .filter((r) => {
                        const matchesSearch = r.invoiceNumber.toLowerCase().includes(recSearch.toLowerCase());
                        const matchesStatus = recStatusFilter ? r.status === recStatusFilter : true;
                        return matchesSearch && matchesStatus;
                      })
                      .map((r) => {
                        const custName = customers.find((c) => c.id === r.customerId)?.legalName || 'Customer';
                        return (
                          <button
                            key={r.id}
                            onClick={() => {
                              setSelectedReceivable(r);
                              setSelectedPayment(null);
                            }}
                            className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex flex-col gap-1.5 ${
                              selectedReceivable?.id === r.id
                                ? 'bg-slate-900 border-sky-500 text-slate-200'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-mono font-semibold text-slate-200">{r.invoiceNumber}</span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                                r.status === 'PAID'
                                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                                  : r.status === 'PARTIALLY_PAID'
                                  ? 'bg-blue-950/40 text-blue-400 border-blue-800/50'
                                  : r.status === 'OVERDUE'
                                  ? 'bg-rose-950/40 text-rose-400 border-rose-800/50'
                                  : 'bg-slate-900/60 text-slate-400 border-slate-800'
                              }`}>
                                {r.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-sans truncate">{custName}</div>
                            <div className="flex items-center justify-between w-full text-[10px] text-slate-500 font-mono mt-0.5">
                              <span>Outstanding: R {r.outstandingAmount.toLocaleString()}</span>
                              <span>Due: {new Date(r.dueDate).toLocaleDateString()}</span>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Payments List Section */}
              <div className="space-y-3 pt-4 border-t border-slate-900">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                    Recorded Payments ({payments.length})
                  </h4>
                </div>

                {payments.length === 0 ? (
                  <div className="p-6 text-center bg-slate-950 border border-slate-800 rounded-lg text-slate-500 text-xs font-mono">
                    No payment records found.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {payments.map((p) => {
                      const custName = customers.find((c) => c.id === p.customerId)?.legalName || 'Customer';
                      const pAllocations = paymentAllocations.filter((a) => a.paymentId === p.id && !a.reversedAt);
                      const totalAllocated = pAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
                      const available = Math.max(0, p.amount - totalAllocated);

                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedPayment(p);
                            setSelectedReceivable(null);
                          }}
                          className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex flex-col gap-1.5 ${
                            selectedPayment?.id === p.id
                              ? 'bg-slate-900 border-sky-500 text-slate-200'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-mono font-semibold text-slate-200">Ref: {p.externalReference || p.id.slice(-6).toUpperCase()}</span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                              p.status === 'REVERSED'
                                ? 'bg-rose-950/40 text-rose-400 border-rose-800/50'
                                : p.status === 'ALLOCATED'
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                                : 'bg-slate-900/60 text-slate-400 border-slate-800'
                            }`}>
                              {p.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-sans truncate">{custName}</div>
                          <div className="flex items-center justify-between w-full text-[10px] text-slate-500 font-mono mt-0.5">
                            <span>Amount: R {p.amount.toLocaleString()}</span>
                            <span className="text-emerald-400/90 font-bold">Unallocated: R {available.toLocaleString()}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Dynamic Detail Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Selected Receivable Details */}
              {selectedReceivable && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-100 font-mono">Receivable Details: {selectedReceivable.invoiceNumber}</h3>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase ${
                          selectedReceivable.status === 'PAID'
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                            : selectedReceivable.status === 'OVERDUE'
                            ? 'bg-rose-950/40 text-rose-400 border-rose-800/50'
                            : 'bg-slate-900/60 text-slate-400 border-slate-800'
                        }`}>
                          {selectedReceivable.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 font-sans">
                        Customer Account: {customers.find((c) => c.id === selectedReceivable.customerId)?.legalName || 'Customer'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRecalculateReceivable(selectedReceivable.id)}
                      >
                        Recalculate Ledger
                      </Button>
                    </div>
                  </div>

                  {/* Receivable Monetary Balances */}
                  <div className="grid grid-cols-3 gap-4 font-mono text-center">
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Original Amount</span>
                      <span className="text-sm font-bold text-slate-200 mt-1 block">R {selectedReceivable.originalAmount.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Allocated Applied</span>
                      <span className="text-sm font-bold text-slate-200 mt-1 block">R {selectedReceivable.amountAllocated.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                      <span className="text-[9px] uppercase tracking-wider text-rose-400 block">Outstanding</span>
                      <span className="text-sm font-bold text-emerald-400 mt-1 block">R {selectedReceivable.outstandingAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Payment Allocation History */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                      Applied Allocations for this Receivable
                    </h4>
                    {paymentAllocations.filter((a) => a.receivableId === selectedReceivable.id).length === 0 ? (
                      <div className="text-center py-6 bg-slate-900/10 border border-slate-900/40 rounded text-slate-500 text-[11px] font-mono">
                        No allocations applied yet. Use 'Allocate Payment' above.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {paymentAllocations
                          .filter((a) => a.receivableId === selectedReceivable.id)
                          .map((alloc) => (
                            <div key={alloc.id} className="p-3 bg-slate-900/30 border border-slate-800/80 rounded flex items-center justify-between text-xs font-mono">
                              <div>
                                <span className="font-semibold text-slate-200 block">Allocated: R {alloc.allocatedAmount.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-500 block">Date: {new Date(alloc.allocatedAt || alloc.createdAt).toLocaleString()} | Operator: {alloc.allocatedBy}</span>
                                {alloc.reversedAt && (
                                  <span className="text-[9px] text-rose-400 mt-1 block font-semibold">REVERSED: {alloc.reversalReason}</span>
                                )}
                              </div>
                              {!alloc.reversedAt && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="text-rose-400 border-rose-950/60 hover:bg-rose-950/10"
                                  onClick={() => {
                                    setSelectedAllocForReversal(alloc);
                                    setIsReverseAllocationModalOpen(true);
                                  }}
                                >
                                  Reverse
                                </Button>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Payment Details */}
              {selectedPayment && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-100 font-mono">Payment Record</h3>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase ${
                          selectedPayment.status === 'REVERSED'
                            ? 'bg-rose-950/40 text-rose-400 border-rose-800/50'
                            : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                        }`}>
                          {selectedPayment.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 font-sans">
                        Remitted By: {customers.find((c) => c.id === selectedPayment.customerId)?.legalName || 'Customer'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedPayment.status !== 'REVERSED' && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-rose-600 hover:bg-rose-500"
                          onClick={() => {
                            setSelectedPmtForReversal(selectedPayment);
                            setIsReversePaymentModalOpen(true);
                          }}
                        >
                          Reverse Payment
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Payment Breakdown Fields */}
                  <div className="bg-slate-900/30 border border-slate-800/80 rounded-lg p-4 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Remitted Amount:</span>
                      <span className="font-bold text-slate-200">R {selectedPayment.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Applied Allocation:</span>
                      <span className="font-bold text-slate-200">
                        R {paymentAllocations
                          .filter((a) => a.paymentId === selectedPayment.id && !a.reversedAt)
                          .reduce((sum, a) => sum + a.allocatedAmount, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-200 font-bold pt-2 border-t border-slate-800">
                      <span>Available Unallocated Balance:</span>
                      <span className="text-emerald-400">
                        R {(
                          selectedPayment.amount -
                          paymentAllocations
                            .filter((a) => a.paymentId === selectedPayment.id && !a.reversedAt)
                            .reduce((sum, a) => sum + a.allocatedAmount, 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1.5 border-t border-slate-900 pt-4 font-mono text-slate-500">
                    <p>Method: <span className="text-slate-400">{selectedPayment.paymentMethod}</span></p>
                    <p>Reference: <span className="text-slate-400">{selectedPayment.externalReference || 'N/A'}</span></p>
                    <p>Received Date: <span className="text-slate-400">{new Date(selectedPayment.paymentDate).toLocaleDateString()}</span></p>
                    {selectedPayment.notes && <p>Notes: <span className="text-slate-400 italic">"{selectedPayment.notes}"</span></p>}
                    {selectedPayment.reversedAt && (
                      <div className="p-2.5 bg-rose-950/20 border border-rose-900/40 text-rose-400 rounded mt-2">
                        <strong>Reversed At:</strong> {new Date(selectedPayment.reversedAt).toLocaleString()} <br />
                        <strong>Reason:</strong> "{selectedPayment.reversalReason}"
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!selectedReceivable && !selectedPayment && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-16 text-center text-slate-500 text-xs">
                  Select a receivable record or recorded payment from the list to manage and reverse allocations.
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* MODALS */}
      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordPaymentModalOpen}
        onClose={() => setIsRecordPaymentModalOpen(false)}
        title="Record Received Payment"
        description="Record a manually confirmed external payment in ZAR or customer currency."
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsRecordPaymentModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleRecordPayment}>Record Payment</Button>
          </div>
        }
      >
        <form onSubmit={handleRecordPayment} className="space-y-3 text-xs font-mono">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Billing Customer *</label>
            <select
              value={newPmtCustId}
              onChange={(e) => setNewPmtCustId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
              required
            >
              <option value="">Select Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.legalName} ({c.customerNumber})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Payment Amount (ZAR) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={newPmtAmount}
              onChange={(e) => setNewPmtAmount(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Payment Received Date *</label>
            <input
              type="date"
              required
              value={newPmtDate}
              onChange={(e) => setNewPmtDate(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Payment Method *</label>
            <select
              value={newPmtMethod}
              onChange={(e) => setNewPmtMethod(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
              required
            >
              <option value="BANK_TRANSFER">Bank Transfer (EFT)</option>
              <option value="CARD">Credit/Debit Card</option>
              <option value="CASH">Cash Deposit</option>
              <option value="OTHER">Other Method</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">External Payment Reference *</label>
            <input
              type="text"
              required
              value={newPmtRef}
              onChange={(e) => setNewPmtRef(e.target.value)}
              placeholder="e.g. DEP-998821"
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Internal Notes</label>
            <textarea
              value={newPmtNotes}
              onChange={(e) => setNewPmtNotes(e.target.value)}
              placeholder="Verified on Standard Bank statement..."
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 h-16 font-sans"
            />
          </div>
        </form>
      </Modal>

      {/* Allocate Payment Modal */}
      <Modal
        isOpen={isAllocatePaymentModalOpen}
        onClose={() => setIsAllocatePaymentModalOpen(false)}
        title="Apply Ledger Allocation"
        description="Allocate an unapplied payment balance against a customer outstanding receivable."
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsAllocatePaymentModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAllocatePayment}>Apply Allocation</Button>
          </div>
        }
      >
        <form onSubmit={handleAllocatePayment} className="space-y-3 text-xs font-mono">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Select Unapplied Payment *</label>
            <select
              value={allocPmtId}
              onChange={(e) => {
                setAllocPmtId(e.target.value);
                setAllocRecId('');
                setAllocAmount('0');
              }}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
              required
            >
              <option value="">Select Payment...</option>
              {allocablePayments.map((p) => {
                const pAllocs = paymentAllocations.filter((a) => a.paymentId === p.id && !a.reversedAt);
                const totalAllocated = pAllocs.reduce((sum, a) => sum + a.allocatedAmount, 0);
                const available = Math.max(0, p.amount - totalAllocated);
                const custName = customers.find((c) => c.id === p.customerId)?.legalName || 'Customer';
                return (
                  <option key={p.id} value={p.id}>
                    R {available.toLocaleString()} Available | {custName} ({p.externalReference || p.id.slice(-5)})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Select Receivable to Pay *</label>
            <select
              value={allocRecId}
              onChange={(e) => {
                setAllocRecId(e.target.value);
                // Set default allocAmount to the smaller of available payment or outstanding receivable
                const rec = receivables.find((r) => r.id === e.target.value);
                const pmt = payments.find((p) => p.id === allocPmtId);
                if (rec && pmt) {
                  const pAllocs = paymentAllocations.filter((a) => a.paymentId === pmt.id && !a.reversedAt);
                  const totalAllocated = pAllocs.reduce((sum, a) => sum + a.allocatedAmount, 0);
                  const available = pmt.amount - totalAllocated;
                  const autoAmount = Math.min(available, rec.outstandingAmount);
                  setAllocAmount(String(autoAmount));
                }
              }}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
              required
              disabled={!allocPmtId}
            >
              <option value="">Select Outstanding Receivable...</option>
              {allocableReceivables.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.invoiceNumber} | Outstanding: R {r.outstandingAmount.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Allocation Amount *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={allocAmount}
              onChange={(e) => setAllocAmount(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
              disabled={!allocRecId}
            />
          </div>
        </form>
      </Modal>

      {/* Reverse Allocation Modal */}
      <Modal
        isOpen={isReverseAllocationModalOpen}
        onClose={() => setIsReverseAllocationModalOpen(false)}
        title="Reverse Payment Allocation"
        description="Permanently reverse this payment allocation. Both balances will be recalculated."
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsReverseAllocationModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleReverseAllocation} disabled={!reversalReason.trim()} className="bg-rose-600 hover:bg-rose-500">
              Confirm Reversal
            </Button>
          </div>
        }
      >
        <form onSubmit={handleReverseAllocation} className="space-y-3 text-xs font-mono">
          <p className="text-slate-400 font-sans">
            This action is audited. Original allocation record remains intact while a reversal transaction is recorded.
          </p>
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Mandatory Reason *</label>
            <textarea
              required
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              placeholder="Reason for reversal (e.g., allocated to incorrect invoice)..."
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 h-20 font-sans"
            />
          </div>
        </form>
      </Modal>

      {/* Reverse Payment Modal */}
      <Modal
        isOpen={isReversePaymentModalOpen}
        onClose={() => setIsReversePaymentModalOpen(false)}
        title="Reverse Payment Record"
        description="Permanently reverse this recorded payment. All associated allocations will be rolled back."
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsReversePaymentModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleReversePayment} disabled={!reversalReason.trim()} className="bg-rose-600 hover:bg-rose-500">
              Confirm Payment Reversal
            </Button>
          </div>
        }
      >
        <form onSubmit={handleReversePayment} className="space-y-3 text-xs font-mono">
          <p className="text-slate-400 font-sans">
            WARNING: Reversing a payment rolls back all of its allocations. This action cannot be undone.
          </p>
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Mandatory Reversal Reason *</label>
            <textarea
              required
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              placeholder="Reason for reversal (e.g., bank bounce, wrong customer account)..."
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 h-20 font-sans"
            />
          </div>
        </form>
      </Modal>

      {/* Create Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Add Billing Customer"
        description="Register a commercial billing party for invoice generation."
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsCustomerModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreateCustomer}>Save Customer</Button>
          </div>
        }
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">Legal Name *</label>
            <input
              type="text"
              required
              value={newCustLegalName}
              onChange={(e) => setNewCustLegalName(e.target.value)}
              placeholder="e.g. Hyde Park Body Corporate"
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">Billing Email *</label>
            <input
              type="email"
              required
              value={newCustEmail}
              onChange={(e) => setNewCustEmail(e.target.value)}
              placeholder="accounts@hydepark.co.za"
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">Billing Address *</label>
            <textarea
              required
              value={newCustAddress}
              onChange={(e) => setNewCustAddress(e.target.value)}
              placeholder="10 Jan Smuts Avenue, Johannesburg"
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 h-16"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">Linked CRM Organisation ID (Optional)</label>
            <input
              type="text"
              value={newCustOrgId}
              onChange={(e) => setNewCustOrgId(e.target.value)}
              placeholder="org_12345"
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono"
            />
          </div>
        </form>
      </Modal>

      {/* Create Profile Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Configure Billing Profile"
        description="Set up billing frequency and invoice numbering prefix."
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsProfileModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreateProfile}>Save Profile</Button>
          </div>
        }
      >
        <form onSubmit={handleCreateProfile} className="space-y-3 text-xs">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">Billing Customer *</label>
            <select
              value={newProfCustId}
              onChange={(e) => setNewProfCustId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
              required
            >
              <option value="">Select Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.legalName} ({c.customerNumber})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">Billing Frequency</label>
            <select
              value={newProfFreq}
              onChange={(e) => setNewProfFreq(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUAL">Annual</option>
              <option value="ONE_TIME">One Time</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">Invoice Prefix</label>
            <input
              type="text"
              value={newProfPrefix}
              onChange={(e) => setNewProfPrefix(e.target.value)}
              placeholder="INV"
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono"
            />
          </div>
        </form>
      </Modal>

      {/* Create Invoice Draft Modal */}
      <Modal
        isOpen={isCreateInvoiceModalOpen}
        onClose={() => setIsCreateInvoiceModalOpen(false)}
        title="Create Invoice Draft"
        description="Initialize a new commercial invoice draft."
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsCreateInvoiceModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreateInvoice}>Create Draft</Button>
          </div>
        }
      >
        <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">Billing Customer *</label>
            <select
              value={invCustId}
              onChange={(e) => setInvCustId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
              required
            >
              <option value="">Select Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.legalName} ({c.customerNumber})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">Billing Profile (Optional)</label>
            <select
              value={invProfileId}
              onChange={(e) => setInvProfileId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
            >
              <option value="">Default Profile</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>Profile {p.invoicePrefix} (Cust: {p.billingCustomerId})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Issue Date *</label>
              <input
                type="date"
                required
                value={invIssueDate}
                onChange={(e) => setInvIssueDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={invDueDate}
                onChange={(e) => setInvDueDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">Notes / Terms</label>
            <textarea
              value={invNotes}
              onChange={(e) => setInvNotes(e.target.value)}
              placeholder="Payable via EFT to Standard Bank..."
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 h-16"
            />
          </div>
        </form>
      </Modal>

      {/* Add Invoice Line Modal */}
      <Modal
        isOpen={isAddLineModalOpen}
        onClose={() => setIsAddLineModalOpen(false)}
        title="Add Invoice Line Item"
        description="Add a service or item with server-authoritative calculation."
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsAddLineModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAddLine}>Add Line</Button>
          </div>
        }
      >
        <form onSubmit={handleAddLine} className="space-y-3 text-xs">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">Description *</label>
            <input
              type="text"
              required
              value={lineDesc}
              onChange={(e) => setLineDesc(e.target.value)}
              placeholder="Sectional Title Management Fee"
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Quantity *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={lineQty}
                onChange={(e) => setLineQty(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Unit Price (ZAR) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={linePrice}
                onChange={(e) => setLinePrice(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Discount Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={lineDiscount}
                onChange={(e) => setLineDiscount(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={lineTaxRate}
                onChange={(e) => setLineTaxRate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Void Invoice Modal */}
      <Modal
        isOpen={isVoidModalOpen}
        onClose={() => setIsVoidModalOpen(false)}
        title="Void Issued Invoice"
        description="Permanently transition invoice to VOIDED status."
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsVoidModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleVoid} disabled={!voidReason.trim()} className="bg-rose-600 hover:bg-rose-500">
              Confirm Void
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-400">
            This action is irreversible. The invoice will be marked as VOIDED and cannot be edited.
          </p>
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">Mandatory Reason *</label>
            <textarea
              required
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Reason for voiding (e.g. billing error, cancelled contract)..."
              className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 h-20"
            />
          </div>
        </div>
      </Modal>

      {/* Document Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Official Invoice Document Preview"
        description="Traceable, server-authoritative customer billing presentation."
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsPreviewModalOpen(false)}>Close Preview</Button>
          </div>
        }
      >
        {selectedDocumentForPreview && selectedInvoice ? (
          <div className="space-y-6 text-xs text-slate-300 font-sans p-4 bg-slate-900/40 rounded-lg border border-slate-800">
            {/* Invoice Header Block */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-lg font-bold text-slate-100 tracking-wide font-mono uppercase">BCIP Commercial Invoice</h1>
                <p className="text-[10px] text-slate-500 mt-0.5">Supplier: BCIP Commercial Billing Operations</p>
                <p className="text-[10px] text-slate-500">Address: 100 Body Corporate Avenue, Johannesburg</p>
              </div>
              <div className="text-right font-mono text-[10px] space-y-1">
                <p className="text-xs font-bold text-sky-400">{selectedInvoice.invoiceNumber}</p>
                <p>Date: {new Date(selectedInvoice.issueDate).toLocaleDateString()}</p>
                <p>Due: {new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                <p className="text-[9px] uppercase px-1.5 py-0.5 rounded border border-sky-800 bg-sky-950/40 text-sky-400 inline-block mt-1">
                  STATUS: {selectedInvoice.status}
                </p>
              </div>
            </div>

            {/* Parties Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Bill To:</p>
                <p className="font-semibold text-slate-100 text-sm">{selectedDocumentForPreview.metadata?.customerName || 'Billing Customer'}</p>
                <p className="text-slate-400">Customer ID: {selectedInvoice.billingCustomerId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Document Identification:</p>
                <p className="text-slate-200">Doc Reference: {selectedDocumentForPreview.documentNumber}</p>
                <p className="text-slate-200">Version: v{selectedDocumentForPreview.version}</p>
                <p className="text-slate-200">Storage Ref: {selectedDocumentForPreview.storageReference}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-800 rounded overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                  <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <th className="p-2 font-normal">Description</th>
                    <th className="p-2 font-normal text-right">Qty</th>
                    <th className="p-2 font-normal text-right">Unit Price</th>
                    <th className="p-2 font-normal text-right">Tax Rate</th>
                    <th className="p-2 font-normal text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {invoiceLines.map((line) => (
                    <tr key={line.id} className="hover:bg-slate-900/10 text-slate-300">
                      <td className="p-2">{line.description}</td>
                      <td className="p-2 text-right">{line.quantity}</td>
                      <td className="p-2 text-right">R {line.unitPrice.toLocaleString()}</td>
                      <td className="p-2 text-right">{line.taxRate}%</td>
                      <td className="p-2 text-right font-semibold text-slate-100">R {line.lineTotal?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end font-mono">
              <div className="w-64 space-y-1.5 border-t border-slate-800 pt-2 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>R {selectedInvoice.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Discount:</span>
                  <span>- R {selectedInvoice.discountTotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tax (VAT):</span>
                  <span>R {selectedInvoice.taxTotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-100 font-bold text-sm pt-1.5 border-t border-slate-800/60">
                  <span>Grand Total:</span>
                  <span className="text-emerald-400">R {selectedInvoice.grandTotal?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Verification Metadata Footnote */}
            <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 space-y-1 font-mono">
              <p className="font-bold uppercase text-slate-400 tracking-wider">Grounded Evidence Traceability Block</p>
              <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-500">
                <p>Tracking ID: <span className="text-slate-400">{selectedDocumentForPreview.id}</span></p>
                <p>Content SHA256 Checksum: <span className="text-slate-400">{selectedDocumentForPreview.contentHash}</span></p>
                <p>Generated At: <span className="text-slate-400">{new Date(selectedDocumentForPreview.generatedAt).toLocaleString()}</span></p>
                <p>Generating Actor: <span className="text-slate-400">{selectedDocumentForPreview.generatedBy}</span></p>
              </div>
              <div className="mt-2 p-2 bg-slate-900/30 border border-slate-800/50 rounded text-[9px] text-sky-400/80">
                ⚠️ Information Notice: Delivery channels configured (NOT_SENT state). Real SMTP/Mail delivery is decoupled and disabled for development.
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs">No preview data loadable.</div>
        )}
      </Modal>

      {/* Prepare Invoice Delivery Modal */}
      <Modal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        title="Prepare Invoice Document Delivery"
        description="Configure recipient, template, and confirm communication preview."
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2 w-full font-mono text-xs">
            <Button variant="secondary" size="sm" onClick={() => setIsDeliveryModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendDelivery}
              disabled={isSendingDelivery || !selectedRecipientEmail.trim() || !selectedTemplateForDelivery}
            >
              {isSendingDelivery ? 'Sending...' : 'Send Invoice Email'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSendDelivery} className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Recipient Destination Email *</label>
              <input
                type="email"
                required
                value={selectedRecipientEmail}
                onChange={(e) => setSelectedRecipientEmail(e.target.value)}
                placeholder="accounts@bodycorp.co.za"
                className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Select Delivery Template *</label>
              <select
                value={selectedTemplateForDelivery}
                onChange={(e) => setSelectedTemplateForDelivery(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100"
                required
              >
                <option value="">Select Template...</option>
                {deliveryTemplates.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Attached Document Information */}
          {selectedDocForDelivery && (
            <div className="p-2.5 bg-slate-900/30 border border-slate-800 rounded flex justify-between items-center text-[11px]">
              <div>
                <span className="text-slate-400">Attached File:</span> <span className="font-bold text-slate-200">{selectedDocForDelivery.fileName}</span>
              </div>
              <div className="text-slate-500">
                Ver: <span className="font-bold text-slate-300">v{selectedDocForDelivery.version}</span>
              </div>
            </div>
          )}

          {/* Communication Preview block */}
          {selectedTemplateForDelivery && (
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <p className="font-bold uppercase text-slate-400 tracking-wider text-[10px]">Live Customer Communication Preview</p>
              
              <div className="bg-slate-950 p-3 border border-slate-800 rounded space-y-2 text-[11px]">
                <div className="pb-2 border-b border-slate-900 flex">
                  <span className="text-slate-500 w-16">Subject:</span>
                  <span className="font-bold text-slate-200">{deliveryTemplatePreview.subject}</span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-500 block mb-1">Message Body:</span>
                  <pre className="text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">{deliveryTemplatePreview.body}</pre>
                </div>
              </div>
              
              <div className="text-[10px] text-sky-400/90 bg-sky-950/20 border border-sky-900/40 p-2 rounded">
                ℹ️ This is a preview of the invoice email communication before dispatch. Verify coordinates before confirming dispatch.
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
