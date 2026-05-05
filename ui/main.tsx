import React from "react";
import ReactDOM from "react-dom/client";
import { ToastContainer } from "@dynatrace/strato-components/notifications";
import { AppRoot } from "@dynatrace/strato-components/core";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/Routes/Router";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <AppRoot>
    <RouterProvider router={router} />
    <ToastContainer />
  </AppRoot>,
);
