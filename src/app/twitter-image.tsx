import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CINEWORLD — Vive la Magia del Cine";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          position: "relative",
        }}
      >
        {/* Red accent bar top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            backgroundColor: "#CC1244",
          }}
        />

        {/* Film strip decorative left */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 80,
            backgroundColor: "#111",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
            padding: "20px 0",
          }}
        >
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              style={{
                width: 40,
                height: 28,
                backgroundColor: "#1a1a1a",
                margin: "0 auto",
                borderRadius: 3,
              }}
            />
          ))}
        </div>

        {/* Film strip decorative right */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 80,
            backgroundColor: "#111",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
            padding: "20px 0",
          }}
        >
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              style={{
                width: 40,
                height: 28,
                backgroundColor: "#1a1a1a",
                margin: "0 auto",
                borderRadius: 3,
              }}
            />
          ))}
        </div>

        {/* Glow effect */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 300,
            borderRadius: "50%",
            backgroundColor: "#CC1244",
            opacity: 0.08,
            filter: "blur(80px)",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              backgroundColor: "#CC1244",
              borderRadius: 12,
            }}
          >
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v2a1 1 0 010 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a1 1 0 010-2V6z" />
            </svg>
          </div>

          {/* Brand name */}
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: "white",
              letterSpacing: "0.15em",
              lineHeight: 1,
            }}
          >
            CINEWORLD
          </div>

          {/* Red separator */}
          <div
            style={{
              width: 80,
              height: 4,
              backgroundColor: "#CC1244",
              borderRadius: 2,
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontSize: 28,
              color: "#9ca3af",
              letterSpacing: "0.3em",
              fontWeight: 400,
            }}
          >
            VIVE LA MAGIA DEL CINE
          </div>

          {/* Sub info */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 8,
            }}
          >
            <div
              style={{
                fontSize: 18,
                color: "#CC1244",
                letterSpacing: "0.2em",
                fontWeight: 500,
              }}
            >
              CARTELERA
            </div>
            <div style={{ width: 4, height: 4, backgroundColor: "#4b5563", borderRadius: "50%" }} />
            <div
              style={{
                fontSize: 18,
                color: "#CC1244",
                letterSpacing: "0.2em",
                fontWeight: 500,
              }}
            >
              BOLETOS EN LÍNEA
            </div>
            <div style={{ width: 4, height: 4, backgroundColor: "#4b5563", borderRadius: "50%" }} />
            <div
              style={{
                fontSize: 18,
                color: "#CC1244",
                letterSpacing: "0.2em",
                fontWeight: 500,
              }}
            >
              MR OUTLET
            </div>
          </div>
        </div>

        {/* Red accent bar bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            backgroundColor: "#CC1244",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
