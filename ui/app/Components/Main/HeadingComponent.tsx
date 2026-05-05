import { Flex } from "@dynatrace/strato-components/layouts";
import React from "react";
import { FormattedMessage } from "react-intl";
import { appMessage } from "./messages";

const HeadingComponent: React.FC = () => {
  return (
    <Flex flexDirection="column" alignItems="center">
      <FormattedMessage {...appMessage} />
    </Flex>
  );
};

export default HeadingComponent;
