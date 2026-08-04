import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return <main className="error-page"><Logo /><span className="error-code">404</span><h1>This market is not here.</h1><p>The question may have moved, closed, or never existed.</p><Link className="primary-button" href="/markets"><ArrowLeft size={16} />Browse markets</Link></main>;
}
