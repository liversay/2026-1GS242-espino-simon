/**
 * Apariencia 100% personalizada de Clerk para combinar con la estética Quings.
 * Se aplica a <SignIn>, <SignUp>, <UserButton>, <UserProfile> vía la prop `appearance`.
 */

export const clerkAppearance = {
  variables: {
    colorPrimary: "#EBB63F",
    colorText: "#F4EEDD",
    colorTextSecondary: "rgba(244,238,221,0.7)",
    colorBackground: "#0A3327",
    colorInputBackground: "#06211A",
    colorInputText: "#F4EEDD",
    colorTextOnPrimaryBackground: "#06140F",
    colorDanger: "#E2718A",
    borderRadius: "12px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  elements: {
    rootBox: { width: "100%" },
    card: {
      backgroundColor: "rgba(10,51,39,0.92)",
      border: "1px solid rgba(248,216,107,0.22)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
      backdropFilter: "blur(8px)",
    },
    headerTitle: {
      fontFamily: "'Bebas Neue', sans-serif",
      letterSpacing: "0.06em",
      fontSize: "30px",
      color: "#F8D86B",
    },
    headerSubtitle: { color: "rgba(244,238,221,0.65)" },
    socialButtonsBlockButton: {
      backgroundColor: "#06211A",
      border: "1px solid rgba(248,216,107,0.25)",
      color: "#F4EEDD",
    },
    dividerLine: { backgroundColor: "rgba(248,216,107,0.2)" },
    dividerText: { color: "rgba(244,238,221,0.55)" },
    formFieldLabel: { color: "rgba(244,238,221,0.8)", fontWeight: 600 },
    formFieldInput: {
      backgroundColor: "#06211A",
      border: "1px solid rgba(248,216,107,0.2)",
      color: "#F4EEDD",
    },
    formButtonPrimary: {
      background: "linear-gradient(180deg,#F8D86B,#C8922B)",
      color: "#06140F",
      fontWeight: 800,
      textTransform: "none",
      boxShadow: "0 4px 0 rgba(0,0,0,0.35)",
    },
    footerActionLink: { color: "#F8D86B" },
    footer: { background: "transparent" },
    userButtonPopoverCard: {
      backgroundColor: "rgba(10,51,39,0.96)",
      border: "1px solid rgba(248,216,107,0.22)",
    },
    userButtonPopoverActionButton: { color: "#F4EEDD" },
    badge: { backgroundColor: "rgba(248,216,107,0.18)", color: "#F8D86B" },
  },
} as const;
