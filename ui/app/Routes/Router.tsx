import React from "react";
import { type RouteObject, createBrowserRouter } from "react-router-dom";
import { App } from "../App";
import DqlQueryTab from "../pages/DqlQueryTab";
import Home from "../pages/Home";

export const AppRoutes: RouteObject[] = [
  {
    element: <App />,
    path: "/",
    children: [
      {
        element: <Home />,
        path: "",
      },
      {
        element: <DqlQueryTab />,
        path: "/query",
      },
    ],
  },
];

export const router = createBrowserRouter(AppRoutes, { basename: "/ui" });
