import Link from "next/link";

type AccessDeniedProps = {
  title?: string;
  message: string;
};

export function AccessDenied({
  title = "ไม่มีสิทธิ์เข้าถึง",
  message,
}: AccessDeniedProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="card-whitespace max-w-md text-center">
        <h1 className="text-xl font-bold text-navy-900">{title}</h1>
        <p className="mt-2 text-sm text-text-secondary">{message}</p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-semibold text-blue-primary hover:underline"
        >
          กลับหน้าหลัก →
        </Link>
      </div>
    </div>
  );
}
