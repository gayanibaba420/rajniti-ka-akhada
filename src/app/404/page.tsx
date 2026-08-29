import type { Metadata } from "next";
import { NotFoundView } from "@/components/not-found-view";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default NotFoundView;
