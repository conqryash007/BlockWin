"use client";

import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface TronWalletConnectQRModalProps {
  open: boolean;
  uri: string | null;
  onClose: () => void;
  onCopyLink?: () => void;
}

export function TronWalletConnectQRModal({
  open,
  uri,
  onClose,
  onCopyLink,
}: TronWalletConnectQRModalProps) {
  const handleCopy = () => {
    if (uri) {
      navigator.clipboard.writeText(uri);
      onCopyLink?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[calc(100%-32px)] sm:max-w-[360px] rounded-xl p-6 bg-[#0d0f11] border-white/10 text-white gap-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center text-white">
            WalletConnect
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="w-[200px] h-[200px] rounded-xl bg-white p-4 flex items-center justify-center">
            {uri ? (
              <QRCodeSVG
                value={uri}
                size={168}
                level="M"
                includeMargin={false}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#0d0f11]">
                <Loader2 className="w-10 h-10 animate-spin" />
                <span className="text-xs">Generating QR code...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Scan this QR Code with your phone
          </p>
          {uri && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Copy link
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
