"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, ExternalLink } from "lucide-react";

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNumber: string;
  amountDisplay: string;
  clientName: string;
}

export function QrModal({
  isOpen,
  onClose,
  invoiceNumber,
  amountDisplay,
  clientName,
}: QrModalProps) {
  const [copied, setCopied] = useState(false);

  const paymentUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/pay/${invoiceNumber}`
      : `/pay/${invoiceNumber}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Payment Link"
      description={`Invoice ${invoiceNumber} for ${clientName}`}
    >
      <div className="flex flex-col items-center space-y-6 pt-2">
        {/* QR Code */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-center">
          <QRCodeSVG
            value={paymentUrl}
            size={190}
            level="M"
            includeMargin={true}
          />
        </div>

        {/* Amount */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Amount Due
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-0.5">
            {amountDisplay}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Settles directly on Circle Arc Mainnet
          </p>
        </div>

        {/* Shareable Link Box */}
        <div className="w-full space-y-2">
          <label className="text-xs font-medium text-slate-600 block">
            Public Payment URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={paymentUrl}
              className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 outline-none select-all"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="shrink-0 gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quick Open Action */}
        <div className="w-full pt-2 border-t border-slate-100 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button size="sm" variant="secondary" className="gap-1.5">
              <span>Open Payment Page</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </div>
    </Modal>
  );
}
