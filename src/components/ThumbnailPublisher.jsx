import { lazy, Suspense, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Worker = lazy(() => import('./ThumbnailPublisherWorker'));
export default function ThumbnailPublisher() {
  const { user } = useContext(AuthContext) || {}, { pathname } = useLocation();
  // Guests and public catalog readers never load the renderer or generate images.
  if (!user?.id || !/\/(library|export)\/?$/.test(pathname)) return null;
  return <Suspense fallback={null}><Worker key={user.id} ownerId={user.id}/></Suspense>;
}
