import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageSkeleton } from "@/components/feature/Loaders";

// Lazy-loaded pages (map named exports to default for React.lazy)
const Home = lazy(() => import("@/pages/Home").then((m) => ({ default: m.Home })));
const DetectPage = lazy(() =>
  import("@/pages/Detect").then((m) => ({ default: m.DetectPage })),
);
const SearchResults = lazy(() =>
  import("@/pages/SearchResults").then((m) => ({ default: m.SearchResults })),
);
const SongPage = lazy(() => import("@/pages/Song").then((m) => ({ default: m.SongPage })));
const ArtistPage = lazy(() =>
  import("@/pages/Artist").then((m) => ({ default: m.ArtistPage })),
);
const AlbumPage = lazy(() =>
  import("@/pages/Album").then((m) => ({ default: m.AlbumPage })),
);
const Favorites = lazy(() =>
  import("@/pages/Favorites").then((m) => ({ default: m.Favorites })),
);
const Trending = lazy(() =>
  import("@/pages/Trending").then((m) => ({ default: m.Trending })),
);
const About = lazy(() => import("@/pages/About").then((m) => ({ default: m.About })));
const NotFound = lazy(() =>
  import("@/pages/NotFound").then((m) => ({ default: m.NotFound })),
);

function PageLoader() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageSkeleton />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          index
          element={
            <Suspense fallback={<PageLoader />}>
              <Home />
            </Suspense>
          }
        />
        <Route
          path="detect"
          element={
            <Suspense fallback={<PageLoader />}>
              <DetectPage />
            </Suspense>
          }
        />
        <Route
          path="search"
          element={
            <Suspense fallback={<PageLoader />}>
              <SearchResults />
            </Suspense>
          }
        />
        <Route
          path="song/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <SongPage />
            </Suspense>
          }
        />
        <Route
          path="artist/:name"
          element={
            <Suspense fallback={<PageLoader />}>
              <ArtistPage />
            </Suspense>
          }
        />
        <Route
          path="album/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <AlbumPage />
            </Suspense>
          }
        />
        <Route
          path="favorites"
          element={
            <Suspense fallback={<PageLoader />}>
              <Favorites />
            </Suspense>
          }
        />
        <Route
          path="trending"
          element={
            <Suspense fallback={<PageLoader />}>
              <Trending />
            </Suspense>
          }
        />
        <Route
          path="about"
          element={
            <Suspense fallback={<PageLoader />}>
              <About />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<PageLoader />}>
              <NotFound />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
