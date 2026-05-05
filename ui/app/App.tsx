import { Page } from '@dynatrace/strato-components-preview/layouts';
import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './Components/AppHeader/AppHeader';

export const App = () => {
  return (
    <Page>
      <Page.Header>
        <AppHeader />
      </Page.Header>
      <Page.Main>
        <Outlet />
      </Page.Main>
    </Page>
  );
};
