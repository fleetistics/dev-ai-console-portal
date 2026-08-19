import { Outlet } from 'react-router';
import { InitAppBackground } from '../../app.Impl/init-components/init-app-background';

export function BaseInitPageLayout() {
  return (
    <InitAppBackground>
      <Outlet />
    </InitAppBackground>
  );
}
