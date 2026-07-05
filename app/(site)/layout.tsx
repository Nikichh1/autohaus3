import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { PageTransition } from "@/components/transition/PageTransition";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import { Grain } from "@/components/fx/Grain";
import { Cursor } from "@/components/fx/Cursor";
import { TrackPageView } from "@/components/fx/TrackPageView";

/**
 * Public marketing-site chrome. Everything that used to live in the root layout
 * now lives here so it applies only to public routes, never to /admin.
 *
 * Public routes render STATICALLY and refresh via on-demand revalidation: admin
 * mutations (vehicles, settings, CMS, leads) call revalidatePath() for the routes
 * they affect. Pages that need request data (e.g. /kontakti reads searchParams)
 * opt back into dynamic rendering themselves.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ScrollProgress />
      <SmoothScroll>
        <PageTransition>
          <Nav />
          <main className="overflow-x-clip">{children}</main>
          <Footer />
        </PageTransition>
      </SmoothScroll>
      <Grain />
      <Cursor />
      <TrackPageView />
    </>
  );
}
