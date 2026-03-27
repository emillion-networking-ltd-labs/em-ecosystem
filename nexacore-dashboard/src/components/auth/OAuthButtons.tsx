import { Github } from "lucide-react";
import GoogleIcon from "@/components/icons/GoogleIcon";
import Button from "@/components/ui/Button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function OAuthButtons() {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Google — full page redirect to backend OAuth initiation */}
      <Button as="a" href={`${API_BASE_URL}/auth/google`} variant="outline">
        <GoogleIcon
          width={16}
          height={16}
          className="text-content-primary/50"
        />
        Continue with Google
      </Button>

      {/* GitHub — full page redirect to backend OAuth initiation */}
      <Button as="a" href={`${API_BASE_URL}/auth/github`} variant="outline">
        <Github size={16} className="text-content-primary/50" />
        Continue with GitHub
      </Button>
    </div>
  );
}
