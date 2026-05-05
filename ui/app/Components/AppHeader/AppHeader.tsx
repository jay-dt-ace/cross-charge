import { AppHeader as Header } from "@dynatrace/strato-components-preview/layouts";
import React from "react";
import { FormattedMessage } from "react-intl";
import { NavLink } from "react-router-dom";
import { appNameMessage, homeTabMessage, queryTabMessage } from "./messages";

const AppHeader: React.FC = () => {
  return (
    <Header>
      {/* Nav Items in App Header */}
      {/* Updated names: https://developer.dynatracelabs.com/design/components-preview/layouts/AppHeader/#note-updated-navigation-component-names */}
      <Header.Navigation>
        <Header.Logo
          as={NavLink}
          to="/"
          appName={appNameMessage.defaultMessage}
        />
        <Header.NavigationItem to="/" as={NavLink}>
          <FormattedMessage {...homeTabMessage} />
        </Header.NavigationItem>
        <Header.NavigationItem to="/query" as={NavLink}>
          <FormattedMessage {...queryTabMessage} />
        </Header.NavigationItem>
      </Header.Navigation>
    </Header>
  );
};

export default AppHeader;
