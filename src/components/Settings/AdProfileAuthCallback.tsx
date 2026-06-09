import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../lib/axios";

type PlatformKey = "google" | "tiktok";
type PlatformApiKey = "GOOGLE" | "TIKTOK";

interface AdAccount {
  account_id?: string;
  acc_id: string;
  name?: string;
  account_name?: string;
}

interface PagingCursors {
  before: string;
  after: string;
}

interface AdAccountsResponse {
  data: AdAccount[];
  paging?: {
    cursors: PagingCursors;
  };
}

interface AdProfileAuthCallbackProps {
  platform: PlatformKey;
  platformApiKey: PlatformApiKey;
  platformName: string;
}

const AdProfileAuthCallback = ({
  platform,
  platformApiKey,
  platformName,
}: AdProfileAuthCallbackProps) => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState({
    accounts: true,
    saving: false,
  });
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AdAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [_pagingCursors, setPagingCursors] = useState<PagingCursors | null>(null);

  // Google Ads flow states
  const [subAccounts, setSubAccounts] = useState<AdAccount[]>([]);
  const [selectedSubAccount, setSelectedSubAccount] = useState<AdAccount | null>(null);
  const [loadingSubAccounts, setLoadingSubAccounts] = useState(false);

  const getOrgId = (): string => {
    const urlOrgId = searchParams.get("state");
    if (urlOrgId) return urlOrgId;

    const localOrgId = localStorage.getItem("org_id");
    if (localOrgId) return localOrgId;

    const selectedOrg = localStorage.getItem("selectedOrganization");
    if (selectedOrg) {
      try {
        const org = JSON.parse(selectedOrg);
        if (org.id) return org.id;
      } catch (e) {
        console.error("Error parsing selectedOrganization", e);
      }
    }

    return "";
  };

  const org_id = getOrgId();

  const getAccountKey = (account: AdAccount) => account.acc_id || account.account_id || "";

  useEffect(() => {
    if (org_id) {
      fetchAdAccounts();
    } else {
      setError("No organization ID found. Please select an organization first.");
      setLoading({ accounts: false, saving: false });
    }
  }, [org_id]);

  const fetchAdAccounts = async () => {
    try {
      setLoading((prev) => ({ ...prev, accounts: true }));
      const isGoogle = platform === "google";
      const endpoint = "/main/get-ad-profiles";
      const queryParams = isGoogle
        ? { platform: "GOOGLE", org_id }
        : { platform, org_id };

      const response = await api.get<AdAccountsResponse>(endpoint, {
        params: queryParams,
      });
      setAdAccounts(response.data.data || []);
      if (response.data.paging?.cursors) {
        setPagingCursors(response.data.paging.cursors);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch ad accounts");
      console.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, accounts: false }));
    }
  };

  const fetchSubAccounts = async (managerId: string) => {
    try {
      setLoadingSubAccounts(true);
      setError(null);
      const response = await api.get<AdAccountsResponse>("/main/get-ad-profiles", {
        params: {
          platform: "GOOGLE",
          org_id,
          manager_id: managerId,
        },
      });
      setSubAccounts(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch sub-accounts");
      console.error(err);
    } finally {
      setLoadingSubAccounts(false);
    }
  };

  const handleSelectAccount = (account: AdAccount) => {
    setSelectedAccount(account);
    if (platform === "google") {
      setSelectedSubAccount(null);
      setSubAccounts([]);
      fetchSubAccounts(account.acc_id);
    }
  };

  const handleSave = async () => {
    if (!selectedAccount) {
      setError("Please select an ad account");
      return;
    }

    if (platform === "google" && !selectedSubAccount) {
      setError("Please select a client account");
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, saving: true }));

      const payload = platform === "google"
        ? {
            platform: "GOOGLE",
            manager_id: selectedAccount.acc_id,
            acc_id: selectedSubAccount?.acc_id,
          }
        : {
            platform: platformApiKey,
            acc_id: selectedAccount.acc_id,
          };

      await api.post(`/main/select-ad-profile/?org_id=${org_id}`, payload);

      setTimeout(() => {
        window.location.href = "/user-dashboard/dashboard";
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save selection");
      console.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, saving: false }));
    }
  };

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-12">
      <div
        className="animate-spin rounded-full h-8 w-8 border-2"
        style={{ borderColor: "#3B82F6", borderTopColor: "transparent" }}
      ></div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="bg-red-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">Error</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.href = "/organizations"}
              className="px-3 py-1.5 text-white text-sm rounded transition-colors"
              style={{ backgroundColor: "#3B82F6" }}
            >
              Select Organization
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!org_id) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="bg-yellow-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">No Organization Selected</h3>
            <p className="text-sm text-gray-500 mb-4">Please select an organization to continue</p>
            <button
              onClick={() => window.location.href = "/organizations"}
              className="px-3 py-1.5 text-white text-sm rounded transition-colors"
              style={{ backgroundColor: "#3B82F6" }}
            >
              Select Organization
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-gray-900">Connect {platformName} Account</h1>
          <p className="text-sm text-gray-500 mt-1">Select your ad account</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Step 1</span>
              <h2 className="text-base font-medium text-gray-900">
                {platform === "google" ? "Manager Accounts" : "Ad Accounts"}
              </h2>
            </div>
            {loading.accounts && (
              <div className="flex items-center gap-1">
                <div
                  className="animate-spin rounded-full h-3 w-3 border-b"
                  style={{ borderColor: "#3B82F6" }}
                ></div>
                <span className="text-xs text-gray-500">Loading...</span>
              </div>
            )}
          </div>

          {loading.accounts ? (
            <LoadingSpinner />
          ) : adAccounts.length === 0 ? (
            <div className="border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-sm text-gray-400">No {platform === "google" ? "manager" : "ad"} accounts found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {adAccounts.map((account) => {
                const accountKey = getAccountKey(account);
                const selectedAccountKey = selectedAccount ? getAccountKey(selectedAccount) : "";
                const accountLabel = account.name || account.account_name || account.account_id || account.acc_id;
                const isSelected = selectedAccountKey === accountKey;

                return (
                  <div
                    key={accountKey}
                    onClick={() => handleSelectAccount(account)}
                    className={`
                      border rounded-lg p-4 cursor-pointer transition-all duration-150
                      ${isSelected ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">{platform === "google" ? "Manager ID" : "Account ID"}</p>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">{accountLabel}</p>
                        <p className="text-xs text-gray-400 mt-1">{account.acc_id}</p>
                      </div>

                      {isSelected && (
                        <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 2: Client Accounts (only for Google) */}
          {platform === "google" && selectedAccount && (
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Step 2</span>
                  <h2 className="text-base font-medium text-gray-900">Client Accounts</h2>
                </div>
                {loadingSubAccounts && (
                  <div className="flex items-center gap-1">
                    <div
                      className="animate-spin rounded-full h-3 w-3 border-b"
                      style={{ borderColor: "#3B82F6" }}
                    ></div>
                    <span className="text-xs text-gray-500">Loading sub-accounts...</span>
                  </div>
                )}
              </div>

              {loadingSubAccounts ? (
                <LoadingSpinner />
              ) : subAccounts.length === 0 ? (
                <div className="border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-sm text-gray-400">No client accounts found under this manager account</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {subAccounts.map((account) => {
                    const accountKey = getAccountKey(account);
                    const selectedSubAccountKey = selectedSubAccount ? getAccountKey(selectedSubAccount) : "";
                    const accountLabel = account.name || account.account_name || account.account_id || account.acc_id;
                    const isSelected = selectedSubAccountKey === accountKey;

                    return (
                      <div
                        key={accountKey}
                        onClick={() => setSelectedSubAccount(account)}
                        className={`
                          border rounded-lg p-4 cursor-pointer transition-all duration-150
                          ${isSelected ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Client Account ID</p>
                            <p className="text-sm font-medium text-gray-900 mt-0.5">{accountLabel}</p>
                            <p className="text-xs text-gray-400 mt-1">{account.acc_id}</p>
                          </div>

                          {isSelected && (
                            <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={
              platform === "google"
                ? !selectedAccount || !selectedSubAccount || loading.saving || loading.accounts || loadingSubAccounts
                : !selectedAccount || loading.saving || loading.accounts
            }
            className="px-6 py-2 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: "#3B82F6" }}
          >
            {loading.saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Saving...</span>
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>

        {platform === "google" && selectedAccount && selectedSubAccount && !loading.saving && !loading.accounts && !loadingSubAccounts && (
          <div className="mt-4 text-right text-xs text-gray-500">
            Ready to save: {selectedSubAccount.name || selectedSubAccount.account_name || selectedSubAccount.account_id}
          </div>
        )}
        {platform !== "google" && selectedAccount && !loading.saving && !loading.accounts && (
          <div className="mt-4 text-right text-xs text-gray-500">
            Ready to save: {selectedAccount.name || selectedAccount.account_name || selectedAccount.account_id}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdProfileAuthCallback;
