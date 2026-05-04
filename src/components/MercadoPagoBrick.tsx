"use client";

import { useEffect, useRef } from "react";

interface Props {
  preferenceId: string;
  total: number;
  onSuccess: (paymentId: string) => void;
  onError: () => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MercadoPago: any;
  }
}

export default function MercadoPagoBrick({ preferenceId, total, onSuccess, onError }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controllerRef = useRef<any>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;

    async function initBrick() {
      // Destruir instancia previa si existe
      if (controllerRef.current) {
        try { await controllerRef.current.unmount(); } catch { /* ignore */ }
        controllerRef.current = null;
      }

      // Limpiar el contenedor
      const container = document.getElementById("mp-payment-brick");
      if (container) container.innerHTML = "";

      const loadScript = (): Promise<void> =>
        new Promise((resolve) => {
          if (window.MercadoPago) { resolve(); return; }
          const existing = document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]');
          if (existing) { existing.addEventListener("load", () => resolve()); return; }
          const script = document.createElement("script");
          script.src = "https://sdk.mercadopago.com/js/v2";
          script.async = true;
          script.onload = () => resolve();
          document.head.appendChild(script);
        });

      await loadScript();
      if (cancelled) return;

      const mp = new window.MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY, { locale: "es-CO" });
      const bricksBuilder = mp.bricks();

      controllerRef.current = await bricksBuilder.create("payment", "mp-payment-brick", {
        initialization: { amount: total, preferenceId },
        customization: {
          paymentMethods: { creditCard: "all", debitCard: "all", bankTransfer: "all", mercadoPago: "all" },
          visual: {
            style: {
              theme: "dark",
              customVariables: {
                baseColor: "#CC1244",
                baseColorFirstVariant: "#a00e35",
                baseColorSecondVariant: "#7a0a28",
                fontSizeSmall: "12px",
                borderRadiusLarge: "4px",
                borderRadiusMedium: "4px",
                borderRadiusSmall: "4px",
              },
            },
          },
        },
        callbacks: {
          onReady: () => {},
          onSubmit: (param: { paymentType?: string; formData: Record<string, unknown> | null; additionalData?: Record<string, unknown> }) => {
            const { formData, paymentType } = param;
            // Wallet: MP ya procesó el pago internamente
            if (paymentType === "wallet_purchase" || !formData) {
              onSuccessRef.current("wallet_purchase");
              return Promise.resolve();
            }
            return new Promise<void>((resolve, reject) => {
              fetch("/api/pagos/procesar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.id && (data.status === "approved" || data.status === "pending")) {
                    onSuccessRef.current(String(data.id));
                    resolve();
                  } else {
                    reject();
                  }
                })
                .catch(() => reject());
            });
          },
          onError: (err: unknown) => {
            console.error("MP Brick error:", err);
            onErrorRef.current();
          },
        },
      });
    }

    initBrick();

    return () => {
      cancelled = true;
      if (controllerRef.current) {
        try { controllerRef.current.unmount(); } catch { /* ignore */ }
        controllerRef.current = null;
      }
    };
  }, [preferenceId, total]);

  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      <div id="mp-payment-brick" />
    </div>
  );
}
