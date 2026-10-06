"use client";

import { useEffect, useState } from "react";

export interface WompiCheckoutData {
  publicKey: string;
  currency: "COP";
  amountInCents: number;
  reference: string;
  signature: string;
  expirationTime: string;
  redirectUrl: string;
}

interface Props {
  data: WompiCheckoutData;
  customer: { email: string; nombre: string; telefono?: string };
  label: string;
  onResult: (transactionId: string) => void;
  onError: () => void;
}

interface WidgetCheckoutResult {
  transaction?: { id: string; status: string };
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WidgetCheckout: any;
  }
}

const SCRIPT_SRC = "https://checkout.wompi.co/widget.js";

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.WidgetCheckout) { resolve(); return; }
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
}

export default function WompiCheckout({ data, customer, label, onResult, onError }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadScript().then(() => setReady(true)).catch(onError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrir = () => {
    const telefono = customer.telefono?.replace(/\D/g, "");
    const checkout = new window.WidgetCheckout({
      currency:       data.currency,
      amountInCents:  data.amountInCents,
      reference:      data.reference,
      publicKey:      data.publicKey,
      signature:      { integrity: data.signature },
      redirectUrl:    data.redirectUrl,
      expirationTime: data.expirationTime,
      customerData: {
        email:    customer.email,
        fullName: customer.nombre,
        ...(telefono && telefono.length >= 10 && { phoneNumber: telefono, phoneNumberPrefix: "+57" }),
      },
    });

    checkout.open((result: WidgetCheckoutResult) => {
      if (result?.transaction?.id) onResult(result.transaction.id);
    });
  };

  return (
    <button
      onClick={abrir}
      disabled={!ready}
      className="w-full bg-[#CC1244] hover:bg-[#a00e35] disabled:opacity-40 disabled:cursor-not-allowed text-white font-heading text-sm tracking-widest py-3 rounded-sm transition-all flex items-center justify-center gap-2"
    >
      {ready ? label : (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />CARGANDO...</>)}
    </button>
  );
}
