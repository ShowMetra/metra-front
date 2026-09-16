import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 font-semibold tracking-tight">
      <span className="grid size-9 place-items-center rounded-xl bg-[#176c4c] text-sm font-bold text-white">SM</span>
      <span className="text-lg">ShowMetra</span>
    </Link>
  );
}
