import { SignIn } from "@clerk/tanstack-react-start";
import { Link, createFileRoute } from "@tanstack/react-router";
import { clerkAppearance } from "@/lib/clerkAppearance";

export const Route = createFileRoute("/sign-in")({ component: SignInPage });

function SignInPage() {
  return (
    <div className="layout">
      <main className="container center" style={{ display: "grid", placeItems: "center" }}>
        <Link to="/" className="brand" style={{ marginBottom: 24 }}>
          <img src="/quings-logo.svg" alt="Quings" style={{ width: 56, height: 56 }} />
          <span className="name" style={{ fontSize: 38 }}>
            QUINGS
          </span>
        </Link>
        <SignIn routing="hash" signUpUrl="/sign-up" forceRedirectUrl="/" appearance={clerkAppearance} />
      </main>
    </div>
  );
}
