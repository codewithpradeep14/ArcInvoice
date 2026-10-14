"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useAccount } from "@/components/providers/web3-provider";
import {
  User,
  Building,
  Wallet,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Save,
  Shield,
} from "lucide-react";
import { getActiveNetworkConfig } from "@/config/arc";

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { address: connectedWallet } = useAccount();
  const network = getActiveNetworkConfig();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [defaultWallet, setDefaultWallet] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setBusinessName(profile.business_name || "");
      setDefaultWallet(profile.default_wallet_address || "");
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          business_name: businessName,
          default_wallet_address: defaultWallet || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSaveSuccess(true);
        await refreshProfile();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Account & Settlement Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure your merchant identity and default receiving wallet for Arc USDC payments.
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Merchant Profile</CardTitle>
            <CardDescription>
              This information is displayed on your invoices and payment receipts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              {saveSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Profile and default wallet updated successfully!</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="e.g. Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <Input
                  label="Business / Studio Name"
                  placeholder="e.g. Horizon Design Studio"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <Input
                label="Account Email"
                type="email"
                disabled
                value={user?.email || ""}
                helperText="Email is associated with your authenticated Supabase session."
              />

              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Default Receiving Wallet Address
                  </label>
                  {connectedWallet && (
                    <button
                      type="button"
                      onClick={() => setDefaultWallet(connectedWallet)}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Use connected wallet
                    </button>
                  )}
                </div>
                <Input
                  placeholder="0x..."
                  className="font-mono text-xs"
                  helperText={`Pre-filled automatically whenever you create an invoice on ${network.chainName}.`}
                  value={defaultWallet}
                  onChange={(e) => setDefaultWallet(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Network & Protocol Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Active Network Infrastructure</CardTitle>
            <CardDescription>
              Configured blockchain parameters for Circle Arc USDC settlement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Blockchain Network:</span>
              <span className="font-semibold text-slate-900">{network.chainName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Chain ID (EIP-155):</span>
              <span className="font-mono font-medium text-slate-800">{network.chainId}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Arc RPC Endpoint:</span>
              <span className="font-mono text-slate-700 truncate max-w-xs">{network.rpcUrl}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Native USDC Contract:</span>
              <span className="font-mono text-slate-700 truncate max-w-xs">{network.usdcContractAddress}</span>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out Card */}
        <Card className="border-rose-100 bg-rose-50/20">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Sign Out of Session</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                End your active session on this device.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="border-rose-200 text-rose-700 hover:bg-rose-50 gap-2 shrink-0"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
