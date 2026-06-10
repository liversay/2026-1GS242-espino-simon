/**
 * Apariencia 100% personalizada de Clerk para combinar con la estética Quings.
 * Se aplica a <SignIn>, <SignUp>, <UserButton>, <UserProfile> vía la prop `appearance`.
 */

export const clerkAppearance = {
  variables: {
    colorPrimary: "#EBB63F",
    colorText: "#F4EEDD",
    colorTextSecondary: "rgba(244,238,221,0.82)",
    // Clerk genera TODOS los grises secundarios (valores de email, cuenta conectada,
    // "Secured by Clerk", bordes) a partir de colorNeutral; por defecto es negro y queda
    // ilegible sobre el verde oscuro. Lo ponemos crema para que esos textos se aclaren.
    colorNeutral: "#F4EEDD",
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
    headerSubtitle: { color: "rgba(244,238,221,0.82)" },
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

    // Panel "Detalles del perfil" (openUserProfile): forzamos texto crema porque varios
    // elementos no heredan colorText y quedaban ilegibles sobre el fondo verde.
    navbar: { background: "transparent" },
    navbarButton: { color: "#F4EEDD" },
    navbarButtonText: { color: "#F4EEDD" },
    navbarButtonIcon: { color: "#F4EEDD" },
    pageScrollBox: { color: "#F4EEDD" },
    profileSection: { color: "#F4EEDD" },
    profileSectionTitleText: { color: "#F8D86B" },
    profileSectionContent: { color: "#F4EEDD" },
    profileSectionPrimaryButton: { color: "#F8D86B" },
    accordionTriggerButton: { color: "#F4EEDD" },
    accordionContent: { color: "#F4EEDD" },
    menuButton: { color: "#F4EEDD" },
    // Identificadores: el correo primario y el correo de la cuenta conectada (Google)
    // salían en gris oscuro. Los forzamos a crema legible.
    userPreviewMainIdentifier: { color: "#F4EEDD" },
    userPreviewSecondaryIdentifier: { color: "rgba(244,238,221,0.9)" },
    breadcrumbsItem: { color: "rgba(244,238,221,0.75)" },
    breadcrumbsItemCurrent: { color: "#F8D86B" },
    // Valores de datos (texto del correo/teléfono en cada fila) y pie "Secured by Clerk".
    formFieldSuccessText: { color: "rgba(244,238,221,0.85)" },
    formFieldInfoText: { color: "rgba(244,238,221,0.75)" },
    footerActionText: { color: "rgba(244,238,221,0.8)" },
  },
} as const;
