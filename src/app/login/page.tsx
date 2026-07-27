import { LoginForm } from "./login-form";
import { BrandMark } from "@/components/brand/mark";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="mb-8 flex flex-col items-center gap-3">
          <BrandMark size={40} />
          <div className="text-center">
            <h1 className="text-lg font-semibold text-ink">ABPO Command</h1>
            <p className="text-xs text-muted">Assorted BPO — call centre floor</p>
          </div>
        </div>
        <LoginForm next={next} />
        <p className="mt-6 text-center text-xs text-muted">
          One login per person. Lost your password? Ask your team lead.
        </p>
      </div>
    </div>
  );
}
